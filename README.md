# Shadow of the Demon Lord - Quality of Life

[Version française](README.fr.md)

Foundry VTT quality-of-life and fixes module for **Shadow of the Demon Lord**:
- **Talents in attacks** — talents apply to weapon attacks and attack spells when the roll is made, without activating them on the sheet first, and their extra damage is no longer ignored;
- **Encumbrance fix** — the "Encumbered" effect no longer stacks on every equipment change;
- **Effect types fix** — system effects that replace a value (ancestry Speed, Size, armor Defense, afflictions…) are no longer wrongly added;
- **Effects read from texts** — lasting boons and banes written in spells and talents ("the target makes attack rolls with 2 banes for 1 minute") are put on the targets or the caster, with their duration in rounds.

Each feature can be turned off in the module settings.

**Compatibility:** Foundry VTT v13+ (tested on v14) | `demonlord` system v6.1.0+

**Languages:** English and French, following the language set in Foundry.

## Talents in attacks

### The problem

In the `demonlord` system (v6.1):
- a talent such as "an attack made with a boon deals 1d6 extra damage" only applies if the player first clicks the talent on the sheet;
- compendium talents almost never have their attack fields filled in: their effect is only written in the description;
- and even an active talent has its extra damage ignored by the attack card, because of a system bug (it stores that damage as text, then looks for it elsewhere).

As a result, talent damage almost never makes it into attacks.

### What the module does

- **System bug fix** — During every weapon or spell attack, the module gives talent extra damage the shape the card reads. The system's active talents finally apply, even without ticking anything.
- **In the attack dialog** — When a player attacks with a weapon or casts an attack spell from the sheet, the dialog that asks for boons and the modifier shows a **Talents** section: each of the character's attack talents, with what it adds ("+1 boon", "+1d6 damage", "+2 damage on 20+") and its remaining uses.
- **See what the talent does** — Hovering a talent shows its full description (conditions included). The info icon on the right opens the talent's sheet.
- **Tick to apply** — The player ticks the talents that apply to this attack. On roll, their boons are added to the roll and their extra damage shows in the chat card, as if the talent had been activated.
- **Talent bonuses** — Above the Damage button, the attack card lists, in the system's style, what each talent adds: "• +1d6 damage *(Sneak Attack)*". Hovering a line shows the sentence of the description the bonus comes from. An upgraded talent says so ("Backstab, upgraded by Brutal Backstab").
- **Damage details** — After clicking **Damage**, the damage card splits the total: "• 7 *(Crossbow, 2d6)*", "• 5 *(Trickery, 1d6)*"…
- **For this roll only** — The talent is not left active after the attack. If it has limited uses, one use is spent (only one, even when the attack has several targets). A talent with no use left is greyed out.
- **Talents already active** — A talent activated on the sheet with its attack fields filled in already applies through the system: it is shown ticked and greyed out, so its bonus is not counted twice. A talent read from its description stays tickable, since the system applies nothing for it.

### Which talents are offered

The module reads the talents **on the character sheet**, wherever they come from: core book, expansions (`sdlc-…`) or homebrew.

