import { MODULE_ID } from "../../shared/constants.js";
import { t } from "../../shared/foundry-adapter.js";
import { createEffectsOn, registerSocket } from "../../shared/socket.js";
import { buildEffectData, describeTextEffect, planPassiveEffects } from "./effect-data.js";
import { isPassiveBonus, parseTextEffects } from "./text-effects.js";

// A spell aimed at several targets is used once per target: questions are asked, and effects on the caster
// applied, only once per cast.
const SESSION_MS = 4000;
const sessions = new Map();

function sessionFor(actor, item) {
  const key = `${actor.uuid}:${item.id}`;
  let session = sessions.get(key);
  if (!session || Date.now() - session.at > SESSION_MS) {
    session = { at: Date.now(), answers: new Map(), selfDone: false };
    sessions.set(key, session);
  }
  return session;
}

function hasLimitedUses(item) {
  return (parseInt(item.system.uses?.max) || 0) > 0;
}

function isAttack(item) {
  return Boolean(item.system.action?.attack);
}

async function confirm(item, effect, names) {
  const escape = Handlebars.escapeExpression;
  const content = `<p><em>« ${escape(effect.sentence)} »</em></p><p>${escape(t("SODLQOL.TextEffects.AskApply", { effect: describeTextEffect(effect, t), targets: names }))}</p>`;
  return foundry.applications.api.DialogV2.confirm({ window: { title: t("SODLQOL.TextEffects.AskTitle", { name: item.name }) }, content, rejectClose: false });
}

// Puts on the targets (or the caster) the lasting boons and banes read in the item's description.
async function applyTextEffects(actor, item, tokens) {
  // An item with its own effect to apply keeps the system's button, so nothing is applied twice.
  if (item.effects.some((effect) => !effect.transfer)) {
    return;
  }
  const session = sessionFor(actor, item);
  let selfHandled = false;
  for (const effect of parseTextEffects(item.system.description, item.system.duration ?? "")) {
    if (item.type === "talent" && !hasLimitedUses(item) && isPassiveBonus(item.system.description, effect)) {
      continue;
    }
    let recipients = tokens.map((token) => token.actor).filter(Boolean);
    if (effect.subject === "self") {
      if (session.selfDone) {
        continue;
      }
      recipients = [actor];
      selfHandled = true;
    }
    if (recipients.length === 0) {
      continue;
    }
    const names = recipients.map((recipient) => recipient.name).join(", ");
    // Effects on the target of an attack usually depend on the attack hitting: the player confirms them.
    if (effect.ask || (effect.subject === "target" && isAttack(item))) {
      let answer = session.answers.get(effect.sentence);
      if (answer === undefined) {
        answer = await confirm(item, effect, names);
        session.answers.set(effect.sentence, answer);
      }
      if (!answer) {
        continue;
      }
    }
    const data = buildEffectData({ name: item.name, img: item.img, uuid: item.uuid }, effect);
    for (const recipient of recipients) {
      await createEffectsOn(recipient, [data]);
    }
    ui.notifications.info(t("SODLQOL.TextEffects.Applied", { name: item.name, effect: describeTextEffect(effect, t), targets: names }));
  }
  if (selfHandled) {
    session.selfDone = true;
  }
}

export function installTextEffects() {
  registerSocket();
  const prototype = CONFIG.Actor.documentClass.prototype;

  const useSpell = prototype.useSpell;
  prototype.useSpell = async function (spell, inputBoons = 0, inputModifier = 0, target = []) {
    const result = await useSpell.call(this, spell, inputBoons, inputModifier, target);
    let tokens = target ?? [];
    if (tokens.length === 0) {
      tokens = [...game.user.targets];
    }
    await applyTextEffects(this, spell, tokens);
    return result;
  };

  const useTalent = prototype.useTalent;
  prototype.useTalent = async function (talent, inputBoons, inputModifier) {
    const result = await useTalent.call(this, talent, inputBoons, inputModifier);
    await applyTextEffects(this, talent, [...game.user.targets]);
    return result;
  };

  console.log(`${MODULE_ID} | Text effects ready`);
}

// Passive talents ("You make Strength attack rolls and challenge rolls with 1 boon") get a permanent effect,
// kept in line with the talents on the sheet by the GM's client.
export async function syncPassiveEffects(actor) {
  if (!actor || !game.users.activeGM?.isSelf) {
    return;
  }
  const plan = planPassiveEffects(actor.items.filter((item) => item.type === "talent"), [...actor.effects]);
  if (plan.deleteIds.length > 0) {
    await actor.deleteEmbeddedDocuments("ActiveEffect", plan.deleteIds);
  }
  if (plan.create.length > 0) {
    await actor.createEmbeddedDocuments("ActiveEffect", plan.create);
  }
}

export async function syncAllPassiveEffects() {
  for (const actor of game.actors) {
    await syncPassiveEffects(actor);
  }
}

export function onTalentChanged(item) {
  if (item.type === "talent" && item.parent?.documentName === "Actor") {
    syncPassiveEffects(item.parent);
  }
}
