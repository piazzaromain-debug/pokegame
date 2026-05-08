export type GameMode = 'guess_name' | 'guess_image'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type GameStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned'

export interface GameListItem {
  id: string
  host_pseudo: string
  host_avatar_pokemon_id: number
  mode: GameMode
  difficulty: Difficulty
  nb_questions: number
  max_players: number
  players_count: number
  status: GameStatus
}

export interface GameCreate {
  host_player_id: string
  mode: GameMode
  difficulty: Difficulty
  nb_questions: number
  max_players: number
}

export interface GameResponse extends GameListItem {
  host_player_id: string
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export interface RoomPlayer {
  player_id: string
  pseudo: string
  avatar_pokemon_id: number
  score?: number
}
