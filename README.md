# 🎮 PokéGame

> Quiz Pokémon multi-joueur temps réel — 151 Pokémon de la génération Kanto.  
> Ambiance **Glassmorphism Néon Gaming** — jouable sur PC, smartphone et tablette depuis ton WiFi local.

---

## 🚀 Lancement rapide

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- Mac (le script `start.sh` récupère l'IP locale via `ipconfig`)

### Premier lancement

```bash
# Clone le projet
git clone https://github.com/piazzaromain-debug/pokegame.git
cd pokegame

# Configure l'environnement (optionnel en dev, les valeurs par défaut fonctionnent)
cp .env.example .env

# Lance tout !
./start.sh
```

Le script vérifie Docker, lance les 4 services et affiche les URLs :

```
🎉 PokéGame est prêt !
📍 Sur ce Mac       : http://localhost:8080
📱 Autres devices   : http://192.168.1.X:8080
```

### Charger les Pokémon (à faire une seule fois)

```bash
make seed
```

---

## 🛠️ Commandes utiles

| Commande | Description |
|---|---|
| `make up` | Lance tous les services |
| `make down` | Arrête tous les services |
| `make logs` | Logs en direct (tous services) |
| `make logs-back` | Logs backend uniquement |
| `make seed` | Charge les 151 Pokémon depuis PokeAPI |
| `make test` | Lance les tests back + front |
| `make build` | Rebuild complet des images |
| `make reset-db` | ⚠️ Reset total de la base de données |

---

## 🎮 Modes de jeu

| Mode | Description |
|---|---|
| **Devine le nom** | Image Pokémon → choisir le bon nom parmi N |
| **Devine l'image** | Nom Pokémon → cliquer la bonne image parmi N |

### Difficultés

| | Facile | Normal | Difficile |
|---|---|---|---|
| Timer | 15 s | 10 s | 5 s |
| Image | Sprite officiel | Silhouette noire | Floue → se révèle |
| Options | 4 | 4 | 6 |

---

## 🏗️ Architecture

```
nginx (port 8080)
  ├── /            → frontend (Vite + React 18 + TypeScript)
  ├── /api/*       → backend  (FastAPI + Python 3.12)
  └── /socket.io/* → backend  (python-socketio WebSocket)

backend → PostgreSQL 16
```

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour les détails.

---

## 📁 Structure du projet

```
pokegame/
├── nginx/          Reverse proxy Nginx
├── backend/        API FastAPI + Socket.IO
├── frontend/       App React + Vite
├── docs/           Documentation technique
├── docker-compose.yml
├── Makefile
└── start.sh
```

---

## 📝 Développement

Voir [`CLAUDE.md`](CLAUDE.md) pour la source de vérité complète du projet (stack, schéma BDD, API, phases de dev).

---

*Projet perso — Boby 🎮*
