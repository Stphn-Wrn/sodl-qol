import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEffectData, describeTextEffect, planPassiveEffects } from "../../../src/features/text-effects/effect-data.js";
import { t } from "../../helpers/i18n.js";

const source = { name: "Undo Constitution", img: "u.webp", uuid: "Actor.a.Item.s" };

test("l'effet posé reprend le sort, ses changements, sa durée en rounds et la phrase source", () => {
  const effect = { sentence: "The target makes attack rolls with 2 banes for 1 minute.", subject: "target", changes: [{ key: "system.bonuses.attack.boons.all", value: -2 }], duration: { rounds: 6, expiry: "roundEnd" }, ask: false };

  assert.deepEqual(buildEffectData(source, effect), {
    name: "Undo Constitution",
    img: "u.webp",
    transfer: false,
    description: "The target makes attack rolls with 2 banes for 1 minute.",
    changes: [{ key: "system.bonuses.attack.boons.all", value: "-2", type: "add" }],
    duration: { value: 6, units: "rounds", expiry: "roundEnd" },
    flags: { "sodl-qol": { textEffect: true } },
    origin: "Actor.a.Item.s"
  });
});

test("un effet sans durée lue reste jusqu'à ce qu'on le retire", () => {
  const effect = { sentence: "You make attack rolls with 1 boon.", subject: "self", changes: [{ key: "system.bonuses.attack.boons.all", value: 1 }], duration: null, ask: false };

  assert.deepEqual(buildEffectData(source, effect).duration, {});
});

test("l'effet se décrit en clair pour la confirmation", () => {
  const banes = { changes: [{ key: "system.bonuses.attack.boons.strength", value: -2 }, { key: "system.bonuses.challenge.boons.strength", value: -2 }], duration: { rounds: 6, expiry: "roundEnd" } };
  assert.equal(describeTextEffect(banes, t), "2 pénalités aux jets d'attaque (Force), 2 pénalités aux jets de caractéristique (Force), 6 rounds");

  const shield = { changes: [{ key: "system.bonuses.defense.boons.all", value: 2 }], duration: null };
  assert.equal(describeTextEffect(shield, t), "2 pénalités pour ceux qui l'attaquent, jusqu'à ce qu'on le retire");

  const exposed = { changes: [{ key: "system.bonuses.defense.boons.all", value: -1 }], duration: { rounds: 1, expiry: "roundEnd" } };
  assert.equal(describeTextEffect(exposed, t), "1 faveur pour ceux qui l'attaquent, 1 round");
});

test("les effets passifs suivent les talents présents sur la fiche", () => {
  const talents = [
    { id: "brawn", name: "Brawn", img: "b.webp", uuid: "Actor.a.Item.brawn", system: { description: "<p>You make Strength attack rolls and challenge rolls with 1 boon.</p>", uses: { max: "0" } } },
    { id: "trick", name: "Trickery", img: "t.webp", uuid: "Actor.a.Item.trick", system: { description: "<p>Once per round, you can make attack rolls with 1 boon.</p>", uses: { max: "1" } } }
  ];
  const existing = [
    { id: "e-old", flags: { "sodl-qol": { passiveFrom: "gone" } } },
    { id: "e-brawn", flags: { "sodl-qol": { passiveFrom: "brawn" } } },
    { id: "e-other", flags: {} }
  ];

  const plan = planPassiveEffects(talents, existing);

  assert.deepEqual(plan.deleteIds, ["e-old"]);
  assert.deepEqual(plan.create, []);
  assert.equal(planPassiveEffects(talents, []).create[0].flags["sodl-qol"].passiveFrom, "brawn");
  assert.equal(planPassiveEffects(talents, []).create.length, 1);
  assert.equal("origin" in planPassiveEffects(talents, []).create[0], false);
});
