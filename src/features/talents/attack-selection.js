// Links the talents ticked in an attack dialog to the attack rolls that dialog launches.
// The system opens the dialog from rollWeaponAttack (or rollSpell), then rolls once per target
// with rollItemAttack (or useSpell).
// Actors are keyed by uuid: an unlinked token has its own actor, distinct from the sheet's.

let pendingAttack = null;
const selections = new Map();

function keyOf(actor, itemId) {
  return `${actor.uuid}:${itemId}`;
}

export function markPendingAttack(actor, itemId, kind) {
  pendingAttack = { actor, itemId, kind, at: Date.now() };
}

// The dialog is rendered right after rollWeaponAttack starts; an older pending attack belongs to no dialog.
export function claimPendingAttack() {
  const attack = pendingAttack;
  pendingAttack = null;
  if (!attack || Date.now() - attack.at > 5000) {
    return null;
  }
  const selection = { talentIds: [], consumed: false };
  selections.set(keyOf(attack.actor, attack.itemId), selection);
  return { ...attack, selection };
}

export function selectionFor(actor, item) {
  return selections.get(keyOf(actor, item.id)) ?? null;
}

export function releaseSelection(attack) {
  selections.delete(keyOf(attack.actor, attack.itemId));
}
