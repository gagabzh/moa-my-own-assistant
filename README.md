# Moa — my own assistant

Skills Vibe personnels, partageables entre plusieurs machines et avec la CLI Vibe, **sans exposer de données personnelles**.

## Skills inclus

| Skill | Rôle |
|---|---|
| `menu-semaine` | Menu de la semaine (meal prep + dîners), liste de courses par rayon, gestion du stock sec (DLC, seuils de rachat) |
| `planning-semaine` | Planning hebdomadaire concret (sport, loisirs, santé, meal prep) à partir d'un planning type et des contraintes de la semaine |

## Principe : skills génériques + données perso locales

Chaque skill lit un fichier de configuration **local, jamais commité** :

- `menu-semaine/references/preferences.md` : tes données (gitignoré) ; modèle : `preferences.example.md`
- `planning-semaine/references/planning-type.md` : tes données (gitignoré) ; modèle : `planning-type.example.md`

Le `.gitignore` exclut `preferences.md` et `planning-type.md` : impossible de pousser tes données perso par accident.

## Installation (CLI Vibe)

1. Cloner le repo dans le dossier skills de la CLI Vibe (adapter le chemin selon ton installation).
2. Créer les fichiers perso :

    cp menu-semaine/references/preferences.example.md menu-semaine/references/preferences.md
    cp planning-semaine/references/planning-type.example.md planning-semaine/references/planning-type.md

3. Remplir les deux fichiers avec tes contraintes réelles.

## Mise à jour

`git pull` — les fichiers perso (gitignorés) ne sont jamais écrasés.
