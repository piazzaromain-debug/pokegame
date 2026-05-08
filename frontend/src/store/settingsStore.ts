import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  muted: boolean
  volume: number
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
  setVolume: (volume: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      muted: false,
      volume: 0.7,
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
      setVolume: (volume) => set({ volume }),
    }),
    { name: 'pokegame-settings' }
  )
)
