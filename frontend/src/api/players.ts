export interface PlayerCreate {
  pseudo: string
  avatar_pokemon_id: number
}

export interface PlayerResponse {
  id: string
  pseudo: string
  avatar_pokemon_id: number
  created_at: string
  last_seen_at: string
}

const API_BASE = '/api'

export async function createPlayer(data: PlayerCreate): Promise<PlayerResponse> {
  const res = await fetch(`${API_BASE}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? 'Erreur création joueur')
  }
  return res.json()
}

export async function getPlayer(playerId: string): Promise<PlayerResponse> {
  const res = await fetch(`${API_BASE}/players/${playerId}`)
  if (!res.ok) throw new Error('Joueur non trouvé')
  return res.json()
}
