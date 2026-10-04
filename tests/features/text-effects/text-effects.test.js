import { test } from "node:test";
import assert from "node:assert/strict";
import { durationInRounds, isPassiveBonus, parseTextEffects } from "../../../src/features/text-effects/text-effects.js";

test("les durées de combat sont converties en rounds : 1 minute fait 6 rounds", () => {
  assert.deepEqual(durationInRounds("for 1 round"), { rounds: 1, expiry: "roundEnd" });
  assert.deepEqual(durationInRounds("for 1 minute"), { rounds: 6, expiry: "roundEnd" });
  assert.deepEqual(durationInRounds("Concentration, up to 1 minute"), { rounds: 6, expiry: "roundEnd" });
  assert.deepEqual(durationInRounds("for 10 minutes"), { rounds: 60, expiry: "roundEnd" });
  assert.deepEqual(durationInRounds("until the end of the round"), { rounds: 1, expiry: "roundEnd" });
  assert.deepEqual(durationInRounds("until the end of its next turn"), { rounds: 1, expiry: "turnEnd" });
  assert.equal(durationInRounds("Permanent"), null);
});

test("les durées en heures ou en jours sont laissées au MJ : pas d'échéance", () => {
  assert.equal(durationInRounds("1 hour"), null);
  assert.equal(durationInRounds("Concentration, up to 1 hour"), null);
  assert.equal(durationInRounds("8 hours; see the effect"), null);
  assert.equal(durationInRounds("for 1 day"), null);
  assert.equal(durationInRounds(""), null);
});

test("un état durable sur la cible devient des pénalités sur ses jets, avec sa durée", () => {
  const [effect] = parseTextEffects("<p>When weakened in this way, the target makes Strength attack rolls and challenge rolls with 2 banes for 1 minute.</p>");

  assert.equal(effect.subject, "target");
  assert.deepEqual(effect.changes, [
    { key: "system.bonuses.attack.boons.strength", value: -2 },
    { key: "system.bonuses.challenge.boons.strength", value: -2 }
  ]);
  assert.deepEqual(effect.duration, { rounds: 6, expiry: "roundEnd" });
  assert.equal(effect.ask, true);
});

test("un bonus sans condition sur la cible s'applique sans demander, avec la durée du sort", () => {
  const [effect] = parseTextEffects("<p>For the duration, the target makes attack rolls and challenge rolls with 2 boons, gains a +20 bonus to Health.</p>", "1 minute");

  assert.equal(effect.subject, "target");
  assert.deepEqual(effect.changes, [
    { key: "system.bonuses.attack.boons.all", value: 2 },
    { key: "system.bonuses.challenge.boons.all", value: 2 }
  ]);
  assert.deepEqual(effect.duration, { rounds: 6, expiry: "roundEnd" });
  assert.equal(effect.ask, false);
});

test("des pénalités imposées à ceux qui attaquent la cible passent par sa défense", () => {
  const [shield] = parseTextEffects("<p>Until the spell ends, the light imposes 2 banes on attack rolls made against the target.</p>", "1 minute");
  assert.equal(shield.subject, "target");
  assert.deepEqual(shield.changes, [{ key: "system.bonuses.defense.boons.all", value: 2 }]);

  const [moon] = parseTextEffects("<p>While the target is illuminated in this way, attack rolls against the target are made with 1 bane.</p>");
  assert.deepEqual(moon.changes, [{ key: "system.bonuses.defense.boons.all", value: 1 }]);
  assert.equal(moon.ask, true);

  const [weak] = parseTextEffects("<p>The target grants 2 boons on attack rolls made against it.</p>");
  assert.deepEqual(weak.changes, [{ key: "system.bonuses.defense.boons.all", value: -2 }]);
});

