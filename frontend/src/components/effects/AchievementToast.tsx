import { motion, AnimatePresence } from 'framer-motion'

export interface AchievementData {
  code: string
  name_fr: string
  description_fr: string
  icon_emoji: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const RARITY_COLORS = {
  common: { border: 'border-gray-400/40', glow: '', text: 'text-gray-200' },
  rare: { border: 'border-blue-400/60', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.4)]', text: 'text-blue-300' },
  epic: { border: 'border-purple-400/60', glow: 'shadow-[0_0_15px_rgba(176,38,255,0.5)]', text: 'text-purple-300' },
  legendary: { border: 'border-yellow-400/60', glow: 'shadow-[0_0_20px_rgba(255,242,0,0.6)]', text: 'text-yellow-300' },
}

interface Props {
  achievements: AchievementData[]
  onDismiss: (code: string) => void
}

export function AchievementToast({ achievements, onDismiss }: Props) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {achievements.map((a) => {
          const colors = RARITY_COLORS[a.rarity]
          return (
            <motion.div
              key={a.code}
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 120, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`pointer-events-auto glass-card px-4 py-3 border ${colors.border} ${colors.glow} max-w-xs cursor-pointer`}
              onClick={() => onDismiss(a.code)}
              onAnimationComplete={() => {
                // Auto-dismiss après 5s
                setTimeout(() => onDismiss(a.code), 5000)
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{a.icon_emoji}</span>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest font-rajdhani">
                    Achievement débloqué !
                  </p>
                  <p className={`font-orbitron font-bold text-sm ${colors.text}`}>
                    {a.name_fr}
                  </p>
                  <p className="text-xs text-white/60 font-rajdhani">{a.description_fr}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