A talent is offered when it has attack bonuses filled in on its sheet (the system's attack effect fields):
- **extra boons**, for the ticked attributes: they only count when the attack uses one of them, as in the system;
- **extra damage**;
- **extra damage on 20+**.

**Compendium talents** — Most of them do not have these fields filled in: their effect is only written in the description. In that case, the module reads the description sentence by sentence:
- the **extra damage** ("[[/r 1d6]] extra damage", "1 extra damage", "1d6 dégâts supplémentaires"), shown marked "from the description";
- its **scope**: a talent about weapons is only offered for weapons, a talent about spells only for spells, and a talent about attacks in general for both;
- the **total of 20 or higher** ("when the total of your attack roll is 20 or higher"): that damage goes to the damage on 20+;
- **upgrades** of another talent ("the extra damage from your Backstab talent increases to 2d6"): the upgraded talent shows and applies the new value.

Effects of creature abilities ("a target already poisoned instead takes 3d6 extra damage") and bonuses given to other creatures (allies, summoned creatures) are not offered.

Checked against the 2142 talents of the system and the 14 `sdlc-…` content modules: 185 are offered for weapons, 95 for spells, and 3 upgrades are recognised (Brutal Backstab, Great Chaos, Vanguard Mastery). The others do not add damage to an attack. Boons are not read from the text, as they are almost always a condition there ("if you attack with 1 boon…"): add them with the attack dialog's counter. For a talent the text cannot be read from, fill its fields once on its sheet.

### Characters, creatures and homebrew

- **Creatures** — The module works on every actor. When the GM attacks with a weapon from a creature's sheet, the same Talents section shows the creature's talents. Special abilities that are only text have nothing to apply.
- **Homebrew talents** — A hand-made talent works as soon as its extra boons, extra damage or extra damage on 20+ are filled in.

### Limits

- **Weapon attacks** and **attack spells** made from the sheet (or a macro) are concerned. Talents that are attacks themselves, and attacks from the `sodl-custom` HUD, keep the system's behaviour.
- Damage "equal to" a value ("extra damage equal to your Will modifier") is not read.
- The module does not read the conditions written in talents ("against a frightened creature…"): the player ticks the talent when the condition is met.

## Encumbrance fix

The system finds its "Encumbered" effect by its origin (`encumbrance`). Since Foundry v14, an effect's origin must point to a document: Foundry empties it on creation, and the system never finds the effect again. As a result, **every time an encumbered character equips or unequips a weapon or armor, a new effect is added** (boon and Speed penalties stacking), and none is removed once the character is no longer encumbered.

The module keeps the system's rule (one bane on Strength and Agility rolls, and 2 less Speed, per worn armor whose requirement is not met), but finds the effect through a mark it keeps:
- there is only ever **one** "Encumbered" effect, kept up to date;
- it **disappears** once nothing encumbers the character;
- **copies already piled up** are removed when the world loads (by the GM), and on every equipment change.

The system's "Ignore encumbrance" setting is respected.

## Effect types fix

The system writes its effects with `CONST.ACTIVE_EFFECT_CHANGE_TYPES.OVERRIDE` (or `ADD`, `DOWNGRADE`, `UPGRADE`). Foundry v14 renamed these types in lower case and stores a change's type as a word (`"override"`), defaulting to `"add"`. As a result, **every system "override", "downgrade" and "upgrade" becomes an "add"**. For example:
- **ancestry Speed** is added to the base Speed (a Goblin goes from 10 to 20, then 22 with Scout); **Size** too;
- **armor fixed Defense** is added instead of replacing Defense when it is better;
- **Slowed** gives 2 Speed instead of capping it at 2, **Immobilized** no longer stops Speed, **Defenseless** adds 5 Defense instead of setting it to 5;
- **creature roles** (Size, frightening, horrifying).

The module:
- gives the names the system uses their v14 type **as soon as it loads**, for every effect created afterwards (afflictions applied later are right);
- **repairs once** the effects already saved: when the GM loads the world, it has the system rebuild the effects of every world actor's ancestries, paths, armors and roles, with the right types. A notification says how many actors were repaired.

An affliction applied before installing the module keeps its old effect: remove it and apply it again. Unlinked token actors are repaired the next time their items change.

## Effects read from texts

Most spells and talents have no configured effect: what they impose is only written in their description. The module reads the **lasting boons and banes** they give and puts them as effects.

**What is read**
- a **state on the target**: "the target makes Strength attack rolls and challenge rolls with 2 banes for 1 minute" → 2 banes on its Strength attack and challenge rolls, 6 rounds;
- **banes for whoever attacks the target**: "imposes 2 banes on attack rolls made against the target" → through its defense;
- a **bonus for the caster**: "for the duration, you make attack rolls with 1 boon".

**When**
- **when a spell is cast** or **a talent is used** from the sheet, on the **targeted tokens** (or the caster);
- **without asking** when it is unconditional;
- **with a confirmation**, quoting the sentence, when it is optional, conditional or restricted ("you can", "once per round", "on a failure", "while…", "against…", "made using ranged weapons", "by spirits and undead") and for effects on the target of an **attack spell**, which often depend on the attack hitting. One question per cast, even with several targets;
- **passive talents** whose bonus is permanent ("You make Strength attack rolls and challenge rolls with 1 boon") get a permanent effect, added and removed with the talent.

**Durations** — Only combat-scale durations are tracked, with a round of about 10 seconds: 1 round = 1, **1 minute = 6 rounds**, "until the end of the round" = until the round ends. "For the duration" uses the spell's duration ("1 minute", "Concentration, up to 1 minute"…). Durations in **hours or days** are not tracked: the effect is put without an end, and the **GM removes it** when they judge it over. Same without a readable duration.

**What is not read** — rolls to resist a spell ("must make a Will challenge roll with 1 bane"), single rolls ("makes an attack roll with 1 boon against…"), group or ally bonuses, and specialised rolls ("to deceive", "to avoid poison"). A spell or talent that **already has a configured effect** keeps the system's button, so nothing is applied twice.

A player cannot change a creature the GM owns: the effect is then created by the GM's client, which must be connected.

Checked against the 3773 talents and spells of the system and the 14 `sdlc-…` modules. Most spells that impose lasting boons or banes already have a configured effect (system button). The module takes over for those that do not: 10 spells (Cloak of Air, Heart's Desire, Augmented Vitality, Fugue, Lure…, all restricted or conditional, so with a confirmation), 25 talents on use, and 5 passive talents (Brawn, Agility, Skittish, Good Luck, Indoctrination).

## Settings

In *Game Settings → Configure Settings → L'Ombre du Seigneur Démon - Améliorations*:

| Setting | Default |
|---|---|
| Talents in attacks | on |
| Encumbrance fix | on |
| Effect types fix | on |
| Effects read from texts | on |

Turn a feature off if a system update fixes the issue on its side. The change requires reloading the world.

## Installation

See the [installation guide](INSTALLATION.md). In short, in the **Add-on Modules** tab of the Foundry setup screen, **Install Module**, then paste:

```
https://raw.githubusercontent.com/Stphn-Wrn/sodl-qol/main/module.json
```

## Development

```bash
npm test
```

The tests cover how talents are read (bonuses, reading descriptions, weapon or spell scope, upgrades, attack attribute, uses, damage details) and encumbrance (armors that encumber, single effect, removing copies). They run with `node --test`, without Foundry.

## License

MIT
