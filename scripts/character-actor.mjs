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

    async _sendChatMessage(template, templateData, roll = null) {
        if (roll != null) {
            // handle explosions on doubles
            // then get values from optional roll
            await roll.then(this._handleExplodingDice.bind(this)).then(async (roll) => {
                templateData["formula"] = roll.formula;
                templateData["tooltip"] = await roll.getTooltip();
                templateData["total"] = roll._evaluateTotal();
                templateData["dice"] = roll.dice;
            });
        }

        const html = await renderTemplate(template, templateData);

        // find token
        let token = this.token;
        if (!token)
            token = this.getActiveTokens()[0];

        // assemble and send chat message
        const chatData = {
            user: game.user._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            speaker: {
                token: this.token ? this.token.id : null,
                alias: this.token ? this.token.name : this.name,
                actor: this.id
            }
        };
        return ChatMessage.create(chatData);
    }

    async _handleExplodingDice(roll) {
        // exit early if feature is disabled
        if (!this.system.exploding_dice)
            return Promise.resolve(roll);

        // filter to any that hit doubles
        const has_doubles = roll.dice.filter(dice =>
            dice.results
                .filter(d => d.active && !d.exploded)
                .every((die, i, arr) => die.result === arr[0].result)
        );

        // doubles found, explode them and then check again
        if (has_doubles.length)
            return Promise.all(has_doubles.map(dice => dice.explodeOnce('x2>0'))).then(() => this._handleExplodingDice(roll));

        // no doubles, return the roll
        return Promise.resolve(roll);
    }

    async rollMove(move) {

        let stat = null
        switch (move.system.roll_stat) {
            case 'none':
                break;
            case 'ask':
                const stat_buttons = STATS.map(key => ({
                    action: key,
                    label: game.i18n.format(`interstitial.stat.${key}`),
                }));
                stat = await foundry.applications.api.DialogV2.wait({
                    window: { title: game.i18n.format('interstitial.dialog.select_stat') },
                    buttons: stat_buttons,
                    rejectClose: false,
                });
                break;
            default:
                stat = move.system.roll_stat;
                break;
        }

        const roll_data = this.getRollData();
        return this._sendChatMessage(
            'systems/interstitial/templates/chat/chat-move.hbs',
            {
                actor: this,
                move: move,
                type: this.type,
                stat: stat,
                roll_data: roll_data,
            },
            stat ? new Roll(`@base_dice + @stats.${stat}`, roll_data).roll({ async: true }) : null,
        );
    }
}