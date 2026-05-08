import type { GameCreate, GameListItem, GameResponse } from '../types/game'

const API_BASE = '/api'

export async function fetchGames(): Promise<GameListItem[]> {
  const res = await fetch(`${API_BASE}/games`)
  if (!res.ok) throw new Error('Erreur chargement parties')
  return res.json()
}

export async function createGame(data: GameCreate): Promise<GameResponse> {
  const res = await fetch(`${API_BASE}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? 'Erreur création partie')
  }
  return res.json()
}

export async function fetchGame(gameId: string): Promise<GameResponse> {
  const res = await fetch(`${API_BASE}/games/${gameId}`)
  if (!res.ok) throw new Error('Partie non trouvée')
  return res.json()
}
