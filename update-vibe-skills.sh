#!/bin/bash

# Script de mise à jour de ~/.vibe/skills depuis le repo de dev
# Usage: ./update-vibe-skills.sh [SKILL_NAME]
#   Sans argument : met à jour toutes les skills
#   Avec argument : met à jour uniquement la skill spécifiée
# Exemples:
#   ./update-vibe-skills.sh           # Met à jour toutes les skills
#   ./update-vibe-skills.sh task-manager  # Met à jour uniquement task-manager

DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_DIR="$HOME/.vibe/skills"

# Liste de toutes les skills disponibles
ALL_SKILLS=("menu-semaine" "planning-semaine" "liste-courses-notesnook" "suivi-warhammer" "task-manager")

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si une skill spécifique est demandée
if [ $# -ge 1 ]; then
    TARGET_SKILL="$1"
    # Vérifier que la skill existe dans la liste
    if [[ " ${ALL_SKILLS[@]} " =~ " ${TARGET_SKILL} " ]]; then
        SKILLS=("$TARGET_SKILL")
    else
        echo -e "${RED}❌ Erreur : Skill '$TARGET_SKILL' non trouvée dans la liste des skills disponibles.${NC}"
        echo -e "Skills disponibles : ${ALL_SKILLS[*]}"
        exit 1
    fi
else
    SKILLS=("${ALL_SKILLS[@]}")
fi

echo -e "${BLUE}=== Mise à jour de ~/.vibe/skills depuis $DEV_DIR ===${NC}"

# Créer le dossier de production s'il n'existe pas
mkdir -p "$PROD_DIR"

# Synchroniser chaque skill
for SKILL in "${SKILLS[@]}"; do
    echo -e "${YELLOW}→ Traitement de $SKILL...${NC}"
    
    # Créer le dossier de la skill en production
    mkdir -p "$PROD_DIR/$SKILL"
    mkdir -p "$PROD_DIR/$SKILL/references"
    
    # Copier SKILL.md (toujours)
    if [ -f "$DEV_DIR/$SKILL/SKILL.md" ]; then
        cp "$DEV_DIR/$SKILL/SKILL.md" "$PROD_DIR/$SKILL/SKILL.md"
        echo -e "  ${GREEN}✓${NC} SKILL.md copié"
    fi
    
    # Copier les fichiers dans references/ (sauf les .example.md)
    if [ -d "$DEV_DIR/$SKILL/references" ]; then
        for file in "$DEV_DIR/$SKILL/references/"*; do
            filename=$(basename "$file")
            # Ignorer les fichiers .example.md
            if [[ "$filename" != *.example.md ]]; then
                # Ne pas écraser les fichiers perso (preferences.md, planning-type.md)
                if [[ "$filename" != "preferences.md" && "$filename" != "planning-type.md" ]]; then
                    cp "$file" "$PROD_DIR/$SKILL/references/$filename"
                    echo -e "  ${GREEN}✓${NC} references/$filename copié"
                else
                    echo -e "  ${YELLOW}⚠${NC} references/$filename ignoré (fichier perso)"
                fi
            else
                echo -e "  ${YELLOW}⚠${NC} references/$filename ignoré (template)"
            fi
        done
    fi
    echo
done

# Message final adapté
if [ $# -ge 1 ]; then
    echo -e "${GREEN}=== Mise à jour de '$TARGET_SKILL' terminée ! ===${NC}"
    echo -e "La skill est prête dans ${BLUE}$PROD_DIR/$TARGET_SKILL/${NC}"
else
    echo -e "${GREEN}=== Mise à jour de toutes les skills terminée ! ===${NC}"
    echo -e "Tes skills sont prêtes dans ${BLUE}$PROD_DIR/${NC}"
fi
echo -e "${YELLOW}Note :${NC} Les fichiers perso (preferences.md, planning-type.md) n'ont pas été modifiés."
