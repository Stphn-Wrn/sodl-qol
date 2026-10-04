import { test } from "node:test";
import assert from "node:assert/strict";
import { readTalentText, readTalentUpgrades, talentSource } from "../../../src/features/talents/talent-text.js";

test("des dégâts en plus valables pour toute attaque sont lus, avec leurs dés", () => {
  assert.deepEqual(readTalentText("<p>Your attacks deal [[/r 1d6]] extra damage when you make an attack roll with 1 boon.</p>"), { damage: "1d6", plus20Damage: "", scope: "any" });
  assert.deepEqual(readTalentText("<p>Impaired creatures take [[/r 1d6]] extra damage from your attacks.</p>"), { damage: "1d6", plus20Damage: "", scope: "any" });
});

test("des dégâts en plus réservés aux armes ou aux sorts sont lus avec leur portée", () => {
  assert.deepEqual(readTalentText("<p>Your weapon attacks using unarmed strikes deal [[/r 1d6]] extra damage.</p>"), { damage: "1d6", plus20Damage: "", scope: "weapon" });
  assert.deepEqual(readTalentText("<p>Fire attack spells you cast while wearing the torc deal [[/r 1d6]] extra damage.</p>"), { damage: "1d6", plus20Damage: "", scope: "spell" });
});

test("des dégâts sans dé, ou avec un bonus fixe, sont lus aussi", () => {
  assert.deepEqual(readTalentText("<p>When attacking with a weapon, the creature makes the attack roll with 1 boon and deals 1 extra damage on a success.</p>"), { damage: "1", plus20Damage: "", scope: "weapon" });
  assert.deepEqual(readTalentText("<p>Your weapon attacks deal 1d6 + 2 extra damage.</p>").damage, "1d6+2");
});

test("des dégâts en plus sur un résultat de 20 ou plus vont dans les dégâts sur 20+", () => {
  assert.deepEqual(
    readTalentText("<p>When the total of your attack roll is 20 or higher and exceeds the target number by at least 5, the attack deals [[/r 1d6]] extra damage.</p>"),
    { damage: "", plus20Damage: "1d6", scope: "any" }
  );
});

test("les effets de capacités de créatures et les bonus donnés à d'autres créatures ne sont pas des bonus d'attaque", () => {
  assert.equal(readTalentText("<p>If the target is already poisoned, it instead takes [[/r 1d6]] extra damage.</p>"), null);
  assert.equal(readTalentText("<p>On a success, the target takes [[/r 2d6]] extra damage and falls prone.</p>"), null);
  assert.equal(readTalentText("<p>The monsters you create with your Conjuration spells make attack rolls with 1 boon and their attacks deal 1d6 extra damage.</p>"), null);
  assert.equal(readTalentText("<p>In addition, creatures deal 1d6 extra damage with attacks granted by your talent.</p>"), null);
});

test("une description sans dégâts en plus lisibles n'apporte rien", () => {
  assert.equal(readTalentText("<p>The triggering attack deals extra damage equal to your Will modifier.</p>"), null);
  assert.equal(readTalentText("<p>You can take another turn.</p>"), null);
  assert.equal(readTalentText(undefined), null);
});

test("la phrase utile est trouvée même au milieu d'une longue description, liens compris", () => {
  const html = "<p>Once per round, you can make an attack roll with 1 boon. If you attack with 1 boon from this @UUID[Compendium.x.Item.y]{talent}, your attack deals [[/r 1d6]] extra damage.</p>";

  assert.deepEqual(readTalentText(html), { damage: "1d6", plus20Damage: "", scope: "any" });
});

test("un talent qui améliore les dégâts d'un autre talent est reconnu, avec le talent visé", () => {
  assert.deepEqual(readTalentUpgrades("<p>The extra damage from your @UUID[Compendium.x.Item.y]{Backstab} talent increases to [[/r 2d6]].</p>"), [{ target: "Backstab", mode: "to", dice: "2d6" }]);
  assert.deepEqual(readTalentUpgrades("<p>Finally, the extra damage that Chaotic Destruction applies to Destruction spells you cast increases to 2d6.</p>"), [{ target: "Chaotic Destruction", mode: "to", dice: "2d6" }]);
  assert.equal(readTalentText("<p>The extra damage from your Backstab talent increases to [[/r 2d6]].</p>"), null);
  assert.deepEqual(readTalentUpgrades("<p>Your attacks deal 1d6 extra damage.</p>"), []);
});

test("seules les améliorations de dégâts comptent, pas celles d'un autre bonus du même talent", () => {
  const html = "<p>When you use your Eldritch Defense talent, the bonus to Defense increases to 3. When you use your Eldritch Strike talent, the extra damage increases to 2d6.</p>";

  assert.deepEqual(readTalentUpgrades(html), [{ target: "Eldritch Strike", mode: "to", dice: "2d6" }]);
});

test("une attaque avec un bâton ou une lance compte comme une attaque d'arme", () => {
  assert.equal(readTalentText("<p>When you attack with the staff, you make the attack roll with 1 boon and the attack deals [[/r 1d6]] extra damage.</p>").scope, "weapon");
});

test("la phrase qui justifie le bonus d'un talent peut être citée", () => {
  const html = "<p>Once per round, you can make an attack roll with 1 boon. If you attack with 1 boon from this talent, your attack deals [[/r 1d6]] extra damage.</p>";

  assert.equal(talentSource(html), "If you attack with 1 boon from this talent, your attack deals 1d6 extra damage.");
  assert.equal(talentSource("<p>You can take another turn.</p>"), "");
});
