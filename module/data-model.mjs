import { LINK_STRENGTHS, STATS } from "../interstitial.mjs";

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
        initial: "light"
      }),
      strength: new StringField({
        required: true,
        blank: false,
        options: LINK_STRENGTHS,
        initial: "standard"
      }),
      spent: new BooleanField({ initial: false }),
      story: new HTMLField({ required: false, blank: true })
    };
  }
}