test("un bonus pour soi s'applique au lanceur, et ce qui est optionnel ou limité demande", () => {
  const [stigmata] = parseTextEffects("<p>As well, until this effect ends you make attack rolls and challenge rolls with 1 boon.</p>");
  assert.equal(stigmata.subject, "self");
  assert.equal(stigmata.ask, false);

  const [tactical] = parseTextEffects("<p>In addition, you impose 1 bane on attack rolls made against you until the end of the round.</p>");
  assert.equal(tactical.subject, "self");
  assert.deepEqual(tactical.changes, [{ key: "system.bonuses.defense.boons.all", value: 1 }]);
  assert.deepEqual(tactical.duration, { rounds: 1, expiry: "roundEnd" });

  const [trickery] = parseTextEffects("<p>Once per round, you can make attack rolls with 1 boon.</p>");
  assert.equal(trickery.ask, true);
});

test("les jets de résistance, les jets uniques et les bonus de groupe ne sont pas des états à poser", () => {
  assert.deepEqual(parseTextEffects("<p>Each creature that sees the shadow for the first time must make a Will challenge roll with 1 bane.</p>"), []);
  assert.deepEqual(parseTextEffects("<p>It makes a Strength attack roll with 1 boon against the target's Agility.</p>"), []);
  assert.deepEqual(parseTextEffects("<p>When you use Sudden Counterstrike, you make the attack roll with 1 boon.</p>"), []);
  assert.deepEqual(parseTextEffects("<p>Each member of your group within short range of you makes attack rolls with 1 boon for 1 minute.</p>"), []);
  assert.deepEqual(parseTextEffects(undefined), []);
});

test("le sujet doit ouvrir la proposition : ce que font d'autres créatures n'est pas lu", () => {
  assert.deepEqual(parseTextEffects("<p>Animals charmed by you make attack rolls and challenge rolls with 1 boon.</p>"), []);
  assert.deepEqual(parseTextEffects("<p>Other creatures within medium range of this creature that can see it make attack rolls with 1 boon.</p>"), []);
});

test("un bonus réservé à certaines cibles, à un moment ou à un usage précis demande confirmation", () => {
  assert.equal(parseTextEffects("<p>You make attack rolls with 1 boon against targets suffering from an affliction.</p>")[0].ask, true);
  assert.equal(parseTextEffects("<p>Finally, during the first round of any combat in which you are hidden, you make attack rolls and challenge rolls with 1 boon.</p>")[0].ask, true);
  assert.equal(parseTextEffects("<p>You make attack rolls to deceive in social situations with 3 boons.</p>").length, 0);
  assert.equal(parseTextEffects("<p>You make Strength attack rolls and challenge rolls with 1 boon.</p>")[0].ask, false);
});

test("un bonus permanent n'est retenu que si rien dans le talent ne le déclenche ni ne le limite", () => {
  assert.equal(isPassiveBonus("<p>You make Strength attack rolls and challenge rolls with 1 boon.</p>", parseTextEffects("<p>You make Strength attack rolls and challenge rolls with 1 boon.</p>")[0]), true);
  const tactical = "<p>When you attack with a weapon, you can move up to half your Speed. In addition, you make attack rolls with 1 boon.</p>";
  assert.equal(isPassiveBonus(tactical, parseTextEffects(tactical)[0]), false);
  assert.deepEqual(parseTextEffects("<p>You make challenge rolls with 1 boon to avoid or remove the poisoned affliction.</p>"), []);
});

test("un bonus restreint juste après l'avoir énoncé demande confirmation", () => {
  assert.equal(parseTextEffects("<p>Finally, the wind imposes 2 banes on attack rolls against you made using ranged weapons; siege weapons ignore this effect.</p>")[0].ask, true);
  assert.equal(parseTextEffects("<p>The spell imposes 1 bane on attack rolls made against the target by spirits and undead.</p>")[0].ask, true);
  assert.equal(parseTextEffects("<p>Until the spell ends, the light imposes 2 banes on attack rolls made against the target.</p>")[0].ask, false);
  assert.equal(parseTextEffects("<p>For the duration, the target makes attack rolls and challenge rolls with 2 boons, gains a +20 bonus to Health.</p>")[0].ask, false);
  assert.equal(parseTextEffects("<p>The target makes attack rolls with 2 banes for 1 minute.</p>")[0].ask, false);
});
