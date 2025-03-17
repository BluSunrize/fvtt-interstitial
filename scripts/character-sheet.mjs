import { LINK_STRENGTHS_ICONS, ROLL_MODIFIERS, STATS } from "../interstitial.mjs";

export class CharacterActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["interstitial", "sheet", "actor"],
      template: "systems/interstitial/templates/actor/character-sheet.hbs",
      width: 800,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "links" }],
      dragDrop: [{ dragSelector: '.item.link', dropSelector: '.link-list' }],
    });
  }

  /** @override */
  getData(options = {}) {
    const context = super.getData(options);
    const actorData = context.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Build stats array & link lists
    context.system.statsAndLinks = STATS.reduce((obj, x) => (obj[x] = {
      value: -1, // stats start at -1
      links: []
    }, obj), {});
    // Determine stats from links
    context.items.forEach(item => {
      if (item.type === 'link') {
        context.system.statsAndLinks[item.system.stat].value += 1;
        context.system.statsAndLinks[item.system.stat].links.push(foundry.utils.mergeObject(item, {
          strength_icon: LINK_STRENGTHS_ICONS[item.system.strength],
        }));
      }
    });

    // Build harm array, starting at 1
    context.system.harm_options = Array.fromRange(context.system.harm.max, context.system.harm.min + 1);
    // Establish roll modes for stat buttons
    context.system.roll_modifiers = Object.keys(ROLL_MODIFIERS).reduce((obj, x) => (obj[x] = `interstitial.roll_modifier.${x}`, obj), {});

    return context;
  }

  /** @override */
  _getSubmitData(updateData = {}) {
    const data = super._getSubmitData(updateData);

    const currentHarm = this.object.system.harm.value;

    // build harm clock as a dictionary
    const harm_clock = {};
    Object.keys(data).forEach(key => {
      if (key.startsWith('system.harm_clock.'))
        harm_clock[parseInt(key.replace('system.harm_clock.', ''))] = data[key];
    });

    // find checkbox that is unset and lower, or set and higher
    const harm_decr = Object.keys(harm_clock).find(key => (!harm_clock[key] && key <= currentHarm));
    const harm_incr = Object.keys(harm_clock).find(key => (harm_clock[key] && key > currentHarm));
    if (harm_decr)
      data['system.harm.value'] = harm_decr - 1;
    else if (harm_incr)
      data['system.harm.value'] = harm_incr;

    return data;
  }


  /** @override */
  activateListeners(html) {
    if (!html)
      return;
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Rolling dice
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Spending a link
    html.on('click', '.spend-link', this._onSpendLink.bind(this));


    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /** @override */
  async _onDropItem(event, data) {
    const item = await Item.implementation.fromDropData(data);

    const sameActor = this.actor.uuid === item.parent?.uuid;
    if (!sameActor)
      return;

    // this is a re-implementation of vanilla logic which differentiates
    // between moving and copying items
    const isCopying = event.ctrlKey;
    if (!this.actor.isOwner)
      return false;
    const itemData = item.toObject();

    // change stat of the link
    const targetStat = $(event.currentTarget).parents('.stat-column').data('stat');
    if (itemData.system.stat !== targetStat)
      await this.actor.updateEmbeddedDocuments("Item", [{
        '_id': itemData._id,
        'system.stat': targetStat,
      }]);

    // Handle item sorting within the same Actor, unless copying
    if (sameActor && !isCopying)
      return this._onSortItem(event, itemData);
  }

  /** @override */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete data["type"];
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  _onRoll(event) {
    event.preventDefault();
    const element = $(event.currentTarget).find('[data-roll]')[0];
    const dataset = element.dataset;

    // // Handle item rolls.
    // if (dataset.rollType) {
    //   if (dataset.rollType == 'item') {
    //     const itemId = element.closest('.item').dataset.itemId;
    //     const item = this.actor.items.get(itemId);
    //     if (item) return item.roll();
    //   }
    // }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
        system: {
          stat: dataset.stat ? dataset.stat : null,
          roll_modifier: this.actor.system.roll_modifier !== Object.keys(ROLL_MODIFIERS)[0] ? this.actor.system.roll_modifier : null,
        },
      });
      return roll;
    }
  }

  _onSpendLink(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents('.item.link');
    return this.actor.updateEmbeddedDocuments("Item", [{
      '_id': li.data('itemId'),
      'system.spent': true,
    }]);
  }

}