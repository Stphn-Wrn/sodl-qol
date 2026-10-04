import { test } from "node:test";
import assert from "node:assert/strict";
import { appendDice, attackAttribute, attackTalentOptions, cardDamageBonus, combineBonuses, talentAttackBonus, talentBonuses } from "../../../src/features/talents/attack-talents.js";
import { t } from "../../helpers/i18n.js";

function talent(overrides) {
  return {
    id: "t1",
    name: "Coup sournois",
    img: "t.webp",
    type: "talent",
    system: {
      addtonextroll: false,
      uses: { value: "0", max: "1" },
      action: { extraboonsbanes: "", extradamage: "1d6", extraplus20damage: "", strengthboonsbanesselect: false, agilityboonsbanesselect: false, intellectboonsbanesselect: false, willboonsbanesselect: false },
      ...overrides
    }
  };
}

test("la caractéristique d'attaque est celle de l'arme, ou la meilleure de Force et Agilité pour une arme de finesse", () => {
  const attributes = { strength: { value: 12 }, agility: { value: 14 } };

  assert.equal(attackAttribute({ system: { action: { attack: "Strength" }, properties: "" } }, attributes, true), "strength");
  assert.equal(attackAttribute({ system: { action: { attack: "" }, properties: "Finesse" } }, attributes, true), "agility");
  assert.equal(attackAttribute({ system: { action: { attack: "" }, properties: "Finesse" } }, attributes, false), "");
});

test("un talent apporte ses dégâts en plus, et ses faveurs seulement pour la caractéristique qu'il cible", () => {
  const action = { extraboonsbanes: "1", extradamage: "1d6", extraplus20damage: "2", strengthboonsbanesselect: true, agilityboonsbanesselect: false };

  assert.deepEqual(talentAttackBonus({ action }, "strength"), { boons: 1, damage: "1d6", plus20Damage: "2", fromText: false });
  assert.deepEqual(talentAttackBonus({ action }, "agility"), { boons: 0, damage: "1d6", plus20Damage: "2", fromText: false });
});

test("les bonus de plusieurs talents s'additionnent", () => {
  const combined = combineBonuses([
    { boons: 1, damage: "1d6", plus20Damage: "" },
    { boons: 0, damage: "2", plus20Damage: "1d6" }
  ]);

  assert.deepEqual(combined, { boons: 1, damage: "+1d6+2", plus20Damage: "+1d6" });
});

test("des dés en plus s'ajoutent à une formule existante, vide ou non", () => {
  assert.equal(appendDice("", "+1d6"), "+1d6");
  assert.equal(appendDice("+2", "+1d6"), "+2+1d6");
  assert.equal(appendDice(undefined, ""), "");
});

test("la fenêtre d'attaque liste les talents d'attaque, avec ce qu'ils apportent et leurs utilisations", () => {
  const talents = [
    talent({}),
    talent({ addtonextroll: true, uses: { value: "0", max: "0" } }),
    { ...talent({ uses: { value: "1", max: "1" } }), id: "t3", name: "Épuisé" },
    { ...talent({ action: { extradamage: "", extraboonsbanes: "", extraplus20damage: "" } }), id: "t4", name: "Sans effet d'attaque" },
    { id: "s1", name: "Boule de feu", type: "spell", system: {} }
  ];

  assert.deepEqual(attackTalentOptions(talents, "strength", t), [
    { id: "t1", name: "Coup sournois", img: "t.webp", summary: "+1d6 dégâts", uses: "0 / 1", active: false, available: true },
    { id: "t1", name: "Coup sournois", img: "t.webp", summary: "+1d6 dégâts", uses: "", active: true, available: false },
    { id: "t3", name: "Épuisé", img: "t.webp", summary: "+1d6 dégâts", uses: "1 / 1", active: false, available: false }
  ]);
});

