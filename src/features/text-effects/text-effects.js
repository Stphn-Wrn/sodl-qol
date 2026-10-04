// Reads, in a spell's or talent's description, the lasting boons and banes it puts on a creature, such as
// "the target makes attack rolls and challenge rolls with 2 banes for 1 minute". Only lasting states are read
// ("attack rolls", plural): a single roll ("makes an attack roll with 1 boon against…") describes an attack,
// "must make a … challenge roll" is the roll to resist, and group bonuses are left to the players.

// Only combat-scale durations are tracked; longer ones (hours, days) are left to the GM.
const ROUNDS_PER = { round: 1, minute: 6 };
const NUMBERS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };
const COUNT = "(\\d+|one|two|three|four|five)";
const ATTRIBUTE = "(?:(strength|agility|intellect|will|perception) )?";
const ROLLS = `${ATTRIBUTE}(attack rolls and challenge rolls|challenge rolls and attack rolls|attack and challenge rolls|attack rolls|challenge rolls)`;
const TARGET = "(?:the target|each target|target creature|that creature|the creature|it|they)";
// The subject opens its clause: "…, the target makes…", not "creatures that can see it make…".
const CLAUSE_START = "(?:^|[,;:]\\s*|\\band\\s+|\\bthen\\s+|\\b(?:ends|expires)\\s+)";

const SUBJECT_RULES = [
  // "imposes 2 banes on attack rolls made against the target" / "against you"
  { pattern: new RegExp(`\\bimposes? ${COUNT} banes? on attack rolls (?:made )?against (you|${TARGET})\\b`, "i"), read: (match) => ({ subject: subjectOf(match[2]), defense: toNumber(match[1]) }) },
  // "attack rolls against the target are made with 1 bane"
  { pattern: new RegExp(`\\battack rolls (?:made )?against (you|${TARGET}) (?:are|is) made with ${COUNT} (boon|bane)s?\\b`, "i"), read: (match) => ({ subject: subjectOf(match[1]), defense: banesFor(match[2], match[3]) }) },
  // "grants 2 boons on attack rolls made against it"
  { pattern: new RegExp(`\\bgrants? ${COUNT} boons? on attack rolls (?:made )?against (you|${TARGET})\\b`, "i"), read: (match) => ({ subject: subjectOf(match[2]), defense: -toNumber(match[1]) }) },
  // "the target makes Strength attack rolls and challenge rolls with 2 banes"
  { pattern: new RegExp(`${CLAUSE_START}${TARGET} makes? ${ROLLS} with ${COUNT} (boon|bane)s?\\b`, "i"), read: (match) => ({ subject: "target", rolls: rollChanges(match[1], match[2], boonsFor(match[3], match[4])) }) },
  // "you make attack rolls and challenge rolls with 1 boon"
  { pattern: new RegExp(`${CLAUSE_START}you (?:can )?make ${ROLLS} with ${COUNT} (boon|bane)s?\\b`, "i"), read: (match) => ({ subject: "self", rolls: rollChanges(match[1], match[2], boonsFor(match[3], match[4])) }) }
];

const NOT_A_STATE = /\bmust (?:make|get a success on)\b|\bto (?:resist|avoid|remove)\b|\bmade to resist\b|\b(?:each member|members) of (?:your|the) group\b|\ballies\b|\bother than you\b|\brolls to (?:deceive|steal|hide|sneak|interact|climb|swim|track|navigate|recall|perceive|search)\b|\bin social situations\b/i;
const OPTIONAL_OR_CONDITIONAL = /\b(you can|can use|may|once per|triggered action|expend|on a (?:success|failure)|if|when|whenever|while|unless|as long as|instead|during|except)\b/i;
// A roll bonus kept for some targets ("against targets suffering from an affliction") is a condition too;
// the defense rules use "against" for their own subject, so this only applies to roll bonuses.
const RESTRICTED_ROLLS = /\bagainst\b/i;
const SPELL_DURATION = /\b(for the duration|until (?:the|this) (?:spell|effect) ends|while (?:the|this) (?:spell|effect) lasts)\b/i;

function toNumber(word) {
  return NUMBERS[word.toLowerCase()] ?? Number(word);
}

