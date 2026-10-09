#!/usr/bin/env python3
"""
Utilitaire de conversion Markdown -> HTML pour BookStack
Usage: python3 md-to-html.py <fichier.md>
       ou: cat fichier.md | python3 md-to-html.py
"""

import sys
import markdown

def convert_markdown_to_html(markdown_text):
    """Convertir du Markdown en HTML avec les extensions nécessaires"""
    html = markdown.markdown(
        markdown_text,
        extensions=[
            'tables',       # Support des tableaux
            'fenced_code',  # Support des blocs de code ```
            'extra',        # Support des classes, etc.
            'toc',          # Table des matières
            'codehilite',   # Colorisation syntaxique
            'footnotes',    # Notes de bas de page
            'attr_list',    # Attributs HTML personnalisés
        ]
    )
    return html

if __name__ == '__main__':
    # Lire depuis stdin ou depuis un fichier
    if len(sys.argv) > 1:
        # Lire depuis un fichier
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            md_content = f.read()
    else:
        # Lire depuis stdin
        md_content = sys.stdin.read()
    
    # Convertir et afficher
    html_content = convert_markdown_to_html(md_content)
    print(html_content)
