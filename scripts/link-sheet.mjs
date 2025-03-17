import { LINK_STRENGTHS, STATS } from "../interstitial.mjs";

export class LinkItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["interstitial", "sheet", "item", "link"],
            template: "systems/interstitial/templates/item/link-sheet.hbs",
            width: 300,
            height: 480,
        });
    }

    /** @override */
    getData(options = {}) {
        const context = super.getData(options);
        const itemData = context.data;

        // Add the item's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;

        context.system.stat_options = STATS.reduce((obj, x) => (obj[x] = `interstitial.stat.${x}`, obj), {});
        context.system.strength_options = LINK_STRENGTHS.reduce((obj, x) => (obj[x] = `interstitial.link_strength.${x}`, obj), {});

        return context;
    }
}