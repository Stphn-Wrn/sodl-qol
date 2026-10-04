import { test } from "node:test";
import assert from "node:assert/strict";
import { encumbranceEffectData, isEncumbranceEffect, planEncumbrance, unmetArmorNames } from "../../../src/features/encumbrance/encumbrance.js";

const ADD = 2;

test("un effet d'encombrement est reconnu même après que Foundry v14 a vidé son origine", () => {
  assert.equal(isEncumbranceEffect({ origin: null, flags: { demonlord: { sourceType: "encumbrance" } } }), true);
  assert.equal(isEncumbranceEffect({ origin: null, flags: { core: { originText: "encumbrance" } } }), true);
  assert.equal(isEncumbranceEffect({ origin: "encumbrance", flags: {} }), true);
  assert.equal(isEncumbranceEffect({ origin: "Actor.a.Item.b", flags: { demonlord: { sourceType: "talent" } } }), false);
});

test("seules les armures portées dont le prérequis n'est pas atteint encombrent", () => {
  const armors = [
    { name: "Plate", system: { wear: true, requirement: { attribute: "strength", minvalue: 15 } } },
    { name: "Mail", system: { wear: false, requirement: { attribute: "strength", minvalue: 13 } } },
    { name: "Leather", system: { wear: true, requirement: { attribute: "strength", minvalue: 10 } } },
    { name: "Robe", system: { wear: true, requirement: { attribute: "", minvalue: 0 } } }
  ];
  const attributeOf = (attribute) => ({ strength: { value: 11, requirementModifier: 0 } })[attribute];

  assert.deepEqual(unmetArmorNames(armors, attributeOf), ["Plate"]);
});

test("l'effet d'encombrement retire une faveur et 2 de Vitesse par armure trop lourde", () => {
  const data = encumbranceEffectData(["Plate", "Shield"], "Encombré", ADD);

  assert.equal(data.name, "Encombré (Plate, Shield)");
  assert.equal(data.flags.demonlord.sourceType, "encumbrance");
  assert.deepEqual(data.changes.map((change) => [change.key, change.value, change.type]), [
    ["system.bonuses.attack.boons.strength", "-2", ADD],
    ["system.bonuses.attack.boons.agility", "-2", ADD],
    ["system.bonuses.challenge.boons.strength", "-2", ADD],
    ["system.bonuses.challenge.boons.agility", "-2", ADD],
    ["system.characteristics.speed", "-4", ADD]
  ]);
});

test("sans effet existant, l'encombrement en crée un seul", () => {
  const data = encumbranceEffectData(["Plate"], "Encombré", ADD);

  assert.deepEqual(planEncumbrance([], data), { create: data, update: null, deleteIds: [] });
});

test("les effets accumulés sont ramenés à un seul, mis à jour", () => {
  const stacked = ["e1", "e2", "e3"].map((id) => ({ id, origin: null, flags: { demonlord: { sourceType: "encumbrance" } } }));
  const other = { id: "t1", origin: "Actor.a.Item.b", flags: {} };
  const data = encumbranceEffectData(["Plate"], "Encombré", ADD);

  assert.deepEqual(planEncumbrance([...stacked, other], data), { create: null, update: { id: "e1", data }, deleteIds: ["e2", "e3"] });
});

test("quand plus rien n'encombre, tous les effets d'encombrement disparaissent", () => {
  const stacked = ["e1", "e2"].map((id) => ({ id, origin: null, flags: { demonlord: { sourceType: "encumbrance" } } }));

  assert.deepEqual(planEncumbrance(stacked, null), { create: null, update: null, deleteIds: ["e1", "e2"] });
});
