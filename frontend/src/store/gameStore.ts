import { create } from 'zustand'

export type GameStatus = 'idle' | 'waiting' | 'countdown' | 'playing' | 'results' | 'finished'
export type GamePhase = 'idle' | 'countdown' | 'question' | 'revealed' | 'finished'

export interface QuestionOption {
  id: number
  name_fr: string
  sprite_url: string | null
}

export interface Question {
  question_id: string
  question_index: number
  total: number
  options: QuestionOption[]
  image_url: string | null
  time_limit_ms: number
  difficulty: 'easy' | 'normal' | 'hard'
}

export interface ScoreEntry {
  player_id: string
  pseudo: string
  avatar_pokemon_id: number
  score: number
  rank: number
}

// Legacy shape kept for backward compatibility with GameRoomPage
interface PlayerScore {
  playerId: string
  pseudo: string
  score: number
  streak: number
}

interface GameState {
  gameId: string | null
  status: GameStatus
  // Legacy question shape (GameRoomPage)
  currentQuestion: Question | null
  questionIndex: number
  totalQuestions: number
  scores: PlayerScore[]
  // Phase 5 additions
  phase: GamePhase
  scoreboard: ScoreEntry[]
  finalScoreboard: ScoreEntry[]
  // Actions
  setGameId: (id: string) => void
  setStatus: (status: GameStatus) => void
  setCurrentQuestion: (question: Question) => void
  updateScores: (scores: PlayerScore[]) => void
  setPhase: (phase: GamePhase) => void
  setScoreboard: (scoreboard: ScoreEntry[]) => void
  setFinalScoreboard: (finalScoreboard: ScoreEntry[]) => void
  resetGame: () => void
}

const initialState = {
  gameId: null,
  status: 'idle' as GameStatus,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  scores: [] as PlayerScore[],
  phase: 'idle' as GamePhase,
  scoreboard: [] as ScoreEntry[],
  finalScoreboard: [] as ScoreEntry[],
}

export const useGameStore = create<GameState>()((set) => ({
  ...initialState,
  setGameId: (id) => set({ gameId: id }),
  setStatus: (status) => set({ status }),
  setCurrentQuestion: (question) =>
    set({
      currentQuestion: question,
      questionIndex: question.question_index,
      totalQuestions: question.total,
    }),
  updateScores: (scores) => set({ scores }),
  setPhase: (phase) => set({ phase }),
  setScoreboard: (scoreboard) => set({ scoreboard }),
  setFinalScoreboard: (finalScoreboard) => set({ finalScoreboard }),
  resetGame: () => set(initialState),
}))
