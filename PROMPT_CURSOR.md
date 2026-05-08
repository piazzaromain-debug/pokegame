# 🚀 Prompt de démarrage — PokéGame

> Copie-colle ce prompt **dans Cursor** ou **Claude Code** dans un dossier vide (ou ton dossier cloné).
> Avant de coller le prompt, place le fichier `CLAUDE.md` à la racine du dossier (Claude Code le lira automatiquement).

---

## 📋 PROMPT À COPIER-COLLER

```
Salut Claude ! 🎮

Je veux que tu développes pour moi le projet PokéGame, défini intégralement dans le fichier CLAUDE.md à la racine de ce dossier.

⚠️ AVANT TOUTE CHOSE — lis intégralement le CLAUDE.md de A à Z. Ce fichier contient toutes les décisions techniques, le design system, le schéma BDD, les routes API, les events Socket.IO et le workflow de dev en 10 phases. C'est ta source de vérité absolue.

🌟 Étape 1 — Repo Git
Avant de coder quoi que ce soit, demande-moi l'URL du repo Git distant (ex: https://github.com/boby/pokegame.git) sur lequel tu vas commit/push au fur et à mesure. Une fois que je te la donne :
  - Initialise git si besoin (git init)
  - Configure le remote (git remote add origin <URL>)
  - Crée un .gitignore complet (Python, Node, Docker, IDE, .env, secrets)
  - Fais un premier commit "chore: add CLAUDE.md and gitignore"
  - Push sur main

🛠️ Étape 2 — Plan d'attaque
Confirme-moi que tu as bien lu le CLAUDE.md en me résumant en 5-10 lignes :
  - Le scope du MVP (modes, difficultés, multi temps réel)
  - La stack choisie
  - Les 4 services Docker
  - L'ordre des phases que tu vas suivre
  
Puis attends mon GO avant de commencer la Phase 0.

🚧 Étape 3 — Développement par phases
Suit le workflow décrit en section "🚀 Workflow de développement attendu" du CLAUDE.md. Concrètement :
  - À chaque phase, annonce-moi ce que tu vas faire AVANT de le faire
  - Travaille en parallèle sur backend / frontend / db quand c'est possible (notamment phases 1, 3, 4, 6, 7, 8)
  - À la fin de chaque phase :
    - Commit avec le message indiqué (Conventional Commits)
    - Push sur le repo
    - Attends ma validation pour passer à la phase suivante (sauf si je te dis "enchaine tout")

🎨 Étape 4 — Design front exceptionnel
Pour la partie frontend, applique strictement la direction artistique du CLAUDE.md (Glassmorphism Néon Gaming). N'hésite pas à pousser le curseur sur :
  - Animations Framer Motion (transitions, staggered reveals, micro-interactions)
  - Effets glow, particules, gradients animés
  - Typographies distinctives (Orbitron + Rajdhani, PAS Inter ni Roboto)
  - Polish des moments-clés (lancement de partie, bonne réponse, victoire)
Si tu as accès à des skills frontend-design dans ton environnement, utilise-les.

🧠 Étape 5 — Pédagogie
Je suis curieux et je viens de la maintenance, je me lance dans le dev. Donc :
  - Quand tu fais un choix technique non trivial, EXPLIQUE-LE en 2-3 phrases
  - Surtout sur : async Python, Socket.IO rooms, JSONB Postgres, materialized views, reverse proxy Nginx, Docker networks, Zustand, useSocket hook
  - Pas besoin de faire un cours à chaque fonction, juste les concepts marquants
  - Le but : à la fin du projet, je dois avoir compris l'archi complète

⚡ Étape 6 — Discipline
  - PAS d'improvisation hors CLAUDE.md sans me demander d'abord
  - PAS de dépendance lourde ajoutée sans justification
  - PAS de refonte d'archi unilatérale
  - Tests à écrire AU FUR ET À MESURE (pas relégués à la fin)
  - Documentation README mise à jour à chaque phase

C'est parti 🚀 ! Commence par me demander l'URL du repo.
```

---

## 📌 Comment l'utiliser concrètement

### Si tu utilises **Cursor** :
1. Crée un dossier vide pour ton projet (ex: `~/projects/pokegame`)
2. Place `CLAUDE.md` à la racine (Cursor le détecte automatiquement comme contexte)
3. Ouvre le dossier dans Cursor
4. `Cmd + L` pour ouvrir le chat agent
5. Active le mode **Agent** (pas le simple chat)
6. Colle le prompt ci-dessus
7. Cursor va te demander l'URL du repo, donne-la-lui, c'est parti

### Si tu utilises **Claude Code** (CLI) :
1. Crée un dossier vide pour ton projet
2. Place `CLAUDE.md` à la racine (Claude Code le lit nativement)
3. Dans le terminal, lance `claude` dans ce dossier
4. Colle le prompt ci-dessus
5. Claude Code te demandera l'URL du repo

### Conseils de pilotage pendant le dev
- Si Claude part dans une mauvaise direction, **interromps-le** immédiatement avec `Esc` puis redirige
- Si une phase bloque (ex: Socket.IO qui ne broadcast pas), demande-lui de logger plus et de checker step by step
- À la fin de chaque phase, **fais tourner toi-même** `make up && make logs` pour vérifier que ça marche, ne fais pas confiance aveugle
- Si tu veux qu'il accélère, tu peux lui dire "enchaine les phases 4 à 7 sans pause"
- Si tu veux ralentir et vraiment apprendre, demande "explique-moi en détail cette partie avant de continuer"

### Si Claude oublie le CLAUDE.md en cours de route
Réinjecte-lui un rappel : 
> "Relis le CLAUDE.md à la racine et confirme que tu suis bien la phase X (...) avant de continuer."
