# Installation

[Version française](INSTALLATION.fr.md)

## Before you start

You need:
- Foundry VTT (v13 minimum, tested on v14);
- the `demonlord` game system ("Shadow of the Demon Lord") installed;
- GM access to enable the module.

## Install

### Option A — Manifest URL (recommended)

1. On the Foundry setup screen, **Add-on Modules** tab, click **Install Module**.
2. Paste this URL in the **Manifest URL** field at the bottom of the window:
   ```
   https://raw.githubusercontent.com/Stphn-Wrn/sodl-qol/main/module.json
   ```
3. Click **Install**.

With this method, Foundry offers updates automatically.

### Option B — Manual install

Find your `Data` folder:
- **Windows**: `C:\Users\[YourName]\AppData\Local\FoundryVTT\Data`
- **macOS**: `~/Library/Application Support/FoundryVTT/Data`
- **Linux**: `~/.foundryvtt/Data`

Create a `sodl-qol` folder in `Data/modules/` and copy all the module files into it (`module.json` must be at the root of that folder).

## Enable in the world

1. Launch a world that uses the `demonlord` system.
2. **Game Settings → Manage Modules**.
3. Check **"L'Ombre du Seigneur Démon - Améliorations"**, then save.

> The module only shows up in this list if the world uses a compatible version of the `demonlord` system (see `module.json` → `relationships.systems`).

Once the world reloads, weapon and spell attack dialogs show the **Talents** section when the character has attack talents, and encumbrance is fixed. Each feature can be turned off in *Game Settings → Configure Settings → L'Ombre du Seigneur Démon - Améliorations* (the world must be reloaded).

## Update

**Installed from the manifest URL** — **Add-on Modules** tab, **Update** button next to the module.

**Installed manually** — Delete `Data/modules/sodl-qol/`, copy the new version, then reload the world (Ctrl+Shift+R to clear the script cache).

The module stores no data: talents stay on the sheets.

## Uninstall

1. **Manage Modules**: uncheck the module and save.
2. Delete the `sodl-qol` folder.

## Troubleshooting

**The module does not show up in "Manage Modules"**
- Is the folder in `Data/modules/`, with `module.json` at its root?
- Does the world use the `demonlord` system (the ID matters, not the displayed name), at a recent enough version?

**The Talents section does not show in the attack dialog**
- The attack must be made with a weapon, or an attack spell, from the character sheet.
- The character needs at least one talent that adds something to the attack: extra boons, extra damage or extra damage on 20+ filled in on its sheet, or extra damage written in its description ("1d6 extra damage"). Boons only count for the attributes ticked on the talent.
- Refresh (F5) and open the console (F12) to spot a loading error.

**A character's Speed, Size or Defense is too high**
- This is the effect types bug (for instance a Goblin with 20 or 22 Speed). Check that **Effect types fix** is on, then load the world as GM: effects are repaired once, with a notification.

**A spell or talent does not apply its effect**
- Target the tokens before casting the spell or using the talent from the sheet.
- Only **lasting** boons and banes are read ("the target makes attack rolls with 2 banes…"); a spell that already has a configured effect uses the system's button on its card.
- For a creature the player does not control, a GM must be connected.

**A character has several "Encumbered" effects**
- Check that **Encumbrance fix** is on in the module settings, then reload the world while logged in as GM: copies are removed on load.

**A talent is greyed out**
- It is already active on the sheet (its bonus already applies), or it has no use left. Uses come back as usual in the system.
