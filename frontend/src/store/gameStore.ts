import { create } from 'zustand'

type GameStatus = 'idle' | 'waiting' | 'countdown' | 'playing' | 'results' | 'finished'

interface Question {
  id: string
  text: string
  imageUrl?: string
  choices: string[]
  timeLimit: number
}

interface PlayerScore {
  playerId: string
  pseudo: string
  score: number
  streak: number
}

interface GameState {
  gameId: string | null
  status: GameStatus
  currentQuestion: Question | null
  questionIndex: number
  totalQuestions: number
  scores: PlayerScore[]
  // Actions
  setGameId: (id: string) => void
  setStatus: (status: GameStatus) => void
  setCurrentQuestion: (question: Question, index: number, total: number) => void
  updateScores: (scores: PlayerScore[]) => void
  resetGame: () => void
}

const initialState = {
  gameId: null,
  status: 'idle' as GameStatus,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  scores: [],
}

export const useGameStore = create<GameState>()((set) => ({
  ...initialState,
  setGameId: (id) => set({ gameId: id }),
  setStatus: (status) => set({ status }),
  setCurrentQuestion: (question, index, total) =>
    set({ currentQuestion: question, questionIndex: index, totalQuestions: total }),
  updateScores: (scores) => set({ scores }),
  resetGame: () => set(initialState),
}))
