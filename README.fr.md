# L'Ombre du Seigneur Démon - Améliorations

[English version](README.md)

Module Foundry VTT de confort et de corrections pour **L'Ombre du Seigneur Démon** :
- **Talents dans les attaques** — les talents s'appliquent au moment des attaques d'arme et des sorts d'attaque, sans avoir à les activer avant sur la fiche, et leurs dégâts supplémentaires ne sont plus ignorés ;
- **Correction de l'encombrement** — l'effet « Encombré » ne se cumule plus à chaque changement d'équipement ;
- **Correction des types d'effets** — les effets du système qui remplacent une valeur (Vitesse d'ascendance, Taille, Défense des armures, afflictions…) ne s'ajoutent plus à tort ;
- **Effets lus dans les textes** — les faveurs et pénalités durables écrites dans les sorts et talents (« the target makes attack rolls with 2 banes for 1 minute ») sont posées sur les cibles ou le lanceur, avec leur durée en rounds.

Chaque fonctionnalité peut être désactivée dans les paramètres du module.

**Compatibilité :** Foundry VTT v13+ (testé sur v14) | Système `demonlord` v6.1.0+

**Langues :** français et anglais, selon la langue choisie dans Foundry.

## Talents dans les attaques

### Le problème

Dans le système `demonlord` (v6.1) :
- un talent comme « une attaque avec une faveur inflige 1d6 dégâts supplémentaires » ne s'applique que si le joueur clique d'abord sur le talent dans la fiche ;
- les talents des compendiums n'ont presque jamais leurs champs d'attaque remplis : leur effet n'est écrit que dans la description ;
- et même un talent actif voit ses dégâts supplémentaires ignorés par la carte d'attaque, à cause d'un bug du système (il range ces dégâts en texte, puis les cherche ailleurs).

Résultat : les dégâts des talents ne s'ajoutent presque jamais aux attaques.

### Ce que fait le module

