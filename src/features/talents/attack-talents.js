// Reads what a talent adds to an attack, from the fields the demonlord system already uses for talent effects,
// or from its description when those fields are empty.

import { readTalentText, readTalentUpgrades } from "./talent-text.js";

function toInteger(value) {
  const number = Math.trunc(Number(value));
  if (!Number.isFinite(number)) {
    return 0;
  }
  return number;
}

function toDice(value) {
  return String(value ?? "").trim();
}

function plusify(dice) {
  if (dice === "" || dice.startsWith("+") || dice.startsWith("-")) {
    return dice;
  }
  return `+${dice}`;
}

// Same choice as the system: the weapon's attribute, or the better of Strength and Agility for a finesse weapon.
export function attackAttribute(item, attributes, finesseAutoSelect) {
  const attribute = String(item.system.action?.attack ?? "").toLowerCase();
  const finesse = String(item.system.properties ?? "").toLowerCase().includes("finesse");
  if (attribute !== "" || !finesseAutoSelect || !finesse) {
    return attribute;
  }
  if (attributes.strength.value > attributes.agility.value) {
    return "strength";
  }
  return "agility";
}

const NO_TEXT_BONUS = { boons: 0, damage: "", plus20Damage: "", fromText: true };

// Like the system, extra boons only count for the attributes the talent targets.
// A talent whose attack fields are empty falls back on the extra damage written in its description,
// provided the description is about this kind of attack ("weapon" or "spell").
export function talentAttackBonus(talentSystem, attribute, kind = "weapon") {
  const action = talentSystem.action ?? {};
  let boons = 0;
  if (attribute && action[`${attribute}boonsbanesselect`]) {
    boons = toInteger(action.extraboonsbanes);
  }
  const fields = { boons, damage: toDice(action.extradamage), plus20Damage: toDice(action.extraplus20damage), fromText: false };
  if (hasEffect(fields)) {
    return fields;
  }
  const text = readTalentText(talentSystem.description);
  if (!text || (text.scope !== "any" && text.scope !== kind)) {
    return NO_TEXT_BONUS;
  }
  return { boons: 0, damage: text.damage, plus20Damage: text.plus20Damage, fromText: true };
}

function upgraded(bonus, upgrade) {
  let field = "damage";
  if (bonus.damage === "" && bonus.plus20Damage !== "") {
    field = "plus20Damage";
  }
  if (upgrade.mode === "to") {
    return { ...bonus, [field]: upgrade.dice };
  }
  return { ...bonus, [field]: combineBonuses([{ boons: 0, damage: bonus[field], plus20Damage: "" }, { boons: 0, damage: upgrade.dice, plus20Damage: "" }]).damage };
}

// Each talent's bonus for this attack, after the upgrades other talents of the same character give it
// (such as Brutal Backstab raising Backstab's extra damage to 2d6).
export function talentBonuses(items, attribute, kind = "weapon") {
  const talents = items.filter((item) => item.type === "talent");
  const upgrades = new Map();
  for (const talent of talents) {
    for (const upgrade of readTalentUpgrades(talent.system.description)) {
      upgrades.set(upgrade.target.toLowerCase(), { ...upgrade, by: talent.name });
    }
  }
  return new Map(talents.map((talent) => {
    let bonus = talentAttackBonus(talent.system, attribute, kind);
    const upgrade = upgrades.get(String(talent.name).toLowerCase());
    if (upgrade && hasEffect(bonus)) {
      bonus = { ...upgraded(bonus, upgrade), upgradedBy: upgrade.by };
    }
    return [talent.id, bonus];
  }));
}

export function combineBonuses(bonuses) {
  const joinDice = (parts) => parts.filter((part) => part !== "").map(plusify).join("");
  return {
    boons: bonuses.reduce((total, bonus) => total + bonus.boons, 0),
    damage: joinDice(bonuses.map((bonus) => bonus.damage)),
    plus20Damage: joinDice(bonuses.map((bonus) => bonus.plus20Damage))
  };
}

export function appendDice(base, extra) {
  return `${base ?? ""}${extra ?? ""}`;
}

function hasEffect(bonus) {
  return bonus.boons !== 0 || bonus.damage !== "" || bonus.plus20Damage !== "";
}

function describeBonus(bonus, t, withSource = false) {
  const parts = [];
  if (bonus.boons !== 0) {
    let key = "SODLQOL.Bonus.Boons";
    if (Math.abs(bonus.boons) > 1) {
      key = "SODLQOL.Bonus.BoonsPlural";
    }
    parts.push(t(key, { count: bonus.boons }));
  }
  if (bonus.damage !== "") {
    parts.push(t("SODLQOL.Bonus.Damage", { dice: plusify(bonus.damage) }));
  }
  if (bonus.plus20Damage !== "") {
    parts.push(t("SODLQOL.Bonus.Plus20Damage", { dice: plusify(bonus.plus20Damage) }));
  }
  const summary = parts.join(", ");
  if (withSource && bonus.fromText) {
    return `${summary} ${t("SODLQOL.Bonus.FromText")}`;
  }
  return summary;
}

function usesOf(talentSystem) {
  return { value: toInteger(talentSystem.uses?.value), max: toInteger(talentSystem.uses?.max) };
}

// Talents already active on the sheet apply through the system's own effects, so they are shown but cannot be ticked;
// the system applies nothing for a bonus read from the description, so such a talent stays available.
export function attackTalentOptions(items, attribute, t, kind = "weapon") {
  const bonuses = talentBonuses(items, attribute, kind);
  return items
    .filter((item) => item.type === "talent")
    .map((item) => ({ item, bonus: bonuses.get(item.id), uses: usesOf(item.system) }))
    .filter(({ bonus }) => hasEffect(bonus))
    .map(({ item, bonus, uses }) => {
      const active = item.system.addtonextroll === true && !bonus.fromText;
      let usesText = "";
      if (uses.max > 0) {
        usesText = `${uses.value} / ${uses.max}`;
      }
      return {
        id: item.id,
        name: item.name,
        img: item.img,
        summary: describeBonus(bonus, t, true),
        uses: usesText,
        active,
        available: !active && (uses.max === 0 || uses.value < uses.max)
      };
    });
}

export function describeBonusText(bonus, t) {
  return describeBonus(bonus, t);
}

// The system keeps talent damage as plain text ("+1d6") but reads ".weapon" and ".all" from it when building
// the attack card, so that damage never shows. This gives it the shape the card reads, with the extra damage added.
export function cardDamageBonus(value, extra) {
  if (value && typeof value === "object") {
    return { ...value, all: appendDice(value.all, extra) };
  }
  let text = "";
  if (typeof value === "string") {
    text = value;
  }
  return { weapon: "", spell: "", talent: "", all: appendDice(text, extra) };
}
