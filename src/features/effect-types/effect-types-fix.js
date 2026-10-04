import { MODULE_ID } from "../../shared/constants.js";
import { t } from "../../shared/foundry-adapter.js";
import { itemsToRepair, withLegacyChangeTypes } from "./change-types.js";

export const REPAIRED_SETTING = "effectTypesRepaired";
const REPAIR_VERSION = 1;

// Runs when the module loads, before the system builds any effect. CONST itself is a plain global,
// but its change types are frozen, so CONST is replaced by a copy whose change types also accept the old names.
export function patchChangeTypes() {
  if (CONST.ACTIVE_EFFECT_CHANGE_TYPES.OVERRIDE) {
    return;
  }
  globalThis.CONST = { ...CONST, ACTIVE_EFFECT_CHANGE_TYPES: withLegacyChangeTypes(CONST.ACTIVE_EFFECT_CHANGE_TYPES) };
}

// Effects already saved kept the wrong types. Updating the items that own them makes the system rebuild them,
// now with the right types. Done once, by the GM.
export async function repairSavedEffects() {
  if (!game.users.activeGM?.isSelf || game.settings.get(MODULE_ID, REPAIRED_SETTING) >= REPAIR_VERSION) {
    return;
  }
  let repaired = 0;
  for (const actor of game.actors) {
    const items = itemsToRepair([...actor.items]);
    if (items.length > 0) {
      await actor.updateEmbeddedDocuments("Item", items.map((item) => ({ _id: item.id, [`flags.${MODULE_ID}.effectTypes`]: REPAIR_VERSION })));
      repaired += 1;
    }
  }
  await game.settings.set(MODULE_ID, REPAIRED_SETTING, REPAIR_VERSION);
  if (repaired > 0) {
    ui.notifications.info(t("SODLQOL.Notify.EffectsRepaired", { count: repaired }));
  }
}
