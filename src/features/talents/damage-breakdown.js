// Splits a damage roll's total between the parts of its formula: the weapon or spell, then each talent.
// `parts` give each part's label, formula and number of terms; `terms` are the evaluated roll's terms in order.
export function damageBreakdown(parts, terms) {
  const values = [];
  let sign = 1;
  for (const term of terms) {
    if ("operator" in term) {
      if (term.operator !== "+" && term.operator !== "-") {
        return null;
      }
      sign = 1;
      if (term.operator === "-") {
        sign = -1;
      }
      continue;
    }
    values.push(sign * term.total);
    sign = 1;
  }
  const expected = parts.reduce((total, part) => total + part.size, 0);
  if (expected !== values.length) {
    return null;
  }
  let index = 0;
  return parts.map((part) => {
    const total = values.slice(index, index + part.size).reduce((sum, value) => sum + value, 0);
    index += part.size;
    return { label: part.label, formula: part.formula, total };
  });
}
