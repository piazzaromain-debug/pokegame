import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PlayerState {
  playerId: string | null
  pseudo: string | null
  avatarPokemonId: number | null
  setPlayer: (id: string, pseudo: string, avatarPokemonId: number) => void
  clearPlayer: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      playerId: null,
      pseudo: null,
      avatarPokemonId: null,
      setPlayer: (id, pseudo, avatarPokemonId) => set({ playerId: id, pseudo, avatarPokemonId }),
      clearPlayer: () => set({ playerId: null, pseudo: null, avatarPokemonId: null }),
    }),
    { name: 'pokegame-player' }
  )
)
