import { CharacterDataModel, LinkDataModel } from "./module/data-model.mjs";
import { CharacterActor } from "./scripts/character-actor.mjs";
import { CharacterActorSheet } from "./scripts/character-sheet.mjs";
import { LinkItemSheet } from "./scripts/link-sheet.mjs";

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
	};
	
	// Configure classes
	CONFIG.Actor.documentClass = CharacterActor;

	// Configure sheets
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('interstitial', CharacterActorSheet, {
	  makeDefault: true,
	});
	
	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('interstitial', LinkItemSheet, {
	  makeDefault: true,
	});
});