function subjectOf(word) {
  if (word.toLowerCase() === "you") {
    return "self";
  }
  return "target";
}

function boonsFor(count, kind) {
  if (kind.toLowerCase() === "bane") {
    return -toNumber(count);
  }
  return toNumber(count);
}

// A bane imposed on attackers is a boon to the target's defense in the system, which subtracts it from their roll.
function banesFor(count, kind) {
  return -boonsFor(count, kind);
}

function rollChanges(attribute, rolls, value) {
  const scope = attribute?.toLowerCase() ?? "all";
  const kinds = [];
  if (/attack/i.test(rolls)) {
    kinds.push("attack");
  }
  if (/challenge/i.test(rolls)) {
    kinds.push("challenge");
  }
  return kinds.map((kind) => ({ key: `system.bonuses.${kind}.boons.${scope}`, value }));
}

function cleanText(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[\/r\s*([^\]]+?)\s*\]\]/g, "$1")
    .replace(/@\w+\[[^\]]*\]\{([^}]*)\}/g, "$1")
    .replace(/@\w+\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// "for 1 minute" lasts 6 rounds of about 10 seconds; "until the end of the round" ends with the current round.
// Hours and days give no duration: the effect stays until the GM removes it.
export function durationInRounds(text) {
  const value = String(text ?? "");
  if (/until the end of (?:the|this) round/i.test(value)) {
    return { rounds: 1, expiry: "roundEnd" };
  }
  if (/until the end of (?:your|its|their|the target's) next turn/i.test(value)) {
    return { rounds: 1, expiry: "turnEnd" };
  }
  const match = value.match(/\b(\d+|a|an|one|two|three|four|five) (round|minute|hour|day)s?\b/i);
  const perUnit = ROUNDS_PER[match?.[2].toLowerCase()];
  if (!perUnit) {
    return null;
  }
  return { rounds: toNumber(match[1]) * perUnit, expiry: "roundEnd" };
}

function durationOf(sentence, itemDuration) {
  if (SPELL_DURATION.test(sentence)) {
    return durationInRounds(itemDuration);
  }
  return durationInRounds(sentence) ?? durationInRounds(itemDuration);
}

const DURATION_WORDS = /\b(?:for|until|up to)\b.*$/i;

// What follows the bonus up to the next clause: "…against you made using ranged weapons" or
// "…against the target by spirits and undead" keeps it for some attacks only. A duration does not count.
function isRestrictedAfter(sentence, match) {
  const tail = sentence.slice(match.index + match[0].length).split(/[,;]/)[0].replace(DURATION_WORDS, "");
  return /[a-z]/i.test(tail);
}

function effectOf(sentence, itemDuration) {
  for (const rule of SUBJECT_RULES) {
    const match = sentence.match(rule.pattern);
    if (!match) {
      continue;
    }
    const read = rule.read(match);
    let changes = read.rolls;
    let ask = OPTIONAL_OR_CONDITIONAL.test(sentence) || RESTRICTED_ROLLS.test(sentence) || isRestrictedAfter(sentence, match);
    if (read.defense !== undefined) {
      changes = [{ key: "system.bonuses.defense.boons.all", value: read.defense }];
      ask = OPTIONAL_OR_CONDITIONAL.test(sentence) || isRestrictedAfter(sentence, match);
    }
    return { sentence, subject: read.subject, changes, duration: durationOf(sentence, itemDuration), ask };
  }
  return null;
}

export function parseTextEffects(html, itemDuration = "") {
  return cleanText(html)
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence !== "" && !NOT_A_STATE.test(sentence))
    .map((sentence) => effectOf(sentence, itemDuration))
    .filter(Boolean);
}

const TRIGGERED = /\b(when|whenever|if|while|until|unless|once per|action|round|minute|hour|expend|during|after|before)\b/i;

// A talent that gives a bonus all the time ("You make Strength attack rolls and challenge rolls with 1 boon"):
// nothing anywhere in its description triggers, limits or ends it.
export function isPassiveBonus(html, effect) {
  return effect.subject === "self" && !effect.ask && !effect.duration && !TRIGGERED.test(cleanText(html));
}
