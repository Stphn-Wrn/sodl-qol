import { MODULE_ID } from "./constants.js";
import { t } from "./foundry-adapter.js";

// A player cannot change a creature the GM owns: effects for it are created by the GM's client.
const CHANNEL = `module.${MODULE_ID}`;

const HANDLERS = {
  async createEffects({ actorUuid, effects }) {
    const actor = await fromUuid(actorUuid);
    await actor?.createEmbeddedDocuments("ActiveEffect", effects);
  }
};

export function registerSocket() {
  game.socket.on(CHANNEL, (message) => {
    if (game.users.activeGM?.isSelf) {
      HANDLERS[message.type]?.(message);
    }
  });
}

export async function createEffectsOn(actor, effects) {
  if (actor.isOwner) {
    await actor.createEmbeddedDocuments("ActiveEffect", effects);
    return true;
  }
  if (!game.users.activeGM) {
    ui.notifications.warn(t("SODLQOL.TextEffects.NoGM"));
    return false;
  }
  game.socket.emit(CHANNEL, { type: "createEffects", actorUuid: actor.uuid, effects });
  return true;
}
