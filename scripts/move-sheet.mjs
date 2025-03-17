import { LINK_STRENGTHS, MOVE_TYPES, ROLL_STATS, STATS } from "../interstitial.mjs";

export class MoveItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["interstitial", "sheet", "item", "move"],
        template: "systems/interstitial/templates/item/move-sheet.hbs",
        width: 600,
        height: 480,
      });
    }

    /** @override */
    getData(options={}) {
        const context = super.getData(options);
        const itemData = context.data;

        // Add the item's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;

        context.system.move_type_options = MOVE_TYPES.reduce((obj, x) => (obj[x] = `interstitial.move_type.${x}`, obj),{});
        context.system.roll_stat_options = ROLL_STATS.reduce((obj, x) => (obj[x] = `interstitial.roll_stat.${x}`, obj),{});

        return context;
    }
}