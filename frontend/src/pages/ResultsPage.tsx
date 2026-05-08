import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGameStore, type ScoreEntry } from '../store/gameStore'
import { useReducedMotion } from '../hooks/useReducedMotion'

// ─── Sous-composants ─────────────────────────────────────────────────────────

function PokemonAvatar({ pokemonId, size = 64 }: { pokemonId: number; size?: number }) {
  return (
    <img
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
      alt={`Pokémon #${pokemonId}`}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
      className="object-contain"
    />
  )
}

function PodiumStep({
  entry,
  rank,
  delay,
  reducedMotion,
}: {
  entry: ScoreEntry
  rank: 1 | 2 | 3
  delay: number
  reducedMotion: boolean
}) {
  const heights: Record<1 | 2 | 3, string> = {
    1: 'h-36',
    2: 'h-24',
    3: 'h-16',
  }
  const colors: Record<1 | 2 | 3, string> = {
    1: 'from-yellow-400/30 to-yellow-600/10 border-yellow-400/50',
    2: 'from-slate-300/20 to-slate-400/10 border-slate-300/30',
    3: 'from-amber-600/20 to-amber-700/10 border-amber-600/30',
  }
  const medals: Record<1 | 2 | 3, string> = {
    1: '👑',
    2: '🥈',
    3: '🥉',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reducedMotion ? 0 : delay, duration: 0.6, ease: 'backOut' }}
      className="flex flex-col items-center gap-2"
    >
      {/* Avatar */}
      <div className={`relative ${rank === 1 ? 'order-first' : ''}`}>
        <div
          className={`
            w-16 h-16 rounded-full bg-white/10 border-2 flex items-center justify-center overflow-hidden
            ${rank === 1 ? 'w-20 h-20 border-yellow-400/60' : ''}
            ${rank === 1 && !reducedMotion ? 'animate-float' : ''}
          `}
          style={
            rank === 1
              ? { boxShadow: '0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.2)' }
              : undefined
          }
        >
          <PokemonAvatar pokemonId={entry.avatar_pokemon_id} size={rank === 1 ? 72 : 56} />
        </div>
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">
          {medals[rank]}
        </span>
      </div>

      {/* Pseudo */}
      <span
        className={`font-bold text-center max-w-20 truncate ${rank === 1 ? 'font-orbitron text-sm text-yellow-300' : 'text-xs text-text-secondary'}`}
      >
        {entry.pseudo}
      </span>

      {/* Score */}
      <span
        className={`font-orbitron font-bold ${rank === 1 ? 'text-yellow-300 text-lg' : 'text-text-muted text-sm'}`}
      >
        {entry.score}
      </span>

      {/* Block podium */}
      <div
        className={`
          w-20 ${heights[rank]} rounded-t-lg border bg-gradient-to-b
          ${colors[rank]} flex items-center justify-center
        `}
      >
        <span className="font-orbitron font-bold text-2xl text-white/30">{rank}</span>
      </div>
    </motion.div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { gameId: _gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { finalScoreboard } = useGameStore()

  // Lance les confettis au mount
  useEffect(() => {
    if (reducedMotion || finalScoreboard.length === 0) return
    // Petit délai pour laisser la page s'afficher
    const timer = setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 90,
        colors: ['#00f5ff', '#ff00e5', '#fff200', '#00ff88'],
        origin: { y: 0.6 },
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [reducedMotion, finalScoreboard.length])

  // Fallback si pas de données
  const sorted = [...finalScoreboard].sort((a, b) => a.rank - b.rank)
  const first = sorted.find((e) => e.rank === 1)
  const second = sorted.find((e) => e.rank === 2)
  const third = sorted.find((e) => e.rank === 3)
  const rest = sorted.filter((e) => e.rank > 3)

  return (
    <div
      className="min-h-screen flex flex-col items-center py-10 px-4 gap-10"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Titre */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="font-orbitron font-bold text-3xl sm:text-4xl text-center"
        style={{
          color: '#fff200',
          textShadow: '0 0 30px rgba(255,242,0,0.7), 0 0 60px rgba(255,242,0,0.3)',
        }}
      >
        FIN DE PARTIE !
      </motion.h1>

      {/* Podium */}
      {sorted.length > 0 ? (
        <div className="flex items-end justify-center gap-4 sm:gap-8">
          {/* 2e */}
          {second && (
            <PodiumStep entry={second} rank={2} delay={0.2} reducedMotion={reducedMotion} />
          )}
          {/* 1er */}
          {first && (
            <PodiumStep entry={first} rank={1} delay={0.4} reducedMotion={reducedMotion} />
          )}
          {/* 3e */}
          {third && (
            <PodiumStep entry={third} rank={3} delay={0} reducedMotion={reducedMotion} />
          )}
        </div>
      ) : (
        <p className="text-text-muted font-rajdhani">Aucun résultat disponible.</p>
      )}

      {/* Tableau complet */}
      {rest.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : 0.8 }}
          className="w-full max-w-lg glass-card p-4"
        >
          <h2 className="font-orbitron text-xs uppercase tracking-widest text-text-muted mb-3">
            Classement complet
          </h2>
          <div className="flex flex-col gap-2">
            {rest.map((entry, i) => (
              <motion.div
                key={entry.player_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reducedMotion ? 0 : 0.9 + i * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <span className="font-orbitron text-text-muted text-sm w-6 text-center">
                  #{entry.rank}
                </span>
                <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                  <PokemonAvatar pokemonId={entry.avatar_pokemon_id} size={28} />
                </div>
                <span className="flex-1 font-semibold text-sm">{entry.pseudo}</span>
                <span className="font-orbitron text-neon-cyan text-sm font-bold">
                  {entry.score}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Boutons d'action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : 1.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button className="btn-primary" onClick={() => navigate('/lobby')}>
          Rejouer →
        </button>
        <button className="btn-secondary" onClick={() => navigate('/pokedex')}>
          Voir le Pokédex →
        </button>
      </motion.div>
    </div>
  )
}
