import { MODULE_ID } from "../../shared/constants.js";
import { t } from "../../shared/foundry-adapter.js";
import { attackAttribute, cardDamageBonus, combineBonuses, describeBonusText, talentBonuses } from "./attack-talents.js";
import { expectAttackCard } from "./attack-card.js";
import { talentSource } from "./talent-text.js";
import { markPendingAttack, selectionFor } from "./attack-selection.js";

const NO_BONUS = { boons: 0, damage: "", plus20Damage: "" };

function chosenTalents(actor, selection) {
  if (!selection) {
    return [];
  }
  return selection.talentIds.map((id) => actor.items.get(id)).filter(Boolean);
}

// A talent with limited uses spends one, once per dialog even when the attack hits several targets.
async function spendUses(talents) {
  const updates = talents
    .filter((talent) => (parseInt(talent.system.uses?.max) || 0) > 0)
    .map((talent) => ({ _id: talent.id, "system.uses.value": (parseInt(talent.system.uses.value) || 0) + 1 }));
  if (updates.length > 0) {
    await talents[0].parent.updateEmbeddedDocuments("Item", updates);
  }
}

// For the duration of the roll, the attacker's damage bonuses take the shape the chat card reads,
// with the ticked talents' damage added; they are put back afterwards.
async function withCardBonuses(actor, bonus, roll) {
  const attack = actor.system.bonuses?.attack;
  if (!attack) {
    return roll();
  }
  const saved = { damage: attack.damage, plus20Damage: attack.plus20Damage };
  attack.damage = cardDamageBonus(saved.damage, bonus.damage);
  attack.plus20Damage = cardDamageBonus(saved.plus20Damage, bonus.plus20Damage);
  try {
    return await roll();
  } finally {
    attack.damage = saved.damage;
    attack.plus20Damage = saved.plus20Damage;
  }
}

// Extra damage the system's own active talents add, kept as text by the system.
function activeDamage(actor) {
  const damage = actor.system.bonuses?.attack?.damage;
  if (typeof damage === "string") {
    return damage.trim();
  }
  return "";
}

// A bonus read from the description quotes the sentence it comes from; one from the talent's fields has none.
function sourceOf(talent, bonus) {
  if (!bonus.fromText) {
    return "";
  }
  return talentSource(talent.system.description);
}

// Rolls one attack (weapon or spell) with the talents ticked in its dialog.
// `roll(boons)` calls the system's own roll with the boons to use.
async function rollWithTalents(actor, item, kind, inputBoons, roll) {
  // Read synchronously: the system does not always await the roll before closing the dialog.
  const selection = selectionFor(actor, item);
  const talents = chosenTalents(actor, selection);
  if (talents.length === 0) {
    return withCardBonuses(actor, NO_BONUS, () => roll(inputBoons));
  }

  const finesse = kind === "weapon" && game.settings.get("demonlord", "finesseAutoSelect");
  const attribute = attackAttribute(item, actor.system.attributes, finesse);
  const bonuses = talentBonuses([...actor.items], attribute, kind);
  const applied = talents.map((talent) => ({ talent, bonus: bonuses.get(talent.id) }));
  const bonus = combineBonuses(applied.map((entry) => entry.bonus));
  if (!selection.consumed) {
    selection.consumed = true;
    await spendUses(talents);
    ui.notifications.info(t("SODLQOL.Notify.Applied", { names: talents.map((talent) => talent.name).join(", ") }));
  }

  await expectAttackCard({
    itemId: item.id,
    weapon: { name: item.name, formula: String(item.system.action?.damage ?? "").trim() },
    activeBonus: activeDamage(actor),
    talents: applied.map(({ talent, bonus: talentBonus }) => ({
      name: talent.name,
      summary: describeBonusText(talentBonus, t),
      damage: talentBonus.damage,
      upgradedBy: talentBonus.upgradedBy,
      source: sourceOf(talent, talentBonus)
    }))
  });

  const boons = (parseInt(inputBoons) || 0) + bonus.boons;
  return withCardBonuses(actor, bonus, () => roll(boons));
}

export function installAttackWrapper() {
  const prototype = CONFIG.Actor.documentClass.prototype;

  const rollWeaponAttack = prototype.rollWeaponAttack;
  prototype.rollWeaponAttack = function (itemId, options) {
    markPendingAttack(this, itemId, "weapon");
    return rollWeaponAttack.call(this, itemId, options);
  };

  const rollItemAttack = prototype.rollItemAttack;
  prototype.rollItemAttack = function (item, inputBoons = 0, inputModifier = 0, token = null) {
    return rollWithTalents(this, item, "weapon", inputBoons, (boons) => rollItemAttack.call(this, item, boons, inputModifier, token));
  };

  const rollSpell = prototype.rollSpell;
  prototype.rollSpell = function (itemId, options) {
    markPendingAttack(this, itemId, "spell");
    return rollSpell.call(this, itemId, options);
  };

  const useSpell = prototype.useSpell;
  prototype.useSpell = function (spell, inputBoons = 0, inputModifier = 0, target = []) {
    return rollWithTalents(this, spell, "spell", inputBoons, (boons) => useSpell.call(this, spell, boons, inputModifier, target));
  };

  console.log(`${MODULE_ID} | Attack talents ready`);
}
