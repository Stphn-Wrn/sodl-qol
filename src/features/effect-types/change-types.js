// The demonlord system writes effect changes with CONST.ACTIVE_EFFECT_CHANGE_TYPES.OVERRIDE (and ADD, DOWNGRADE…).
// Foundry v14 renamed those keys in lower case and stores a change's type as a word ("override"), defaulting to
// "add": every system override, downgrade or upgrade silently became an addition (an ancestry's Speed of 10 is
// added to the base 10, a slowed creature gains 2 Speed, a defenseless one gains 5 Defense…).

const LEGACY_NAMES = { CUSTOM: "custom", MULTIPLY: "multiply", ADD: "add", SUBTRACT: "subtract", DOWNGRADE: "downgrade", UPGRADE: "upgrade", OVERRIDE: "override" };

// Foundry's own values stay as they are; the old upper-case names are hidden so menus listing the types do not show them twice.
export function withLegacyChangeTypes(types) {
  const patched = { ...types };
  for (const [name, type] of Object.entries(LEGACY_NAMES)) {
    Object.defineProperty(patched, name, { value: type, enumerable: false });
  }
  return Object.freeze(patched);
}

// Items whose effects the system generates; updating one makes the system rebuild its effects.
export const REPAIRED_ITEM_TYPES = ["ancestry", "path", "armor", "creaturerole"];

export function itemsToRepair(items) {
  return items.filter((item) => REPAIRED_ITEM_TYPES.includes(item.type));
}
