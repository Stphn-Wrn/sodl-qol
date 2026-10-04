import { MODULE_ID, modulePath } from "../../shared/constants.js";
import { renderTemplate, t } from "../../shared/foundry-adapter.js";
import { damageBreakdown } from "./damage-breakdown.js";

// The system creates the attack card after the roll is over, without waiting for it, so the detail waits
// a few seconds for the card that carries the attacking item's id. The damage card works the same way.
const WAIT_MS = 5000;
let pendingAttacks = [];
let pendingDamage = null;

function carriesItem(message, itemId) {
  return String(message.content ?? "").includes(`data-item-id="${itemId}"`);
}

function termCount(formula) {
  const roll = new Roll(formula.replace(/^\+/, ""));
  return roll.terms.filter((term) => !(term instanceof foundry.dice.terms.OperatorTerm)).length;
}

// Parts of the damage formula in the order the card builds it: weapon or spell, active talents, ticked talents.
function damageParts(card) {
  const parts = [];
  if (card.weapon.formula) {
    parts.push({ label: card.weapon.name, formula: card.weapon.formula });
  }
  if (card.activeBonus) {
    parts.push({ label: t("SODLQOL.Card.ActiveBonuses"), formula: card.activeBonus });
  }
  for (const talent of card.talents) {
    if (talent.damage) {
      parts.push({ label: talent.name, formula: talent.damage });
    }
  }
  return parts.map((part) => ({ ...part, size: termCount(part.formula) }));
}

export async function expectAttackCard(card) {
  const html = await renderTemplate(modulePath("src/features/talents/attack-card.html"), card);
  pendingAttacks.push({ itemId: card.itemId, html, parts: damageParts(card), until: Date.now() + WAIT_MS });
}

// The detail goes right above the card's damage button, like the system's own bonus lists.
function insertBeforeDamage(content, html) {
  const marker = '<div class="combatactions roll-damage">';
  const index = content.indexOf(marker);
  if (index < 0) {
    return `${content}${html}`;
  }
  return `${content.slice(0, index)}${html}${content.slice(index)}`;
}

function annotateAttack(message) {
  pendingAttacks = pendingAttacks.filter((entry) => entry.until > Date.now());
  const entry = pendingAttacks.find((candidate) => carriesItem(message, candidate.itemId));
  if (!entry) {
    return false;
  }
  pendingAttacks = pendingAttacks.filter((candidate) => candidate !== entry);
  message.updateSource({ content: insertBeforeDamage(message.content, entry.html), flags: { [MODULE_ID]: { itemId: entry.itemId, damageParts: entry.parts } } });
  return true;
}

function evaluatedTerms(roll) {
  return roll.terms.map((term) => {
    if (term instanceof foundry.dice.terms.OperatorTerm) {
      return { operator: term.operator };
    }
    return { total: term.total };
  });
}

function annotateDamage(message) {
  if (!pendingDamage || pendingDamage.until < Date.now() || !message.rolls?.length || !carriesItem(message, pendingDamage.itemId)) {
    return;
  }
  const breakdown = damageBreakdown(pendingDamage.parts, evaluatedTerms(message.rolls[0]));
  pendingDamage = null;
  if (!breakdown) {
    return;
  }
  const escape = Handlebars.escapeExpression;
  const rows = breakdown.map((part) => `&nbsp;&nbsp;&nbsp;&nbsp;• ${part.total} <i>(${escape(part.label)}, ${escape(part.formula.replace(/^\+/, ""))})</i><br>`).join("");
  const html = `<div class="description sodl-talents-detail"><div class="header">${escape(t("SODLQOL.Card.DamageTitle"))} :</div><div class="body">${rows}</div></div>`;
  message.updateSource({ content: `${message.content}${html}` });
}

export function annotateChatCard(message) {
  if (!annotateAttack(message)) {
    annotateDamage(message);
  }
}

// Clicking "Damage" on a detailed attack card makes the next damage card split its total.
export function watchDamageButtons(message, html) {
  const flags = message.flags?.[MODULE_ID];
  if (!flags?.damageParts?.length) {
    return;
  }
  for (const button of html.querySelectorAll(".roll-damage")) {
    button.addEventListener("click", () => {
      pendingDamage = { itemId: flags.itemId, parts: flags.damageParts, until: Date.now() + WAIT_MS };
    }, { capture: true });
  }
}
