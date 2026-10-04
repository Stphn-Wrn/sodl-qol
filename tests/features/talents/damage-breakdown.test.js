import { test } from "node:test";
import assert from "node:assert/strict";
import { damageBreakdown } from "../../../src/features/talents/damage-breakdown.js";

test("le total des dégâts est réparti entre l'arme et chaque talent, dans l'ordre de la formule", () => {
  const parts = [
    { label: "Crossbow", formula: "2d6", size: 1 },
    { label: "Trickery", formula: "1d6", size: 1 },
    { label: "Deadly Aim", formula: "3d6", size: 1 }
  ];
  const terms = [{ total: 7 }, { operator: "+" }, { total: 5 }, { operator: "+" }, { total: 11 }];

  assert.deepEqual(damageBreakdown(parts, terms), [
    { label: "Crossbow", formula: "2d6", total: 7 },
    { label: "Trickery", formula: "1d6", total: 5 },
    { label: "Deadly Aim", formula: "3d6", total: 11 }
  ]);
});

test("une partie peut compter plusieurs termes, et un terme soustrait compte en négatif", () => {
  const parts = [{ label: "Épée", formula: "1d6+2", size: 2 }, { label: "Malus", formula: "-1", size: 1 }];
  const terms = [{ total: 4 }, { operator: "+" }, { total: 2 }, { operator: "-" }, { total: 1 }];

  assert.deepEqual(damageBreakdown(parts, terms).map((part) => part.total), [6, -1]);
});

test("si le jet ne correspond pas aux parties attendues, aucun détail n'est donné", () => {
  const parts = [{ label: "Crossbow", formula: "2d6", size: 1 }, { label: "Trickery", formula: "1d6", size: 1 }];

  assert.equal(damageBreakdown(parts, [{ total: 7 }]), null);
  assert.equal(damageBreakdown(parts, [{ total: 7 }, { operator: "*" }, { total: 2 }]), null);
});
