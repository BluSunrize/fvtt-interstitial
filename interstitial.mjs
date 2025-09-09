import { CharacterDataModel, ItemDataModel, LinkDataModel, MoveDataModel } from "./module/data-model.mjs";
import { CharacterActor } from "./scripts/character-actor.mjs";
import { CharacterActorSheet } from "./scripts/character-sheet.mjs";
import { CharacterActorSheetV2 } from "./scripts/character-sheet-v2.mjs";
import { InventoryItemSheet } from "./scripts/item-sheet.mjs";
import { LinkItemSheet } from "./scripts/link-sheet.mjs";
import { MoveItemSheet } from "./scripts/move-sheet.mjs";

export const STATS = [
    "light",
    "dark",
    "mastery",
    "heart",
];
export const LINK_STRENGTHS = [
    "standard",
    "locked",
    "bonded",
];
export const LINK_STRENGTHS_ICONS = {
    "standard": null,
    "locked": "lock",
    "bonded": "handshake-angle",
};
export const ROLL_MODIFIERS = {
    'standard': '2d6',
    'advantage': '3d6kh2',
    'disadvantage': '3d6kl2',
};
export const MOVE_TYPES = [
    "basic",
    "link",
    "playbook",
];
export const ROLL_STATS = [
    "none",
    ...STATS,
    "ask",
];

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {

    // Configure System Data Models.
    CONFIG.Actor.dataModels = {
        character: CharacterDataModel,
    };
    CONFIG.Item.dataModels = {
        link: LinkDataModel,
        move: MoveDataModel,
        item: ItemDataModel,
    };

    // Configure classes
    CONFIG.Actor.documentClass = CharacterActor;

    // Configure sheets
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('interstitial', CharacterActorSheet, {
        makeDefault: true,
    });
    Actors.registerSheet('interstitial', CharacterActorSheetV2);

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('interstitial', MoveItemSheet, {
        types: ['move'],
        makeDefault: true,
    });
    Items.registerSheet('interstitial', LinkItemSheet, {
        types: ['link'],
        makeDefault: true,
    });
    Items.registerSheet('interstitial', InventoryItemSheet, {
        types: ['item'],
        makeDefault: true,
    });
});
