# Règles du jeu — PokéGame

## Modes

- **Devine le nom** : une image Pokémon s'affiche → choisir le bon nom parmi N options
- **Devine l'image** : un nom s'affiche → cliquer la bonne image parmi N options

## Difficultés

| | Facile | Normal | Difficile |
|---|---|---|---|
| Timer | 15 s | 10 s | 5 s |
| Image (mode devine le nom) | Sprite officiel coloré | Silhouette noire | Floue qui se révèle progressivement |
| Nombre d'options | 4 | 4 | 6 |

## Scoring

```
points = max(100, 1000 - (response_time_ms / time_limit_ms) * 900)
```

- Réponse instantanée → ~1000 pts
- Réponse en fin de timer → 100 pts (minimum)
- Mauvaise réponse ou timeout → 0 pt

## Lobby

1. Page d'accueil = liste des parties en attente (temps réel)
2. N'importe qui peut créer une partie et devient hôte
3. L'hôte configure : mode, difficulté, nb questions, nb max joueurs
4. L'hôte clique "Lancer" → la partie démarre simultanément pour tous

## Leaderboards

6 leaderboards distincts = 2 modes × 3 difficultés, filtrables par période (aujourd'hui / semaine / tout-temps).
