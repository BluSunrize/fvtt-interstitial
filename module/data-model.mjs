import { LINK_STRENGTHS, ROLL_MODIFIERS, STATS } from "../interstitial.mjs";

const { BooleanField, HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Actor Models                                */
/* -------------------------------------------- */

export class CharacterDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      playbook: new StringField({ required: true, blank: true }),
      pronouns: new StringField({ required: true, blank: true }),
      harm: new SchemaField({
        min: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        max: new NumberField({ required: true, integer: true, min: 1, initial: 4 }),
        value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      }),
      hold: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      roll_modifier: new StringField({
        required: true,
        blank: false,
        options: Object.keys(ROLL_MODIFIERS),
        initial: Object.keys(ROLL_MODIFIERS)[0],
      }),
      story: new SchemaField({
        homeworld: new StringField({ required: true, blank: true }),
        background: new HTMLField({ required: false, blank: true }),
        adventure: new HTMLField({ required: false, blank: true }),
      })
    };
  }
}

export class LinkDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      stat: new StringField({
        required: true,
        blank: false,
        options: STATS,
        initial: STATS[0],
      }),
      strength: new StringField({
        required: true,
        blank: false,
        options: LINK_STRENGTHS,
        initial: LINK_STRENGTHS[0],
      }),
      spent: new BooleanField({ initial: false }),
      story: new HTMLField({ required: false, blank: true })
    };
  }
}
