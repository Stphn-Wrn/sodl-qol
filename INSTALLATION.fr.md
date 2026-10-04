# Installation

[English version](INSTALLATION.md)

## Avant de commencer

Il vous faut :
- Foundry VTT (v13 minimum, testé sur v14) ;
- le système de jeu `demonlord` (« Shadow of the Demon Lord ») installé ;
- un accès MJ pour activer le module.

## Installer

### Option A — URL du manifeste (recommandé)

1. Sur l'écran d'accueil de Foundry, onglet **Modules**, cliquez sur **Installer un module**.
2. Collez cette URL dans le champ **URL du manifeste**, en bas de la fenêtre :
   ```
   https://raw.githubusercontent.com/Stphn-Wrn/sodl-qol/main/module.json
   ```
3. Cliquez sur **Installer**.

Avec cette méthode, Foundry propose les mises à jour automatiquement.

### Option B — Installation manuelle

Repérez votre dossier `Data` :
- **Windows** : `C:\Users\[VotreNom]\AppData\Local\FoundryVTT\Data`
- **macOS** : `~/Library/Application Support/FoundryVTT/Data`
- **Linux** : `~/.foundryvtt/Data`

Créez un dossier `sodl-qol` dans `Data/modules/` et copiez-y tous les fichiers du module (`module.json` doit être à la racine de ce dossier).

## Activer dans le monde

1. Lancez un monde qui utilise le système `demonlord`.
2. **Paramètres → Gérer les modules**.
3. Cochez **« L'Ombre du Seigneur Démon - Améliorations »**, puis enregistrez.

> Le module n'apparaît dans cette liste que si le monde utilise une version compatible du système `demonlord` (voir `module.json` → `relationships.systems`).

Une fois le monde rechargé, les fenêtres d'attaque d'arme et de sort affichent la section **Talents** quand le personnage a des talents d'attaque, et l'encombrement est corrigé. Chaque fonctionnalité se désactive dans *Paramètres → Configurer les paramètres → L'Ombre du Seigneur Démon - Améliorations* (rechargement du monde nécessaire).

## Mettre à jour

**Installé par l'URL du manifeste** — Onglet **Modules**, bouton **Mettre à jour** à côté du module.

**Installé manuellement** — Supprimez `Data/modules/sodl-qol/`, copiez la nouvelle version, puis rechargez le monde (Ctrl+Maj+R pour vider le cache des scripts).

Le module ne stocke aucune donnée : les talents restent sur les fiches.

## Désinstaller

1. **Gérer les modules** : décochez le module et enregistrez.
2. Supprimez le dossier `sodl-qol`.

## Dépannage

**Le module n'apparaît pas dans « Gérer les modules »**
- Le dossier est-il dans `Data/modules/`, avec `module.json` à sa racine ?
- Le monde utilise-t-il le système `demonlord` (c'est l'identifiant qui compte, pas le nom affiché), dans une version assez récente ?

**La section Talents n'apparaît pas dans la fenêtre d'attaque**
- L'attaque doit être lancée avec une arme, ou un sort d'attaque, depuis la fiche du personnage.
- Le personnage doit avoir au moins un talent qui apporte quelque chose à l'attaque : des faveurs, des dégâts supplémentaires ou des dégâts sur 20+ renseignés dans sa fiche, ou des dégâts supplémentaires écrits dans sa description (« 1d6 extra damage »). Des faveurs ne comptent que pour les caractéristiques cochées dans le talent.
- Rafraîchissez (F5) et ouvrez la console (F12) pour repérer une erreur de chargement.

**La Vitesse, la Taille ou la Défense d'un personnage est trop haute**
- C'est le bug des types d'effets (par exemple un Goblin à 20 ou 22 de Vitesse). Vérifiez que **Correction des types d'effets** est activé, puis chargez le monde en MJ : les effets sont réparés une fois, avec une notification.

**Un sort ou un talent n'applique pas son effet**
- Il faut **cibler** les jetons avant de lancer le sort ou d'utiliser le talent depuis la fiche.
- Seules les faveurs et pénalités **durables** sont lues (« the target makes attack rolls with 2 banes… ») ; un sort qui a déjà un effet configuré utilise le bouton du système sur sa carte.
- Pour une créature que le joueur ne contrôle pas, un MJ doit être connecté.

**Un personnage a plusieurs effets « Encombré »**
- Vérifiez que **Correction de l'encombrement** est activé dans les paramètres du module, puis rechargez le monde en étant connecté en MJ : les doublons sont supprimés au chargement.

**Un talent est grisé**
- Il est déjà actif sur la fiche (son bonus s'applique déjà), ou il n'a plus d'utilisation. Les utilisations se récupèrent comme d'habitude dans le système.