test("un talent qui ne donne des faveurs qu'à une autre caractéristique n'est pas proposé pour cette attaque", () => {
  const agilityOnly = talent({ action: { extraboonsbanes: "1", extradamage: "", extraplus20damage: "", agilityboonsbanesselect: true } });

  assert.deepEqual(attackTalentOptions([agilityOnly], "strength", t), []);
  assert.equal(attackTalentOptions([agilityOnly], "agility", t)[0].summary, "+1 faveur");
});

test("un talent sans champs d'attaque est proposé d'après sa description, même marqué actif par le système", () => {
  const textOnly = talent({
    addtonextroll: true,
    uses: { value: "0", max: "0" },
    description: "<p>Your attacks deal [[/r 1d6]] extra damage when you make an attack roll with 1 boon.</p>",
    action: { extradamage: "", extraboonsbanes: "", extraplus20damage: "" }
  });

  assert.deepEqual(talentAttackBonus(textOnly.system, "agility"), { boons: 0, damage: "1d6", plus20Damage: "", fromText: true });
  assert.deepEqual(attackTalentOptions([textOnly], "agility", t), [
    { id: "t1", name: "Coup sournois", img: "t.webp", summary: "+1d6 dégâts (d'après la description)", uses: "", active: false, available: true }
  ]);
});

test("les dégâts des talents, rangés en texte par le système, prennent la forme que lit la carte d'attaque", () => {
  assert.deepEqual(cardDamageBonus("+1d6", "+2d6"), { weapon: "", spell: "", talent: "", all: "+1d6+2d6" });
  assert.deepEqual(cardDamageBonus("", ""), { weapon: "", spell: "", talent: "", all: "" });
  assert.deepEqual(cardDamageBonus(undefined, "+1d6"), { weapon: "", spell: "", talent: "", all: "+1d6" });
  assert.deepEqual(cardDamageBonus({ weapon: "+1", all: "+2" }, "+1d6"), { weapon: "+1", all: "+2+1d6" });
});

function textTalent(id, name, description) {
  return { id, name, img: `${id}.webp`, type: "talent", system: { addtonextroll: false, uses: { value: "0", max: "0" }, description, action: {} } };
}

test("un talent de sort n'est proposé que pour les sorts, un talent d'arme que pour les armes", () => {
  const items = [
    textTalent("w", "Combat Prowess", "<p>Your attacks with weapons deal [[/r 1d6]] extra damage.</p>"),
    textTalent("s", "Intense Flames", "<p>Fire attack spells you cast deal [[/r 1d6]] extra damage.</p>"),
    textTalent("a", "Dirty Tricks", "<p>Your attacks deal [[/r 1d6]] extra damage when you make an attack roll with 1 boon.</p>")
  ];

  assert.deepEqual(attackTalentOptions(items, "strength", t, "weapon").map((option) => option.name), ["Combat Prowess", "Dirty Tricks"]);
  assert.deepEqual(attackTalentOptions(items, "intellect", t, "spell").map((option) => option.name), ["Intense Flames", "Dirty Tricks"]);
});

test("un talent d'amélioration remplace les dégâts du talent qu'il vise, sans être proposé lui-même", () => {
  const items = [
    textTalent("b", "Backstab", "<p>Once per round, when you attack with a basic or swift weapon, the attack deals [[/r 1d6]] extra damage.</p>"),
    textTalent("bb", "Brutal Backstab", "<p>The extra damage from your @UUID[Compendium.x.Item.b]{Backstab} talent increases to [[/r 2d6]].</p>")
  ];

  assert.deepEqual(attackTalentOptions(items, "agility", t, "weapon").map((option) => [option.name, option.summary]), [["Backstab", "+2d6 dégâts (d'après la description)"]]);
});

test("le talent amélioré garde la trace du talent qui l'améliore", () => {
  const items = [
    textTalent("b", "Backstab", "<p>When you attack with a basic or swift weapon, the attack deals [[/r 1d6]] extra damage.</p>"),
    textTalent("bb", "Brutal Backstab", "<p>The extra damage from your Backstab talent increases to [[/r 2d6]].</p>")
  ];

  assert.equal(talentBonuses(items, "agility", "weapon").get("b").upgradedBy, "Brutal Backstab");
});
