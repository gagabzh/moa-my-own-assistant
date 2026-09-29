---
name: |
  menu-semaine
description: |
  Load this skill when the user asks for a weekly menu, meal plan, meal prep plan, food shopping list, or recipes matching their preferences. Also load it from planning-semaine when generating the meal prep & courses section of the weekly plan. Also load it when the user reports food stock usage or purchases to update their pantry database (see references/preferences.md, section « Stock sec »).
---

# Menu semaine — planificateur de repas

Génère le menu de la semaine (déjeuners meal prepés + dîners) et la liste de courses, à partir des préférences figées dans `references/preferences.md` (TOUJOURS le lire d'abord) et des contraintes de la semaine communiquées par l'utilisateur.

> ⚠️ `references/preferences.md` est un fichier **local, jamais versionné** (voir `.gitignore` et `preferences.example.md`). S'il est absent, demander à l'utilisateur de copier l'exemple et de le remplir avant de continuer.

## Flux de travail

1. **Lire `references/preferences.md`** puis `references/legumes-saisons.md`.
2. **Lire l'inventaire du stock sec** tel que défini dans `references/preferences.md` (section « Stock sec » : source de données, colonnes). Si aucune source n'est configurée, ignorer les sections stock.
3. **Période couverte** : du SAMEDI au VENDREDI suivant (cycle de review hebdo, configurable dans preferences.md). Le menu et la liste de courses couvrent sam. → ven.
4. **Déterminer le mois courant** pour choisir les légumes de saison et la logique dîner (soupes en hiver, salades composées en été).
5. **Collecter les contraintes de la semaine** si non fournies :
   - Meal prep le week-end (batch cooking) ou lundi midi (pas de batch → plats rapides) ?
   - Séances longues/intenses planifiées ? → protéine animale autorisée le soir de ces séances (si l'utilisateur l'autorise dans ses préférences)
   - Invités/repas spéciaux, contraintes ponctuelles
6. **Générer le menu** (format ci-dessous), puis la **liste de courses** agrégée par rayon (quantités selon le nombre de portions configuré).

## Règles de génération

- **Répétition** : chaque plat couvre 2–4 repas dans la semaine.
- **Structure d'assiette** : par défaut ¼ protéines, ¼ féculents, ½ légumes (modifiable dans preferences.md). Vérifier l'équilibre global de la journée.
- **Régime par défaut** : défini dans preferences.md (ex. végétarien). Protéines végétales : légumineuses, tofu, tempeh, œufs, fromage, soja.
- **Protéine animale** : seulement selon la règle configurée dans preferences.md (ex. repas suivant une séance longue ou intense). Jamais par défaut.
- **Légumes de saison uniquement** — utiliser `references/legumes-saisons.md` selon le mois. Ne jamais proposer un légume hors saison.
- **Interdits absolus** : liste définie dans preferences.md. Vérifier chaque recette (y compris dans les soupes, gratins, salades composées, desserts).
- **Plats complets récurrents** : privilégier les plats uniques qui se conservent et se répètent (quiche de légumes, curry de lentilles, gratins, salades composées, chili, soupes-repas). 2–3 plats distincts par semaine maximum.
- **Temps de cuisine** : selon preferences.md (ex. batch 1–2 h le week-end ; 15–30 min max par dîner en semaine).
- **Dîners selon saison** : hiver → soupes-repas ; été → salades composées ; intersaisons → libre.
- **Objectif santé** : défini dans preferences.md (ex. déficit léger, cible de poids). Ne jamais proposer de régime crash.

## Stock sec (source configurée dans preferences.md)

- **DLC proches** : lister les articles dont la DLC expire dans les 30 jours (ou déjà dépassée). Proposer en priorité des recettes qui les utilisent, si compatibles avec les préférences. Ne jamais sacrifier une règle de préférence pour écouler une DLC. Signaler ces articles uniquement à la génération d'un menu.
- **Pas de rachat inutile** : pour chaque ingrédient sec du menu, si le stock couvre le besoin de la semaine, ne PAS l'ajouter à la liste de courses.
- **Rachat sous seuil** : ajouter automatiquement à la liste de courses tout article passé sous son seuil de rachat, avec la mention « sous le seuil ».
- **Quantités** : déduire approximativement les quantités de sec utilisées et les mentionner dans les notes (pas de mise à jour automatique de la base — uniquement sur demande).

## Mises à jour du stock

Quand l'utilisateur signale une consommation ou un achat (ex. « j'ai utilisé 100 g de farine ») :
1. Chercher l'article dans la source de stock (fetch/query).
2. Mettre à jour la Quantité (déduction ou ajout, en respectant l'Unité ; convertir si nécessaire).
3. Signaler si la nouvelle Quantité passe sous le Seuil de rachat (« ⚠️ sous le seuil, à racheter »).
4. Si l'article n'existe pas, le créer et demander le seuil de rachat.
- N'alerter sur les DLC **que** lors de la génération d'un menu.

## Format de sortie

### 1. Menu de la semaine
Tableau : Jour | Déjeuner | Dîner — du samedi au vendredi suivant. Indiquer pour chaque plat : nom, portion, et le marquer « batch » ou « express ».

### 2. Plan de batch cooking
Si meal prep week-end : liste des recettes avec ordre de préparation et temps estimé total.

### 3. Liste de courses
Agrégée par rayon (fruits & légumes, épicerie, frais, surgelés), quantités selon le nombre de portions configuré. Vérifier les restes du meal prep précédent si précisé.

### 4. Notes
1–2 lignes : correspondance séances sportives ↔ protéines, astuces de conservation, congélation.

### 5. Stock & DLC
Section « ⚠️ Stock & DLC » : articles à DLC proche utilisés en priorité, articles sous le seuil, estimation des quantités de stock sec consommées.
