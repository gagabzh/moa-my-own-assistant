---
name: |
  planning-semaine
description: |
  Load this skill when the user asks for a weekly planning review, a specific week plan, or to plan sport sessions, hobby project sessions (e.g. painting, building), meal prep shopping or the week's menu. Also use when they give weekly constraints (competitions, absences, remote/onsite work days, weather) to generate the concrete planning of the upcoming week.
---

# Planning hebdomadaire — génération de semaine

## Objectif

Générer le planning concret d'une semaine à partir du planning type (`references/planning-type.md` — TOUJOURS le lire avant de générer) et des contraintes spécifiques de la semaine, communiquées par l'utilisateur ou demandées explicitement.

> ⚠️ `references/planning-type.md` est un fichier **local, jamais versionné** (voir `.gitignore` et `planning-type.example.md`). S'il est absent, demander à l'utilisateur de copier l'exemple et de le remplir avant de continuer.

## Flux de travail

1. **Lire `references/planning-type.md`** (situé dans ce répertoire skill).
2. **Période couverte : du SAMEDI au VENDREDI suivant**. La review du vendredi planifie le week-end immédiat. Quand l'utilisateur dit « ce week-end » le vendredi, il parle du week-end qui commence le lendemain.
3. **Déterminer la saison / trimestre** à partir de la date courante pour choisir la logique sportive et de loisirs (voir « Calendrier saisonnier » dans planning-type.md).
4. **Collecter les contraintes de la semaine**. Si elles n'ont pas été données, les demander (une seule fois, de façon groupée) :
   - Semaine de compétition / événement ? (date et format)
   - Week-end absent ? (→ meal prep basculé au lundi midi)
   - Jour de présentiel déplacé ? Autre créneau modifié ?
   - Météo prévue ? (mauvaise météo → remplacer la séance extérieure par l'alternative indoor configurée)
   - Invités/repas spéciaux, contraintes alimentaires ?
   - Avancement des projets de loisir (demander si inconnu).
   - Suivi santé du moment (ex. dernière pesée et tendance).
5. **Générer le planning de la semaine** au format ci-dessous.
6. **Proposer d'enregistrer l'avancement** (santé, unités terminées, jalons de projets) dans la base de connaissance si l'utilisateur l'accepte.

## Format de sortie du planning de semaine

Un tableau jour par jour avec horaires, puis 3 sections :

### 1. Planning jour par jour
Tableau : jour | matin | midi | soir | week-end (horaires spécifiques). **Commencer par le samedi et finir par le vendredi**. Chaque case contient l'activité concrète avec horaires.

### 2. Meal prep & courses
**Déléguer au skill `menu-semaine`** : charger ses préférences et générer menu + liste de courses selon son format. Synchroniser : les soirées qui suivent une séance longue/intense = protéine animale autorisée si configuré ainsi ; meal prep le week-end ou lundi midi selon la présence de l'utilisateur.

### 3. Points de vigilance de la semaine
- 2–4 points max spécifiques à la semaine (imprévus de compétition, bascule de créneaux, risque sur une unité longue, etc.)

## Règles de priorité

- Les créneaux marqués **intouchables** dans planning-type.md sont intouchables.
- Semaine de compétition : réduire les loisirs de moitié, garder le meal prep, alléger la séance longue 2–3 jours avant.
- Week-end absent : meal prep le lundi midi, planif de semaine le vendredi soir.
- Les créneaux extensibles listés dans planning-type.md peuvent s'étendre pour récupérer du retard, dans la limite définie.
- Toujours conserver la review de fin de semaine.
- Ne jamais planifier plus de créneaux que le planning type n'en contient — pas de surcharge pour « rattraper ».
