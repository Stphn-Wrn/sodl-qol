import { MODULE_ID } from "../../shared/constants.js";
import { isPassiveBonus, parseTextEffects } from "./text-effects.js";

export function buildEffectData(source, effect, extraFlags = {}) {
  let duration = {};
  if (effect.duration) {
    duration = { value: effect.duration.rounds, units: "rounds", expiry: effect.duration.expiry };
  }
  const data = {
    name: source.name,
    img: source.img,
    transfer: false,
    description: effect.sentence,
    changes: effect.changes.map((change) => ({ key: change.key, value: String(change.value), type: "add" })),
    duration,
    flags: { [MODULE_ID]: { textEffect: true, ...extraFlags } }
  };
  if (source.uuid) {
    data.origin = source.uuid;
  }
  return data;
}

function plural(count, one, many, t) {
  if (Math.abs(count) > 1) {
    return t(many, { count: Math.abs(count) });
  }
  return t(one, { count: Math.abs(count) });
}

function describeChange(change, t) {
  const [, kind, , scope] = change.key.split(".").slice(1);
  if (kind === "defense") {
    // Boons to a creature's defense are banes for whoever attacks it.
    let amount = plural(change.value, "SODLQOL.TextEffects.Bane", "SODLQOL.TextEffects.Banes", t);
    if (change.value < 0) {
      amount = plural(change.value, "SODLQOL.TextEffects.Boon", "SODLQOL.TextEffects.Boons", t);
    }
    return t("SODLQOL.TextEffects.AgainstIt", { amount });
  }
  let amount = plural(change.value, "SODLQOL.TextEffects.Boon", "SODLQOL.TextEffects.Boons", t);
  if (change.value < 0) {
    amount = plural(change.value, "SODLQOL.TextEffects.Bane", "SODLQOL.TextEffects.Banes", t);
  }
  let text = t(`SODLQOL.TextEffects.Rolls.${kind}`, { amount });
  if (scope !== "all") {
    text = `${text} (${t(`SODLQOL.TextEffects.Attributes.${scope}`)})`;
  }
  return text;
}

export function describeTextEffect(effect, t) {
  let duration = t("SODLQOL.TextEffects.UntilRemoved");
  if (effect.duration) {
    duration = plural(effect.duration.rounds, "SODLQOL.TextEffects.Round", "SODLQOL.TextEffects.Rounds", t);
  }
  return [...effect.changes.map((change) => describeChange(change, t)), duration].join(", ");
}

function hasLimitedUses(talent) {
  return (parseInt(talent.system.uses?.max) || 0) > 0;
}

// The permanent bonuses of passive talents follow the talents on the sheet: one effect per such talent,
// removed when the talent goes away.
export function planPassiveEffects(talents, existingEffects) {
  const wanted = new Map();
  for (const talent of talents.filter((entry) => !hasLimitedUses(entry))) {
    const effect = parseTextEffects(talent.system.description).find((candidate) => isPassiveBonus(talent.system.description, candidate));
    if (effect) {
      // No origin: the system deletes and rebuilds every effect whose origin is a talent it updates.
      wanted.set(talent.id, buildEffectData({ name: talent.name, img: talent.img }, effect, { passiveFrom: talent.id }));
    }
  }
  const passive = existingEffects.filter((effect) => effect.flags?.[MODULE_ID]?.passiveFrom);
  const present = new Set(passive.map((effect) => effect.flags[MODULE_ID].passiveFrom));
  return {
    create: [...wanted.entries()].filter(([talentId]) => !present.has(talentId)).map(([, data]) => data),
    deleteIds: passive.filter((effect) => !wanted.has(effect.flags[MODULE_ID].passiveFrom)).map((effect) => effect.id)
  };
}
