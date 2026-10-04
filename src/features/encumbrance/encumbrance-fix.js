import { MODULE_ID } from "../../shared/constants.js";
import { encumbranceEffectData, isEncumbranceEffect, planEncumbrance, unmetArmorNames } from "./encumbrance.js";

// Replaces the system's encumbrance update with one that finds its effect again and keeps a single copy.
async function setEncumbrance() {
  if (game.settings.get("demonlord", "ignoreEncumbrance")) {
    return;
  }
  const armors = this.items.filter((item) => item.type === "armor");
  const names = unmetArmorNames(armors, (attribute) => this.getAttribute(attribute));
  let data = null;
  if (names.length > 0) {
    data = encumbranceEffectData(names, game.i18n.localize("DL.encumbered"), "add");
  }
  const plan = planEncumbrance([...this.effects], data);
  if (plan.deleteIds.length > 0) {
    await this.deleteEmbeddedDocuments("ActiveEffect", plan.deleteIds);
  }
  if (plan.update) {
    await this.updateEmbeddedDocuments("ActiveEffect", [{ _id: plan.update.id, ...plan.update.data }]);
  }
  if (plan.create) {
    await this.createEmbeddedDocuments("ActiveEffect", [plan.create]);
  }
}

export function installEncumbranceFix() {
  CONFIG.Actor.documentClass.prototype.setEncumbrance = setEncumbrance;
  console.log(`${MODULE_ID} | Encumbrance fix ready`);
}

// Characters that already piled up encumbrance effects are put right once, by the GM, when the world loads.
export async function cleanUpEncumbrance() {
  if (!game.users.activeGM?.isSelf) {
    return;
  }
  for (const actor of game.actors) {
    if (actor.effects.filter(isEncumbranceEffect).length > 0) {
      await actor.setEncumbrance();
    }
  }
}
