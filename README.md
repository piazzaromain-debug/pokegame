# 🎮 PokéGame

> ![GitHub](https://img.shields.io/badge/GitHub-piazzaromain--debug-181717?logo=github) ![License: MIT](https://img.shields.io/badge/license-MIT-green)

Quiz Pokémon multi-joueur temps réel — 151 Pokémon de Kanto.
Ambiance Glassmorphism Néon Gaming, jouable sur PC/smartphone/tablette depuis ton WiFi local.

---

## ✨ Fonctionnalités

- 🎮 2 modes de jeu (Devine le nom / Devine l'image)
- ⚡ 3 niveaux de difficulté (timer 15s/10s/5s, image colorée/silhouette/floue progressive)
- 👥 Multi-joueur temps réel jusqu'à 10 joueurs
- 🏆 6 leaderboards (mode × difficulté) avec filtres période
- 🎖️ 8 achievements à débloquer
- 📚 Mode apprentissage (explorer les 151 sans timer)
- 😂 Réactions emoji en live pendant les parties
- 🔊 Cris Pokémon authentiques à la révélation
- 📱 Responsive — jouable sur smartphone

---

## 🚀 Lancement rapide

### Prérequis
- [Docker Desktop](https://www.docker.com/) installé et démarré
- Mac (script optimisé macOS)

### Installation en 3 commandes

```bash
git clone https://github.com/piazzaromain-debug/pokegame.git
cd pokegame
./start.sh
```

Le script démarre les 4 services et affiche les URLs :

```
🎉 PokéGame est prêt !
📍 Sur ce Mac       : http://localhost:8080
📱 Autres devices   : http://192.168.1.X:8080
```

### Charger les Pokémon (une seule fois)

```bash
make seed              # Charge les 151 Pokémon depuis PokeAPI (~30s)
make seed-achievements # Charge le catalogue des achievements
```

---

## 🛠️ Commandes

| Commande | Description |
|---|---|
| `make up` | Lance tous les services |
| `make down` | Arrête tout |
| `make logs` | Logs en direct |
| `make logs-back` | Logs backend |
| `make logs-front` | Logs frontend |
| `make seed` | Charge les 151 Pokémon |
| `make seed-achievements` | Charge les achievements |
| `make test` | Lance les tests |
| `make build` | Rebuild les images |
| `make reset-db` | ⚠️ Reset complet BDD |

---

## 🎮 Comment jouer

1. Ouvre `http://localhost:8080` dans ton navigateur
2. Crée ton profil (pseudo + avatar Pokémon)
3. Va dans le **Lobby** → rejoins une partie ou crée-en une
4. L'hôte configure la partie (mode, difficulté, nb questions) et la lance
5. Les questions arrivent simultanément pour tous — réponds le plus vite possible !
6. Le scoreboard live s'affiche en temps réel pendant la partie
7. Partage `http://TON_IP_LOCAL:8080` avec tes amis sur le même WiFi

---

## 🏗️ Architecture

```
nginx:8080
  ├── /            → React 18 + Vite (frontend)
  ├── /api/*       → FastAPI + Python 3.12 (backend)
  └── /socket.io/* → python-socketio (WebSocket temps réel)

backend → PostgreSQL 16
```

4 services Docker orchestrés par Docker Compose.

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour les détails.

---

## 🛠️ Stack technique

| Couche | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Socket.io-client, Zustand |
| Backend | Python 3.12, FastAPI, python-socketio, SQLAlchemy 2.x async |
| Base de données | PostgreSQL 16 (JSONB, materialized views) |
| Infra | Docker Compose, Nginx reverse proxy |

---

## 🔧 Variables d'environnement

Copie `.env.example` en `.env` :

```bash
cp .env.example .env
```

| Variable | Défaut | Description |
|---|---|---|
| `DB_PASSWORD` | `pokegame_dev` | Mot de passe PostgreSQL |
| `SECRET_KEY` | `dev_secret_change_in_prod` | Clé secrète app |
| `LOG_LEVEL` | `INFO` | Niveau de logs backend |

---

## 🐛 Troubleshooting

**"Docker daemon non démarré"** → Lance Docker Desktop et réessaie.

**"Port 8080 déjà utilisé"** → `lsof -i :8080` pour trouver le process, puis `kill -9 <PID>`.

**"Seed échoue"** → PokeAPI peut être lente. Relance `make seed` (le script est idempotent).

**"WebSocket ne se connecte pas"** → Vérifie que tu accèdes bien via `http://IP:8080` et non directement sur le port du frontend ou du backend.

---

## 📁 Structure du projet

```
pokegame/
├── nginx/          Reverse proxy
├── backend/        API FastAPI + Socket.IO + services
│   ├── app/
│   │   ├── api/      Routes REST
│   │   ├── models/   SQLAlchemy models
│   │   ├── schemas/  Pydantic DTOs
│   │   ├── services/ Logique métier
│   │   └── sockets/  Handlers Socket.IO
│   ├── alembic/    Migrations DB
│   └── scripts/    Seed scripts
├── frontend/       React + Vite
│   └── src/
│       ├── api/      Clients HTTP
│       ├── components/ Composants réutilisables
│       ├── hooks/    Custom hooks
│       ├── pages/    Pages de l'app
│       ├── store/    Zustand stores
│       └── types/    Types TypeScript
├── docs/           Documentation technique
├── docker-compose.yml
├── Makefile
└── start.sh
```

---

*Projet perso — Boby 🎮 | Propulsé par [FastAPI](https://fastapi.tiangolo.com/) + [React](https://react.dev/)*
