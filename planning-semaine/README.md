# Planning Semaine - Système de Notification

Ce skill permet de générer un planning hebdomadaire à partir de vos données Notion, **et de sauvegarder ce planning** pour que les **scheduled tasks de Vibe Work** puissent générer un briefing quotidien personnalisé.

## 🎯 Problème résolu

Auparavant, les scheduled tasks de Vibe Work ne pouvaient accéder qu'aux **règles génériques** du planning type, et non aux **décisions spécifiques** prises lors de la review du vendredi (compétitions, absences, changement de créneaux, etc.).

Avec cette modification, le planning concret généré est **sauvegardé dans Notion** et peut être récupéré par la scheduled task pour générer un briefing quotidien précis.

---

## ✅ Configuration requise

### 1. Créer la base de données Notion "Plannings Hebdomadaires"

**Étapes :**
1. Dans Notion, créez une nouvelle **base de données** (type Table)
2. Nommez-la : `Plannings Hebdomadaires`
3. Ajoutez ces **propriétés** :
   | Nom | Type | Description |
   |-----|------|-------------|
   | Nom | Title | Nom de la semaine (ex: "Semaine 2026-10-04 - 2026-10-10") |
   | Date début | Date | Samedi de la semaine |
   | Date fin | Date | Vendredi de la semaine |
   | Contenu | Rich Text | Le planning complet en markdown |
   | Statut | Select | "À venir", "En cours", "Terminé" |

4. **Récupérez l'ID de la base** :
   - Ouvrez la base dans Notion
   - Copiez l'URL : `https://www.notion.so/[workspace]/[database_id]?v=...`
   - L'ID est la partie après le nom du workspace (32 caractères)
   - Exemple : `https://www.notion.so/monworkspace/8a7e425c84884e9c810e0d11c0c5618c?v=...` → ID = `8a7e425c84884e9c810e0d11c0c5618c`

---

### 2. Configurer le skill

Éditez le fichier `generate-briefing.ts` et mettez à jour la configuration :

```typescript
const CONFIG = {
  // ID de la base de données Notion "Plannings Hebdomadaires"
  // Base créée : https://app.notion.com/p/d17a978755fb470590605e3c71630aa7
  NOTION_DATABASE_ID: "2698c5ac-eb72-47ac-8943-39c377c54110", // ID de la base
  
  // ID de la page Planning Type (déjà configuré)
  PLANNING_TYPE_PAGE_ID: "3eaeb7da605181a58e5fc7092116b872",
  
  // Parent page ID pour fallback
  PARENT_PAGE_ID: "0f28e015f76949eeaf2985e10d4c64e3",
  
  // Utiliser le fallback vers le planning type
  USE_FALLBACK: true
};
```

**Alternative** : Créez un fichier `config.toml` dans le dossier du skill avec :
```toml
[notion]
weekly_plannings_database_id = "votre_id_ici"
```

---

### 3. Tester la sauvegarde

Lors de votre prochaine **review du vendredi**, utilisez la commande :

```
/planning review cette semaine
```

Le skill va :
1. Générer le planning concret de la semaine
2. **Sauvegarder automatiquement** ce planning dans la base Notion
3. Définir le statut à "À venir"

**Vérifiez** que le planning apparaît bien dans votre base de données Notion.

---

### 4. Configurer la Scheduled Task dans Vibe Work

**Étapes dans Vibe Work :**

1. Allez dans **Settings** → **Scheduled Tasks** (ou "Tâches planifiées")
2. Cliquez sur **"Add Task"** ou **"Nouvelle tâche"**
3. Configurez comme suit :
   - **Nom** : `Briefing quotidien - Planning`
   - **Description** : Génère le briefing quotidien à partir du planning de la semaine
   - **Fréquence** : `Tous les jours`
   - **Heure** : `21:00` (recommandé pour éviter les retards)
   - **Timezone** : `Europe/Paris`
   - **Commande** : `/planning briefing aujourd'hui`
   - **Activer** : ✅ Oui

4. **Sauvegardez**

---

## 🔧 Comment ça marche

### Flux normal (avec planning sauvegardé)

```
Vibe Work (21h00)
    ↓
Scheduled Task: /planning briefing aujourd'hui
    ↓
Appel à generateDailyBriefing()
    ↓
1. Récupère le planning de la semaine depuis Notion
   (via getCurrentWeekPlanning())
    ↓
2. Extraire les infos du jour
   (via generateBriefingFromPlanning())
    ↓
3. Retourne le briefing formaté
    ↓
Notification sur votre téléphone 📱
```

### Flux de fallback (si aucun planning sauvegardé)

