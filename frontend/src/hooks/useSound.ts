import { useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'

// Sons définis mais fichiers optionnels (pas encore dans /public/sounds)
const SOUNDS = {
  correct: '/sounds/correct.mp3',
  incorrect: '/sounds/incorrect.mp3',
  tick: '/sounds/tick.mp3',
  reveal: '/sounds/reveal.mp3',
  victory: '/sounds/victory.mp3',
  click: '/sounds/click.mp3',
} as const

export function useSound() {
  const { muted, volume } = useSettingsStore()

  const play = useCallback(
    (sound: keyof typeof SOUNDS) => {
      if (muted) return
      try {
        const audio = new Audio(SOUNDS[sound])
        audio.volume = volume
        audio.play().catch(() => {}) // Ignore autoplay policy errors
      } catch {
        // Son non disponible, on ignore silencieusement
      }
    },
    [muted, volume],
  )

  const playCry = useCallback(
    (cryUrl: string) => {
      if (muted || !cryUrl) return
      try {
        const audio = new Audio(cryUrl)
        audio.volume = volume
        audio.play().catch(() => {})
      } catch {
        // Son non disponible
      }
    },
    [muted, volume],
  )

  return { play, playCry }
}
