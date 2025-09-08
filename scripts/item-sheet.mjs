import { LINK_STRENGTHS, MOVE_TYPES, ROLL_STATS, STATS } from "../interstitial.mjs";

export class InventoryItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["interstitial", "sheet", "item"],
        template: "systems/interstitial/templates/item/item-sheet.hbs",
        width: 600,
        height: 600,
      });
    }

    /** @override */
    getData(options={}) {
        const context = super.getData(options);
        const itemData = context.data;

        // Add the item's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;

        return context;
    }
}