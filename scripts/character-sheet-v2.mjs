import { LINK_STRENGTHS_ICONS, ROLL_MODIFIERS, STATS } from "../interstitial.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class CharacterActorSheetV2 extends HandlebarsApplicationMixin(ActorSheetV2) {

    /** @override */
    // static get defaultOptions() {
    //     return foundry.utils.mergeObject(super.defaultOptions, {
    //         classes: ["interstitial", "sheet", "actor"],
    //         template: "systems/interstitial/templates/actor/character-sheet.hbs",
    //         width: 800,
    //         height: 600,
    //         tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "links" }],
    //         dragDrop: [
    //             { dragSelector: '.item.link', dropSelector: '.link-list' },
    //             { dragSelector: '.item.move', dropSelector: '.move-list' },
    //         ],
    //     });
    // }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ["interstitial", "sheet", "actor"],
        position: {
            width: 800,
            height: 800
        },
        window: {
            resizable: true,
        },
        form: {
            submitOnChange: true,
        },
    }

    /** @inheritDoc */
    static TABS = {
        primary: {
            initial: 'links_stats',
            tabs: [
                { id: 'links_stats' },
                { id: 'moves' },
                { id: 'story' },
                { id: 'adventure' },
                { id: 'inventory' },
                { id: "settings" }
            ],
            labelPrefix: 'interstitial.label.character_sheet',
        }
    }

    /** @inheritDoc */
    static PARTS = {
        header: {
            template: 'systems/interstitial/templates/actor/character-header.hbs',
        },
        tabs: {
            // Foundry-provided generic template
            template: 'templates/generic/tab-navigation.hbs',
            // classes: ['sysclass'], // Optionally add extra classes to the part for extra customization
        },
        links_stats: {
            template: 'systems/interstitial/templates/actor/tab-links-stats.hbs',
            scrollable: [''],
        },
        moves: {
            template: 'systems/interstitial/templates/actor/tab-moves.hbs',
            scrollable: [''],
        },
        story: {
            template: 'systems/interstitial/templates/actor/tab-story.hbs',
            scrollable: [''],
        },
        adventure: {
            template: 'systems/interstitial/templates/actor/tab-adventure.hbs',
            scrollable: [''],
        },
        inventory: {
            template: 'systems/interstitial/templates/actor/tab-inventory.hbs',
            scrollable: [''],
        },
        settings: {
            template: 'systems/interstitial/templates/actor/tab-settings.hbs',
            scrollable: [''],
        },
    }

    _getRollIcon(move) {
        if (move.system.roll_stat === 'none')
            return null;
        if (move.system.roll_stat === 'ask')
            return 'systems/interstitial/assets/icons/game-icons/card-pickup.svg';
        return `systems/interstitial/assets/icons/stats/${move.system.roll_stat}.svg`;
    }

    /** @override */
    // getData(options = {}) {
    async _prepareContext(options) {
        // const context = super.getData(options);
        const context = await super._prepareContext(options);

        // Build harm array, starting at 1
        context.harm_options = Array.fromRange(this.document.system.harm.max, this.document.system.harm.min + 1);
        // Establish roll modes for stat buttons
        context.roll_modifiers = Object.keys(ROLL_MODIFIERS).reduce((obj, x) => (obj[x] = `interstitial.roll_modifier.${x}`, obj), {});

        // Enrich HTML content
        context.adventureHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            this.document.system.story.adventure, { secrets: this.document.isOwner, relativeTo: this.document }
        );
        context.backgroundHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            this.document.system.story.background, { secrets: this.document.isOwner, relativeTo: this.document }
        );

        // Inventory
        context.inventory = [];

        // Initialize move lists
        context.basic_moves = [];
        context.link_moves = []
        context.playbook_moves = [];

        // Build stats array & link lists
        context.statsAndLinks = STATS.reduce((obj, x) => (obj[x] = {
            value: -1, // stats start at -1
            links: []
        }, obj), {});
        this.document.items.forEach(item => {
            if (item.type === 'link') {
                // Determine stats from links
                context.statsAndLinks[item.system.stat].value += 1;
                context.statsAndLinks[item.system.stat].links.push(foundry.utils.mergeObject(item, {
                    strength_icon: LINK_STRENGTHS_ICONS[item.system.strength],
                }));
            } else if (item.type === 'move') {
                // Show icon for roll
                const updated_move = foundry.utils.mergeObject(item, {
                    roll_icon: this._getRollIcon(item),
                })
                // Add to correct list (though extra basic moves are unlikely...)
                if (item.system.move_type === 'basic')
                    context.basic_moves.push(updated_move);
                else if (item.system.move_type === 'link')
                    context.link_moves.push(updated_move);
                else if (item.system.move_type === 'playbook')
                    context.playbook_moves.push(updated_move);
            } else if (item.type == 'item') {
                context.inventory.push(item);
            }
        });
        // Sort basic moves alphabetically
        context.basic_moves.sort((a, b) => a.name.localeCompare(b.name));

        return context;
    }

    /** @override */
    _processFormData(event, form, formData) {
        const expanded = super._processFormData(event, form, formData);
        // fetch current harm from document
        const currentHarm = this.document.system.harm.value;
        // find checkbox that is unset and lower, or set and higher
        const harm_clock = expanded.system.harm_clock;
        const harm_decr = Object.keys(harm_clock).find(key => (!harm_clock[key] && key <= currentHarm));
        const harm_incr = Object.keys(harm_clock).find(key => (harm_clock[key] && key > currentHarm));
        if (harm_decr)
            expanded.system.harm.value = harm_decr - 1;
        else if (harm_incr)
            expanded.system.harm.value = harm_incr;
        return expanded;
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


        // Spending a link
        html.on('click', '.roll-move', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            return this.actor.rollMove(item);
        });


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
        if (!this.actor.isOwner)
            return false;

        const item = await Item.implementation.fromDropData(data);
        const sameActor = this.actor.uuid === item.parent?.uuid;
        const itemData = item.toObject();
        if (sameActor) {
            // this is a re-implementation of vanilla logic which differentiates
            // between moving and copying items
            const isCopying = event.ctrlKey;

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
        } else {
            return this._onDropItemCreate(itemData);
        }
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

        // Finally, create the item and show its sheet!
        return Item.create(itemData, { parent: this.actor }).then(item => item.sheet.render(true));
    }

    _onRoll(event) {
        event.preventDefault();
        const element = $(event.currentTarget).find('[data-roll]')[0];
        const dataset = element.dataset;

        // Handle stat specific rolls
        if (dataset.stat)
            return this.actor.rollStat(dataset.stat);

        // Handle other rolls that supply the formula directly
        if (dataset.roll) {
            let label = dataset.label ? `${dataset.label}` : '';
            let roll = new Roll(dataset.roll, this.actor.getRollData());
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                rollMode: game.settings.get('core', 'rollMode'),
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