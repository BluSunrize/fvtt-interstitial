import { STATS, ROLL_MODIFIERS } from "../interstitial.mjs";

export class CharacterActor extends Actor {

    /** @override */
    getRollData() {
        const data = super.getRollData();

        // add stats
        data.stats = STATS.reduce((obj, x) => (obj[x] = -1, obj), {})
        this.items.forEach(item => {
            if (item.type === 'link')
                data.stats[item.system.stat] += 1;
        });
        // add base dice, depending on roll mode
        data.base_dice = ROLL_MODIFIERS[this.system.roll_modifier];

        return data;
    }
}