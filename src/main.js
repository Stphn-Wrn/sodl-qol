import { MODULE_ID } from "./shared/constants.js";
import { REPAIRED_SETTING, patchChangeTypes, repairSavedEffects } from "./features/effect-types/effect-types-fix.js";
import { cleanUpEncumbrance, installEncumbranceFix } from "./features/encumbrance/encumbrance-fix.js";
import { annotateChatCard, watchDamageButtons } from "./features/talents/attack-card.js";
import { decorateAttackDialog, releaseAttackDialog } from "./features/talents/attack-dialog.js";
import { installAttackWrapper } from "./features/talents/attack-wrapper.js";
import { installTextEffects, onTalentChanged, syncAllPassiveEffects } from "./features/text-effects/text-effects-fix.js";

// Must run as the module loads, before the system builds its effects; it only adds the old names Foundry v14 dropped.
patchChangeTypes();

// Each feature can be turned off in the module settings, for instance once the system fixes the bug itself.
const FEATURES = [
  {
    setting: "effectTypesFix",
    ready: () => repairSavedEffects(),
    hooks: {}
  },
  {
    setting: "attackTalents",
    ready: () => installAttackWrapper(),
    hooks: {
      renderDialogV2: (dialog, element) => decorateAttackDialog(dialog, element),
      closeDialogV2: (dialog) => releaseAttackDialog(dialog),
      preCreateChatMessage: (message) => annotateChatCard(message),
      renderChatMessageHTML: (message, html) => watchDamageButtons(message, html)
    }
  },
  {
    setting: "textEffects",
    ready: async () => {
      installTextEffects();
      await syncAllPassiveEffects();
    },
    hooks: {
      createItem: (item) => onTalentChanged(item),
      updateItem: (item) => onTalentChanged(item),
      deleteItem: (item) => onTalentChanged(item)
    }
  },
  {
    setting: "encumbranceFix",
    ready: async () => {
      installEncumbranceFix();
      await cleanUpEncumbrance();
    },
    hooks: {}
  }
];

function isEnabled(feature) {
  return game.settings.get(MODULE_ID, feature.setting);
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, REPAIRED_SETTING, { scope: "world", config: false, type: Number, default: 0 });
  for (const feature of FEATURES) {
    game.settings.register(MODULE_ID, feature.setting, {
      name: `SODLQOL.Settings.${feature.setting}.Name`,
      hint: `SODLQOL.Settings.${feature.setting}.Hint`,
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      requiresReload: true
    });
  }
});

Hooks.once("ready", async () => {
  if (game.system.id !== "demonlord") {
    return;
  }
  for (const feature of FEATURES.filter(isEnabled)) {
    for (const [hook, handler] of Object.entries(feature.hooks)) {
      Hooks.on(hook, handler);
    }
    await feature.ready();
  }
});