```
Vibe Work (21h00)
    ↓
Scheduled Task: /planning briefing aujourd'hui
    ↓
1. Aucun planning trouvé pour cette semaine
    ↓
2. Utilise le Planning Type générique
   (via generateFallbackBriefing())
    ↓
3. Retourne le briefing avec un message d'avertissement
    ↓
Notification: "⚠️ Aucun planning spécifique trouvé..."
```

---

## 📊 Exemple de briefing généré

```markdown
# 📋 Briefing du lundi 05/10/2026 - 21:00

## 🎯 Objectifs du jour
- **Sport** : Renfort + pesée à 7h45-8h15
- **Warhammer** : Orks - Sous-bases puis premières unités
- **Lego** : Colline - En cours

## ⏰ Créneaux de la journée
| Moment | Activité |
|--------|----------|
| **7h45-8h15** | Renfort + pesée |
| **12h30-13h30** | Planif / meal prep si WE absent |
| **Soir** | Home-trainer 45 min + Lego 1h30 |

## ⚠️ Points de vigilance
- Présentiel mercredi → pas de matin/midi libre
- Compétition ce week-end → séance longue allégée

---
*Généré à partir du planning de la semaine sauvegardé*
```

---

## 🔄 Workflow hebdomadaire recommandé

| Jour | Action | Résultat |
|------|--------|----------|
| **Vendredi 20h** | `/planning review cette semaine` | Planning sauvegardé dans Notion |
| **Vendredi 20h15** | Mettre à jour statut → "En cours" | Statut mis à jour |
| **Dimanche 21h** | Scheduled task automatique | Briefing avec planning spécifique |
| **Lundi 21h** | Scheduled task automatique | Briefing avec planning spécifique |
| ... | ... | ... |
| **Vendredi 21h** | Scheduled task automatique | Briefing avec planning spécifique |
| **Samedi 00h** | Scheduled task automatique | Passe à la semaine suivante |

---

## 🛠️ Dépannage

### Problème : Le briefing utilise toujours le planning type

**Cause** : Aucun planning n'a été sauvegardé pour cette semaine.

**Solution** :
1. Effectuez une review du vendredi avec `/planning review cette semaine`
2. Vérifiez que le planning apparaît dans votre base Notion
3. Si la scheduled task se déclenche avant la sauvegarde, attendez le lendemain

### Problème : Erreur lors de la sauvegarde dans Notion

**Causes possibles** :
- L'ID de la base est incorrect
- Le connector Notion n'est pas configuré
- Problème de permissions

**Solution** :
1. Vérifiez que l'ID de la base est correct (32 caractères)
2. Testez manuellement : `/planning save test`
3. Consultez les logs pour plus de détails

### Problème : La scheduled task ne se déclenche pas

**Causes possibles** :
- Mauvaise configuration de l'heure/timezone
- Vibe Work n'a pas les permissions
- La tâche est désactivée

**Solution** :
1. Vérifiez que la tâche est **activée**
2. Vérifiez l'**heure** et le **timezone**
3. Testez manuellement en cliquant sur "Run Now"

---

## 📁 Structure des fichiers

```
.vibe/skills/planning-semaine/
├── SKILL.md                 # Skill principal (modifié)
├── generate-briefing.ts     # Script pour la scheduled task
├── config.example.toml     # Configuration exemple
└── README.md                # Ce fichier
```

---

## 🎓 Conseils avancés

### Personnaliser le format du briefing

Modifiez la fonction `generateBriefingFromPlanning()` dans `generate-briefing.ts` pour adapter le format à vos préférences.

### Ajouter des données supplémentaires

Pour inclure plus d'informations dans le briefing (météo, menu, etc.), modifiez la fonction `generateDailyBriefing()` pour récupérer et intégrer ces données.

### Changer l'heure du briefing

Si vous préférez 6h45 malgré le risque de retard :
- Configurez la scheduled task à `06:45`
- Accepté le risque de retard jusqu'à 60 min
- Alternative : utilisez une alarme téléphone classique à 6h45 qui déclenche Vibe

---

## 🔗 Liens utiles

- [Documentation Notion API](https://developers.notion.com/)
- [Vibe Work Scheduled Tasks](https://docs.mistral.ai/vibe/work/scheduled-tasks)
- [Skill planning-semaine original](https://github.com/mistralai/mistral-vibe)

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les **logs** dans `~/.vibe/logs/vibe.log`
2. Consultez la section **Dépannage** ci-dessus
3. Assurez-vous que votre **connector Notion** est bien configuré

---

*Dernière mise à jour : 2026-10-05*
