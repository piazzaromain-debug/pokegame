import { useQuery } from '@tanstack/react-query'

export type GameMode = 'guess_name' | 'guess_image'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type Period = 'today' | 'week' | 'all'

export interface LeaderboardEntry {
  rank: number
  player_id: string
  pseudo: string
  avatar_pokemon_id: number
  final_score: number
  finished_at: string | null
}

export interface PlayerStats {
  player_id: string
  games_played: number
  games_won: number
  total_correct: number
  total_questions: number
  best_streak: number
  total_score: number
  accuracy: number
  pokemon_mistakes: Record<string, number>
  pokemon_seen: number[]
  pokemon_caught: number[]
}

export interface GlobalStats {
  hardest_pokemon: Array<{
    id: number
    name_fr: string
    sprite_url: string | null
    error_rate: number
    times_shown: number
  }>
  total_games_played: number
  total_players: number
}

const API_BASE = '/api'

export async function fetchLeaderboard(
  mode: GameMode,
  difficulty: Difficulty,
  period: Period = 'all'
): Promise<LeaderboardEntry[]> {
  const res = await fetch(
    `${API_BASE}/leaderboard?mode=${mode}&difficulty=${difficulty}&period=${period}`
  )
  if (!res.ok) throw new Error('Erreur chargement leaderboard')
  return res.json()
}

export async function fetchPlayerStats(playerId: string): Promise<PlayerStats> {
  const res = await fetch(`${API_BASE}/players/${playerId}/stats`)
  if (!res.ok) throw new Error('Stats non trouvées')
  return res.json()
}

export async function fetchPlayerPokedex(playerId: string) {
  const res = await fetch(`${API_BASE}/players/${playerId}/pokedex`)
  if (!res.ok) throw new Error('Pokédex non trouvé')
  return res.json() as Promise<{ pokemon_seen: number[]; pokemon_caught: number[] }>
}

export async function fetchGlobalStats(): Promise<GlobalStats> {
  const res = await fetch(`${API_BASE}/stats/global`)
  if (!res.ok) throw new Error('Stats globales non trouvées')
  return res.json()
}

export interface AchievementData {
  code: string
  name_fr: string
  description_fr: string
  icon_emoji: string
  rarity: string
}

export async function fetchAchievements(): Promise<AchievementData[]> {
  const res = await fetch('/api/achievements')
  if (!res.ok) throw new Error('Erreur achievements')
  return res.json()
}

export function useLeaderboard(mode: GameMode, difficulty: Difficulty, period: Period) {
  return useQuery({
    queryKey: ['leaderboard', mode, difficulty, period],
    queryFn: () => fetchLeaderboard(mode, difficulty, period),
    staleTime: 30_000,
  })
}

export function usePlayerStats(playerId: string | null) {
  return useQuery({
    queryKey: ['player-stats', playerId],
    queryFn: () => fetchPlayerStats(playerId!),
    enabled: !!playerId,
  })
}
