// The demonlord system finds its encumbrance effect by `origin === "encumbrance"`. Since Foundry v14, an origin
// must be a document UUID, so Foundry empties it on creation (keeping the text in flags.core.originText): the effect
// is never found again, a new one is added on every equipment change, and none is ever removed.

const ENCUMBRANCE = "encumbrance";
const PRIORITY = 100;
const ICON = "systems/demonlord/assets/icons/effects/fatigued.svg";

export function isEncumbranceEffect(effect) {
  return effect.flags?.demonlord?.sourceType === ENCUMBRANCE
    || effect.flags?.core?.originText === ENCUMBRANCE
    || effect.origin === ENCUMBRANCE;
}

// Same rule as the system: a worn armor whose requirement is above the attribute (and its modifier) encumbers.
export function unmetArmorNames(armors, attributeOf) {
  return armors
    .filter((armor) => {
      const requirement = armor.system.requirement;
      const attribute = attributeOf(requirement?.attribute);
      return armor.system.wear && requirement?.minvalue > (attribute?.value + attribute?.requirementModifier);
    })
    .map((armor) => armor.name);
}

// The same effect the system builds: one bane and 2 Speed lost per armor too heavy.
export function encumbranceEffectData(names, label, addType) {
  const penalty = -names.length;
  const change = (key, value) => ({ key, value: String(value), type: addType, priority: PRIORITY });
  const name = `${label} (${names.join(", ")})`;
  return {
    name,
    img: ICON,
    transfer: false,
    duration: { startTime: 0 },
    flags: {
      demonlord: {
        sourceItemsLength: names.length,
        sourceType: ENCUMBRANCE,
        permanent: true,
        notDeletable: true,
        notEditable: true,
        notToggleable: false,
        slug: `${ENCUMBRANCE}-${name.toLowerCase()}`
      }
    },
    changes: [
      change("system.bonuses.attack.boons.strength", penalty),
      change("system.bonuses.attack.boons.agility", penalty),
      change("system.bonuses.challenge.boons.strength", penalty),
      change("system.bonuses.challenge.boons.agility", penalty),
      change("system.characteristics.speed", penalty * 2)
    ]
  };
}

// Keeps a single encumbrance effect up to date, or none when nothing encumbers, removing any accumulated copies.
export function planEncumbrance(effects, data) {
  const existing = effects.filter(isEncumbranceEffect);
  if (!data) {
    return { create: null, update: null, deleteIds: existing.map((effect) => effect.id) };
  }
  if (existing.length === 0) {
    return { create: data, update: null, deleteIds: [] };
  }
  const [kept, ...copies] = existing;
  return { create: null, update: { id: kept.id, data }, deleteIds: copies.map((effect) => effect.id) };
}
