import { test } from "node:test";
import assert from "node:assert/strict";
import { REPAIRED_ITEM_TYPES, itemsToRepair, withLegacyChangeTypes } from "../../../src/features/effect-types/change-types.js";

const V14_TYPES = Object.freeze({ custom: 0, multiply: 10, add: 20, subtract: 20, downgrade: 30, upgrade: 40, override: 50 });

test("les anciens noms en majuscules donnent le type attendu par Foundry v14", () => {
  const types = withLegacyChangeTypes(V14_TYPES);

  assert.equal(types.OVERRIDE, "override");
  assert.equal(types.ADD, "add");
  assert.equal(types.DOWNGRADE, "downgrade");
  assert.equal(types.UPGRADE, "upgrade");
  assert.equal(types.MULTIPLY, "multiply");
  assert.equal(types.CUSTOM, "custom");
});

test("les valeurs de Foundry restent intactes et les alias n'apparaissent pas dans les listes", () => {
  const types = withLegacyChangeTypes(V14_TYPES);

  assert.deepEqual(Object.keys(types), Object.keys(V14_TYPES));
  assert.equal(types.override, 50);
  assert.equal(Object.isFrozen(types), true);
});

test("seuls les objets dont le système génère des effets sont à réparer", () => {
  const items = [
    { id: "a", type: "ancestry" },
    { id: "p", type: "path" },
    { id: "r", type: "armor" },
    { id: "c", type: "creaturerole" },
    { id: "w", type: "weapon" },
    { id: "t", type: "talent" }
  ];

  assert.deepEqual(itemsToRepair(items).map((item) => item.id), ["a", "p", "r", "c"]);
  assert.deepEqual(REPAIRED_ITEM_TYPES, ["ancestry", "path", "armor", "creaturerole"]);
});
