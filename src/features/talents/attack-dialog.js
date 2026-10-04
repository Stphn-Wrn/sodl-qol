import { modulePath } from "../../shared/constants.js";
import { renderTemplate, t } from "../../shared/foundry-adapter.js";
import { attackAttribute, attackTalentOptions } from "./attack-talents.js";
import { claimPendingAttack, releaseSelection } from "./attack-selection.js";

const openDialogs = new Map();

// The talent's own text, with its links resolved, shown when hovering the talent in the dialog.
function describeTalent(talent) {
  const description = talent?.system.description ?? "";
  if (description.trim() === "") {
    return "";
  }
  return foundry.applications.ux.TextEditor.implementation.enrichHTML(description, { relativeTo: talent });
}

// The system's attack and spell dialogs are DialogV2s with a boons/banes field; a talents section is added below it.
export async function decorateAttackDialog(dialog, element) {
  if (!element.querySelector("#boonsbanes")) {
    return;
  }
  const attack = claimPendingAttack();
  if (!attack) {
    return;
  }
  const item = attack.actor.items.get(attack.itemId);
  const finesse = attack.kind === "weapon" && game.settings.get("demonlord", "finesseAutoSelect");
  const attribute = attackAttribute(item, attack.actor.system.attributes, finesse);
  const options = attackTalentOptions([...attack.actor.items], attribute, t, attack.kind);
  if (options.length === 0) {
    releaseSelection(attack);
    return;
  }
  openDialogs.set(dialog, attack);
  const talents = await Promise.all(options.map(async (option) => ({ ...option, description: await describeTalent(attack.actor.items.get(option.id)) })));

  const html = await renderTemplate(modulePath("src/features/talents/attack-talents.html"), { talents });
  const content = element.querySelector(".dialog-content") ?? element.querySelector("form");
  content.insertAdjacentHTML("beforeend", html);
  for (const button of content.querySelectorAll("[data-sodl-talent-sheet]")) {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      attack.actor.items.get(button.dataset.sodlTalentSheet)?.sheet.render(true);
    });
  }
  for (const checkbox of content.querySelectorAll("[data-sodl-talent]")) {
    checkbox.addEventListener("change", () => {
      attack.selection.talentIds = [...content.querySelectorAll("[data-sodl-talent]:checked:not(:disabled)")].map((input) => input.dataset.sodlTalent);
    });
  }
  dialog.setPosition({ height: "auto" });
}

// The dialog closes once its roll callback is done, so the selection is no longer needed.
export function releaseAttackDialog(dialog) {
  const attack = openDialogs.get(dialog);
  if (!attack) {
    return;
  }
  openDialogs.delete(dialog);
  releaseSelection(attack);
}
