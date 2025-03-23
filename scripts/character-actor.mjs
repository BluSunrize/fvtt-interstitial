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
        // prepare data
        const chatData = {
            user: game.user._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        };

        if (roll != null) {
            // handle explosions on doubles
            // then get values from optional roll
            await roll.then(this._handleExplodingDice.bind(this)).then(async (roll) => {
                templateData["formula"] = roll.formula;
                templateData["total"] = roll._evaluateTotal();
                templateData["dice"] = roll.dice;
                // wrap tooltip with extra info
                templateData["tooltip"] = await Promise.all([
                    roll.getTooltip(),
                    renderTemplate('systems/interstitial/templates/chat/dice-tooltip-prefix.hbs', templateData),
                    renderTemplate('systems/interstitial/templates/chat/dice-tooltip-postfix.hbs', templateData),
                ]).then(parts => {
                    const prefix_idx = parts[0].indexOf('>') + 1;
                    const postfix_idx = parts[0].lastIndexOf('<');
                    return parts[0].slice(0, prefix_idx) + parts[1] + parts[0].slice(prefix_idx, postfix_idx) + parts[2] + parts[0].slice(postfix_idx);
                });
                // this is necessary to trigger dice so nice
                chatData['type'] = CONST.CHAT_MESSAGE_TYPES.ROLL;
                chatData['rolls'] = [roll];
            });
        }

        // render template and insert
        chatData['content'] = await renderTemplate(template, templateData);

        // find token and assign speaker
        let token = this.token;
        if (!token)
            token = this.getActiveTokens()[0];
        chatData['speaker'] = {
            token: this.token ? this.token.id : null,
            alias: this.token ? this.token.name : this.name,
            actor: this.id
        };

        // send chat message
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