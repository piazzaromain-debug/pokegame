# Architecture — PokéGame

> Document vivant, mis à jour au fur et à mesure du développement.

## Services Docker

| Service | Image / Build | Port interne | Rôle |
|---|---|---|---|
| `nginx` | `./nginx` | 80 → hôte 8080 | Reverse proxy : route / → frontend, /api → backend, /socket.io → backend |
| `frontend` | `./frontend` (target: dev) | 5173 | App React + Vite dev server |
| `backend` | `./backend` | 8000 | FastAPI + python-socketio |
| `db` | `postgres:16-alpine` | 5432 (interne uniquement) | PostgreSQL — jamais exposé au réseau hôte |

## Flux de communication

```
Client (browser)
    │
    ├─ HTTP GET /           → nginx → frontend:5173 (Vite + React)
    ├─ HTTP /api/*          → nginx → backend:8000  (FastAPI REST)
    └─ WebSocket /socket.io → nginx → backend:8000  (Socket.IO)

backend:8000
    └─ asyncpg → db:5432 (PostgreSQL)
```

## State management temps réel

- **1 room `lobby`** : tous les joueurs en attente voient la liste des parties en live
- **1 room `game:{id}` par partie** : broadcast des questions, scores, réactions en simultané
- **Serveur = source de vérité** pour le timer et le scoring (le client n'envoie que `selected_pokemon_id` + `response_time_ms`)

## Sécurité

- Port 5432 (Postgres) non publié — accessible uniquement depuis le réseau Docker interne
- Scoring calculé côté serveur uniquement
- `correct_pokemon_id` broadcasté seulement après expiration du timer (jamais avant)
- Sections critiques du `GameRoomManager` protégées par `asyncio.Lock()`