- **Correction du bug du système** — Pendant chaque attaque d'arme ou de sort, le module présente les dégâts supplémentaires des talents sous la forme que la carte lit. Les talents actifs du système s'appliquent donc enfin, même sans rien cocher.
- **Dans la fenêtre d'attaque** — Quand un joueur attaque avec une arme ou lance un sort d'attaque depuis la fiche, la fenêtre qui demande les faveurs et le modificateur affiche une section **Talents** : chaque talent d'attaque du personnage, avec ce qu'il apporte (« +1 faveur », « +1d6 dégâts », « +2 dégâts sur 20+ ») et ses utilisations restantes.
- **Voir ce que fait le talent** — Au survol d'un talent, sa description complète s'affiche (conditions comprises). L'icône d'information à droite ouvre la fiche du talent.
- **Cocher pour appliquer** — Le joueur coche les talents qui s'appliquent à cette attaque. Au lancer, leurs faveurs s'ajoutent au jet et leurs dégâts en plus apparaissent dans la carte de chat, comme si le talent avait été activé.
- **Bonus des talents** — Au-dessus du bouton Dégâts, la carte de l'attaque liste, dans le style du système, ce que chaque talent ajoute : « • +1d6 dégâts *(Trickery)* ». Au survol d'une ligne, la phrase de la description qui justifie le bonus s'affiche. Un talent amélioré l'indique (« Backstab, amélioré par Brutal Backstab »).
- **Détail des dégâts** — Après un clic sur **Dégâts**, la carte de dégâts répartit le total : « • 7 *(Crossbow, 2d6)* », « • 5 *(Trickery, 1d6)* »…
- **Pour ce jet seulement** — Le talent n'est pas laissé actif après l'attaque. S'il a un nombre d'utilisations limité, une utilisation est consommée (une seule, même si l'attaque vise plusieurs cibles). Un talent sans utilisation restante est grisé.
- **Talents déjà actifs** — Un talent activé sur la fiche dont les champs d'attaque sont remplis s'applique déjà par le système : il est affiché coché et grisé, pour ne pas compter son bonus deux fois. Un talent lu d'après sa description reste à cocher, car le système ne lui applique rien.

### Quels talents sont proposés

Le module lit les talents **présents sur la fiche du personnage**, quelle que soit leur origine : livre de base, extensions (`sdlc-…`) ou création maison.

Un talent est proposé s'il a des bonus d'attaque renseignés dans sa fiche (onglet des effets d'attaque du système) :
- **faveurs supplémentaires**, pour les caractéristiques cochées : elles ne comptent que si l'attaque utilise l'une d'elles, comme dans le système ;
- **dégâts supplémentaires** ;
- **dégâts supplémentaires sur 20+**.

**Talents des compendiums** — La plupart n'ont pas ces champs remplis : leur effet n'est écrit que dans la description. Dans ce cas, le module lit la description phrase par phrase :
- les **dégâts supplémentaires** (« [[/r 1d6]] extra damage », « 1 extra damage », « 1d6 dégâts supplémentaires »), affichés avec la mention « d'après la description » ;
- leur **portée** : un talent qui parle d'armes n'est proposé que pour les armes, un talent qui parle de sorts que pour les sorts, et un talent qui parle d'attaques en général pour les deux ;
- le **résultat de 20 ou plus** (« when the total of your attack roll is 20 or higher ») : ces dégâts vont dans les dégâts sur 20+ ;
- les **améliorations** d'un autre talent (« the extra damage from your Backstab talent increases to 2d6 ») : le talent visé affiche et applique la nouvelle valeur.

Les effets de capacités de créatures (« a target already poisoned instead takes 3d6 extra damage ») et les bonus donnés à d'autres créatures (alliés, créatures invoquées) ne sont pas proposés.

Vérifié sur les 2142 talents du système et des 14 modules de contenu `sdlc-…` : 185 sont proposés pour les armes, 95 pour les sorts, et 3 améliorations sont reconnues (Brutal Backstab, Great Chaos, Vanguard Mastery). Les autres n'ajoutent pas de dégâts à une attaque. Les faveurs ne sont pas lues dans le texte, car elles y sont presque toujours une condition (« si vous attaquez avec 1 faveur… ») : ajoutez-les avec le compteur de la fenêtre d'attaque. Pour un talent que le texte ne permet pas de lire, remplissez ses champs une fois dans sa fiche.

### Personnages, créatures et créations maison

- **Créatures** — Le module agit sur tous les acteurs. Quand le MJ attaque avec une arme depuis la fiche d'une créature, la même section Talents apparaît avec les talents de la créature. Les capacités spéciales qui ne sont que du texte n'ont rien à appliquer.
- **Talents maison** — Un talent créé à la main fonctionne dès que ses faveurs, ses dégâts supplémentaires ou ses dégâts sur 20+ sont renseignés.

### Limites

- Les **attaques d'arme** et les **sorts d'attaque** lancés depuis la fiche (ou une macro) sont concernés. Les talents qui sont eux-mêmes des attaques, et les attaques du HUD de `sodl-custom`, gardent le fonctionnement du système.
- Les dégâts « égaux à » une valeur (« extra damage equal to your Will modifier ») ne sont pas lus.
- Le module ne lit pas les conditions écrites dans les talents (« contre une créature effrayée… ») : c'est au joueur de cocher le talent quand la condition est remplie.

## Correction de l'encombrement

Le système retrouve son effet « Encombré » par son origine (`encumbrance`). Depuis Foundry v14, l'origine d'un effet doit désigner un document : Foundry la vide à la création, et le système ne retrouve plus jamais l'effet. Résultat : **chaque fois qu'un personnage encombré équipe ou déséquipe une arme ou une armure, un nouvel effet s'ajoute** (malus de faveurs et de Vitesse cumulés), et aucun n'est retiré quand le personnage n'est plus encombré.

Le module reprend le calcul du système (une faveur en moins sur les jets de Force et d'Agilité, et 2 de Vitesse en moins, par armure portée dont le prérequis n'est pas atteint), mais retrouve l'effet par une marque qu'il conserve :
- il n'y a jamais qu'**un seul** effet « Encombré », mis à jour ;
- il **disparaît** quand plus rien n'encombre ;
- les **doublons déjà accumulés** sont supprimés au chargement du monde (par le MJ), et à chaque changement d'équipement.

Le paramètre du système « Ignorer l'encombrement » est respecté.

## Correction des types d'effets

Le système écrit ses effets avec `CONST.ACTIVE_EFFECT_CHANGE_TYPES.OVERRIDE` (ou `ADD`, `DOWNGRADE`, `UPGRADE`). Foundry v14 a renommé ces types en minuscules et range le type d'une modification sous forme de mot (`"override"`), avec `"add"` par défaut. Résultat : **tous les « remplacer », « au plus » et « au moins » du système deviennent des « ajouter »**. Par exemple :
- la **Vitesse d'ascendance** s'ajoute à la Vitesse de base (un Goblin passe de 10 à 20, puis 22 avec Scout) ; la **Taille** aussi ;
- la **Défense fixe des armures** s'ajoute au lieu de remplacer la Défense quand elle est meilleure ;
- **Ralenti** donne 2 de Vitesse au lieu de la limiter à 2, **Immobilisé** ne bloque plus la Vitesse, **Sans défense** ajoute 5 de Défense au lieu de la fixer à 5 ;
- les **rôles de créature** (Taille, effrayant, terrifiant).

Le module :
- rend aux noms utilisés par le système leur type v14, **dès son chargement**, pour tous les effets créés ensuite (les afflictions appliquées après coup sont donc justes) ;
- **répare une fois** les effets déjà enregistrés : au chargement du monde par le MJ, il fait reconstruire par le système les effets des ascendances, voies, armures et rôles de chaque acteur du monde, avec les bons types. Une notification indique combien d'acteurs ont été réparés.

Une affliction déjà appliquée avant l'installation garde son ancien effet : retirez-la puis remettez-la. Les acteurs de jetons non liés sont réparés au prochain changement de leurs objets.

## Effets lus dans les textes

La plupart des sorts et talents n'ont pas d'effet configuré : ce qu'ils imposent n'est écrit que dans leur description. Le module lit les **faveurs et pénalités durables** qu'ils donnent et les pose comme effets.

**Ce qui est lu**
- un **état sur la cible** : « the target makes Strength attack rolls and challenge rolls with 2 banes for 1 minute » → 2 pénalités à ses jets d'attaque et de caractéristique de Force, 6 rounds ;
- des **pénalités pour ceux qui attaquent la cible** : « imposes 2 banes on attack rolls made against the target » → passe par sa défense ;
- un **bonus pour le lanceur** : « for the duration, you make attack rolls with 1 boon ».

**Quand**
- **au lancement d'un sort** ou à **l'utilisation d'un talent** depuis la fiche, sur les **jetons ciblés** (ou sur le lanceur) ;
- **sans demander** quand c'est inconditionnel ;
- **avec confirmation**, phrase à l'appui, quand c'est optionnel, conditionnel ou restreint (« you can », « once per round », « on a failure », « while… », « against… », « made using ranged weapons », « by spirits and undead ») et pour les effets sur la cible d'un **sort d'attaque**, qui dépendent souvent du fait que l'attaque touche. Une seule question par lancement, même avec plusieurs cibles ;
- les **talents passifs** dont le bonus est permanent (« You make Strength attack rolls and challenge rolls with 1 boon ») reçoivent un effet permanent, ajouté et retiré avec le talent.

**Durées** — Seules les durées de combat sont suivies, avec un round d'environ 10 secondes : 1 round = 1, **1 minute = 6 rounds**, « until the end of the round » = jusqu'à la fin du round. « For the duration » reprend la durée du sort (« 1 minute », « Concentration, up to 1 minute »…). Les durées en **heures ou en jours** ne sont pas suivies : l'effet est posé sans échéance, et le **MJ le retire** quand il le juge écoulé. Idem sans durée lisible.

**Ce qui n'est pas lu** — les jets pour résister à un sort (« must make a Will challenge roll with 1 bane »), les jets uniques (« makes an attack roll with 1 boon against… »), les bonus de groupe ou d'alliés, et les jets spécialisés (« to deceive », « to avoid poison »). Un sort ou talent qui a **déjà un effet configuré** garde le bouton du système, pour ne rien appliquer deux fois.

Un joueur ne peut pas modifier une créature du MJ : l'effet est alors posé par le client du MJ, qui doit être connecté.

Vérifié sur les 3773 talents et sorts du système et des 14 modules `sdlc-…`. La plupart des sorts qui imposent des faveurs ou pénalités durables ont déjà un effet configuré (bouton du système). Le module prend le relais pour ceux qui n'en ont pas : 10 sorts (Cloak of Air, Heart's Desire, Augmented Vitality, Fugue, Lure…, tous restreints ou conditionnels, donc avec confirmation), 25 talents à l'utilisation, et 5 talents passifs (Brawn, Agility, Skittish, Good Luck, Indoctrination).

## Paramètres

Dans *Paramètres → Configurer les paramètres → L'Ombre du Seigneur Démon - Améliorations* :

| Paramètre | Par défaut |
|---|---|
| Talents dans les attaques | activé |
| Correction de l'encombrement | activé |
| Correction des types d'effets | activé |
| Effets lus dans les textes | activé |

Désactivez une fonctionnalité si une mise à jour du système corrige le problème de son côté. Le changement demande de recharger le monde.

## Installation

Voir le [guide d'installation](INSTALLATION.fr.md). En bref, dans l'onglet **Modules** de l'écran d'accueil de Foundry, **Installer un module**, puis coller :

```
https://raw.githubusercontent.com/Stphn-Wrn/sodl-qol/main/module.json
```

## Développement

```bash
npm test
```

Les tests couvrent la lecture des talents (bonus, lecture des descriptions, portée arme ou sort, améliorations, caractéristique d'attaque, utilisations, détail des dégâts) et l'encombrement (armures qui encombrent, effet unique, suppression des doublons). Ils tournent avec `node --test`, sans Foundry.

## Licence

MIT
