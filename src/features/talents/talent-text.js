// Reads a talent's effect from its description. Almost every compendium talent leaves its attack fields empty
// and only writes "your attacks deal [[/r 1d6]] extra damage". Only extra damage is read: boons in talent texts
// are usually a condition ("if you attack with 1 boon"), not a bonus.

const DICE = "(\\d+d\\d+(?:\\s*[+-]\\s*\\d+)?|\\d+)";
const EXTRA_DAMAGE = [
  new RegExp(`${DICE}\\s*(?:extra|additional)\\s+damage`, "i"),
  new RegExp(`${DICE}\\s*(?:points?\\s+de\\s+)?dégâts?\\s+supplémentaires?`, "i")
];
const UPGRADES = [
  new RegExp(`extra damage from your (.+?) talent\\b[^.]*?\\bincreases (to|by) ${DICE}`, "i"),
  new RegExp(`(?:use|using) your (.+?) talent\\b[^.]*?\\bextra damage\\b[^.]*?\\bincreases (to|by) ${DICE}`, "i"),
  new RegExp(`the extra damage (?:that )?(.+?) (?:applies|deals)\\b[^.]*?\\bincreases (to|by) ${DICE}`, "i")
];

// Damage that lands on a target as the effect of a creature's ability, or that other creatures deal,
// is not a bonus to the owner's attack roll.
const NOT_OWN_ATTACK = /\b(already|instead takes|the (?:target|creature) takes|falls prone|at the end of each round|from your poisons|their attacks|creatures? you create|monsters you create|allies|ally|each member|your group|creatures deal|granted by)\b/i;
const SPELL = /\b(spells?|sorts?)\b/i;
const WEAPON = /\b(weapons?|armes?|melee|ranged|unarmed|natural|strikes?|claws?|bite|teeth|fists?|bows?|crossbows?|swords?|axes?|staff|staves|spears?|daggers?|maces?|hammers?|clubs?|slings?|whips?|flails?)\b/i;
const ATTACK = /\b(attacks?|attaques?)\b/i;
const PLUS_20 = /\b20 or higher\b|\b20\+|\b20 ou plus\b/i;

function cleanText(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[\/r\s*([^\]]+?)\s*\]\]/g, "$1")
    .replace(/@\w+\[[^\]]*\]\{([^}]*)\}/g, "$1")
    .replace(/@\w+\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentences(html) {
  return cleanText(html).split(/(?<=[.!?])\s+/);
}

function normalizeDice(dice) {
  return dice.replace(/\s+/g, "");
}

function scopeOf(sentence) {
  if (NOT_OWN_ATTACK.test(sentence)) {
    return null;
  }
  if (SPELL.test(sentence) && !WEAPON.test(sentence)) {
    return "spell";
  }
  if (WEAPON.test(sentence)) {
    return "weapon";
  }
  if (ATTACK.test(sentence)) {
    return "any";
  }
  return null;
}

function isUpgrade(sentence) {
  return UPGRADES.some((pattern) => pattern.test(sentence));
}

function findTalentText(html) {
  for (const sentence of sentences(html)) {
    if (isUpgrade(sentence)) {
      continue;
    }
    const match = EXTRA_DAMAGE.map((pattern) => sentence.match(pattern)).find(Boolean);
    const scope = scopeOf(sentence);
    if (!match || !scope) {
      continue;
    }
    const dice = normalizeDice(match[1]);
    if (PLUS_20.test(sentence)) {
      return { damage: "", plus20Damage: dice, scope, sentence };
    }
    return { damage: dice, plus20Damage: "", scope, sentence };
  }
  return null;
}

// The first sentence that gives the owner's attacks extra damage; its scope tells whether it is for
// weapon attacks, spell attacks, or any attack.
export function readTalentText(html) {
  const found = findTalentText(html);
  if (!found) {
    return null;
  }
  const { damage, plus20Damage, scope } = found;
  return { damage, plus20Damage, scope };
}

// The sentence of the description the bonus was read from, quoted on the attack card.
export function talentSource(html) {
  return findTalentText(html)?.sentence ?? "";
}

// A talent such as "the extra damage from your Backstab talent increases to 2d6" changes another talent's damage.
export function readTalentUpgrades(html) {
  return sentences(html)
    .map((sentence) => UPGRADES.map((pattern) => sentence.match(pattern)).find(Boolean))
    .filter(Boolean)
    .map((match) => ({ target: match[1].trim(), mode: match[2].toLowerCase(), dice: normalizeDice(match[3]) }));
}
