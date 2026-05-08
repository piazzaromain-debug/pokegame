# Règles du jeu — PokéGame

## Modes

- **Devine le nom** : une image Pokémon s'affiche → choisir le bon nom parmi N options
- **Devine l'image** : un nom s'affiche → cliquer la bonne image parmi N options

## Difficultés

| | Facile | Normal | Difficile |
|---|---|---|---|
| Timer | 15 s | 10 s | 5 s |
| Image (mode devine le nom) | Sprite officiel coloré | Silhouette noire | Floue qui se révèle progressivement avec le timer |
| Nombre d'options | 4 | 4 | 6 |

## Scoring

```
points = max(100, 1000 - (response_time_ms / time_limit_ms) * 900)
```

- Réponse instantanée → ~1000 pts
- Réponse en fin de timer → 100 pts (minimum)
- Mauvaise réponse ou timeout → 0 pt

Le calcul est effectué **côté serveur** — le client envoie uniquement `selected_pokemon_id` et `response_time_ms`.

## Lobby

1. Page d'accueil = liste des parties en attente (temps réel via Socket.IO)
2. N'importe qui peut créer une partie et devient hôte
3. L'hôte configure : mode, difficulté, nb questions (1–100), nb max joueurs (2–10)
4. L'hôte clique "Lancer" → la partie démarre simultanément pour tous

## Leaderboards

6 leaderboards distincts = 2 modes × 3 difficultés, filtrables par période :
- **Aujourd'hui** (dernières 24h)
- **Cette semaine** (7 derniers jours)
- **Tout-temps**

Top 100 par leaderboard. Alimenté par une materialized view PostgreSQL rafraîchie à chaque fin de partie.

---

## Achievements

8 achievements à débloquer, détectés automatiquement à la fin de chaque partie.

| Badge | Icône | Code | Rareté | Condition |
|---|---|---|---|---|
| Apprenti dresseur | 🎓 | `first_game` | Common | Terminer ta première partie |
| Premier sang | 👑 | `first_victory` | Common | Remporter ta première victoire en multi (1ère place, 2+ joueurs) |
| Combo Master | 🔥 | `combo_master` | Rare | 10 bonnes réponses d'affilée dans une même partie |
| Vétéran | 🎖️ | `veteran` | Rare | Jouer 50 parties au total |
| Rapidité éclair | ⚡ | `lightning_fast` | Epic | Répondre en moins d'1 seconde 5 fois dans une partie |
| Perfectionniste | ✨ | `perfectionist` | Epic | Finir une partie sans aucune erreur (min. 10 questions) |
| Maître de Kanto | 🏆 | `kanto_master` | Legendary | 100% de bonnes réponses sur une partie de 20+ questions |
| Collectionneur | 💎 | `collector` | Legendary | Voir les 151 Pokémon dans des parties |

### Fonctionnement technique

- La vérification se fait dans `backend/app/services/achievement_engine.py` à la fin de chaque partie
- `game:finished` est émis individuellement à chaque joueur pour inclure ses propres `achievements_unlocked`
- Un achievement déjà obtenu ne peut pas être ré-obtenu (vérification en base avant insertion)
- Le catalogue est seedé via `make seed-achievements`

---

## Mode apprentissage

Mode libre, **sans timer**, pour explorer les 151 Pokémon de Kanto.

- Parcourir les 151 Pokémon (grille ou défilement)
- Voir le sprite officiel + sprite shiny, les types, la description du Pokédex (version française)
- Écouter le cri authentique du Pokémon (source : PokeAPI `cries.latest`)
- Aucun scoring, aucune pression — juste l'exploration

Page correspondante : `frontend/src/pages/LearningModePage.tsx`

---

## Réactions emoji

Pendant une partie, les joueurs peuvent envoyer des réactions en live à toute la room.

### Utilisation

- Cliquer sur un emoji pendant une question ou entre deux questions
- La réaction est broadcastée immédiatement à tous les joueurs de la room via Socket.IO
- Chaque réaction affiche l'avatar du joueur émetteur

### Event Socket.IO

**Client → Serveur**
```json
{ "game_id": "abc...", "player_id": "uuid...", "emoji": "😂" }
```

**Serveur → tous les clients de la room**
```json
{ "player_id": "uuid...", "emoji": "😂" }
```

### Emojis disponibles
Typiquement : 👍 😂 🔥 😎 ⚡ — la sélection exacte est définie côté frontend dans le composant `EmojiReactions`.
