import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLeaderboard } from '../api/leaderboard'
import type { GameMode, Difficulty, Period, LeaderboardEntry } from '../api/leaderboard'
import { usePlayerStore } from '../store/playerStore'
import { useReducedMotion } from '../hooks/useReducedMotion'
import '../styles/animations.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOfficialArtworkUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_BG: Record<number, string> = {
  1: 'rgba(255,215,0,0.12)',
  2: 'rgba(192,192,192,0.1)',
  3: 'rgba(205,127,50,0.1)',
}
const RANK_BORDER: Record<number, string> = {
  1: 'rgba(255,215,0,0.45)',
  2: 'rgba(192,192,192,0.35)',
  3: 'rgba(205,127,50,0.35)',
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="shimmer w-8 h-4 rounded" />
      <div className="w-8 h-8 rounded-full shimmer flex-shrink-0" />
      <div className="shimmer h-4 w-32 rounded" />
      <div className="ml-auto shimmer h-4 w-16 rounded" />
      <div className="shimmer h-4 w-14 rounded" />
    </div>
  )
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

interface RowProps {
  entry: LeaderboardEntry
  index: number
  isCurrentPlayer: boolean
  reducedMotion: boolean
}

function LeaderboardRow({ entry, index, isCurrentPlayer, reducedMotion }: RowProps) {
  const isTop3 = entry.rank <= 3
  const medal = RANK_MEDALS[entry.rank]

  const rowVariants = {
    hidden: { opacity: 0, x: reducedMotion ? 0 : -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.35,
        delay: reducedMotion ? 0 : index * 0.04,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <motion.div
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200"
      style={{
        background: isCurrentPlayer
          ? 'rgba(0,245,255,0.08)'
          : isTop3
          ? RANK_BG[entry.rank]
          : 'rgba(255,255,255,0.025)',
        border: isCurrentPlayer
          ? '1px solid rgba(0,245,255,0.4)'
          : isTop3
          ? `1px solid ${RANK_BORDER[entry.rank]}`
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isCurrentPlayer
          ? '0 0 16px rgba(0,245,255,0.12)'
          : isTop3 && entry.rank === 1
          ? '0 0 16px rgba(255,215,0,0.1)'
          : undefined,
      }}
    >
      {/* Rang */}
      <span
        className="font-orbitron font-bold text-sm w-8 text-center flex-shrink-0"
        style={{
          color: isTop3
            ? entry.rank === 1
              ? '#ffd700'
              : entry.rank === 2
              ? '#c0c0c0'
              : '#cd7f32'
            : isCurrentPlayer
            ? '#00f5ff'
            : 'rgba(255,255,255,0.45)',
          textShadow: isTop3 && entry.rank === 1 ? '0 0 8px rgba(255,215,0,0.6)' : undefined,
        }}
      >
        {medal ?? `#${entry.rank}`}
      </span>

      {/* Avatar Pokémon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: isCurrentPlayer
            ? '1px solid rgba(0,245,255,0.4)'
            : '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <img
          src={getOfficialArtworkUrl(entry.avatar_pokemon_id)}
          alt=""
          className="w-7 h-7 object-contain"
          loading="lazy"
        />
      </div>

      {/* Pseudo */}
      <span
        className="font-rajdhani font-semibold text-sm truncate flex-1 min-w-0"
        style={{
          color: isCurrentPlayer ? '#00f5ff' : 'rgba(255,255,255,0.85)',
          textShadow: isCurrentPlayer ? '0 0 8px rgba(0,245,255,0.4)' : undefined,
        }}
      >
        {entry.pseudo}
        {isCurrentPlayer && (
          <span
            className="ml-2 text-[10px] font-orbitron uppercase tracking-widest"
            style={{ color: 'rgba(0,245,255,0.6)' }}
          >
            (toi)
          </span>
        )}
      </span>

      {/* Score */}
      <span
        className="font-orbitron font-bold text-sm flex-shrink-0"
        style={{
          color: isTop3
            ? entry.rank === 1
              ? '#ffd700'
              : entry.rank === 2
              ? '#c0c0c0'
              : '#cd7f32'
            : '#fff200',
          textShadow:
            isTop3 && entry.rank === 1 ? '0 0 10px rgba(255,215,0,0.5)' : '0 0 6px rgba(255,242,0,0.3)',
        }}
      >
        {entry.final_score.toLocaleString('fr-FR')} pts
      </span>

      {/* Date */}
      <span
        className="font-rajdhani text-xs flex-shrink-0 w-14 text-right"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {formatDate(entry.finished_at)}
      </span>
    </motion.div>
  )
}

// ─── Toggle button ─────────────────────────────────────────────────────────────

interface ToggleBtnProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  color?: 'cyan' | 'magenta' | 'yellow'
}

function ToggleBtn({ active, onClick, children, color = 'cyan' }: ToggleBtnProps) {
  const colors = {
    cyan: {
      activeBg: 'rgba(0,245,255,0.15)',
      activeBorder: 'rgba(0,245,255,0.6)',
      activeColor: '#00f5ff',
      activeShadow: '0 0 12px rgba(0,245,255,0.35)',
      inactiveColor: 'rgba(0,245,255,0.45)',
    },
    magenta: {
      activeBg: 'rgba(255,0,229,0.15)',
      activeBorder: 'rgba(255,0,229,0.6)',
      activeColor: '#ff00e5',
      activeShadow: '0 0 12px rgba(255,0,229,0.35)',
      inactiveColor: 'rgba(255,0,229,0.45)',
    },
    yellow: {
      activeBg: 'rgba(255,242,0,0.12)',
      activeBorder: 'rgba(255,242,0,0.6)',
      activeColor: '#fff200',
      activeShadow: '0 0 12px rgba(255,242,0,0.3)',
      inactiveColor: 'rgba(255,242,0,0.4)',
    },
  }

  const c = colors[color]

  return (
    <button
      onClick={onClick}
      className="font-orbitron font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: active ? c.activeBg : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? c.activeBorder : 'rgba(255,255,255,0.12)'}`,
        color: active ? c.activeColor : 'rgba(255,255,255,0.45)',
        boxShadow: active ? c.activeShadow : undefined,
      }}
    >
      {children}
    </button>
  )
}

// ─── Column header ─────────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div
      className="flex items-center gap-4 px-4 py-2 rounded-lg mb-1"
      style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.1)' }}
    >
      <span className="font-orbitron text-[10px] uppercase tracking-widest w-8 text-center flex-shrink-0" style={{ color: 'rgba(0,245,255,0.5)' }}>
        Rang
      </span>
      <div className="w-9 flex-shrink-0" />
      <span className="font-orbitron text-[10px] uppercase tracking-widest flex-1" style={{ color: 'rgba(0,245,255,0.5)' }}>
        Joueur
      </span>
      <span className="font-orbitron text-[10px] uppercase tracking-widest flex-shrink-0" style={{ color: 'rgba(0,245,255,0.5)' }}>
        Score
      </span>
      <span className="font-orbitron text-[10px] uppercase tracking-widest flex-shrink-0 w-14 text-right" style={{ color: 'rgba(0,245,255,0.5)' }}>
        Date
      </span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const MODE_LABELS: Record<GameMode, string> = {
  guess_name: 'Devine le nom',
  guess_image: 'Devine l\'image',
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  normal: 'Normal',
  hard: 'Difficile',
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Aujourd\'hui',
  week: 'Cette semaine',
  all: 'Tout temps',
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<GameMode>('guess_name')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [period, setPeriod] = useState<Period>('all')

  const { playerId } = usePlayerStore()
  const reducedMotion = useReducedMotion()

  const { data: entries, isLoading, isError } = useLeaderboard(mode, difficulty, period)

  return (
    <div className="animated-bg relative min-h-screen flex flex-col overflow-hidden">
      {/* Scanline décorative */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,245,255,0.8) 0px, transparent 1px, transparent 40px)',
        }}
      />

      {/* Contenu */}
      <div className="relative z-10 flex flex-col items-center gap-6 py-12 px-4">
        {/* Titre */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: reducedMotion ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}
        >
          <h1
            className="font-orbitron font-bold leading-none select-none"
            style={{
              fontSize: 'clamp(2rem, 7vw, 4.5rem)',
              color: '#fff200',
              textShadow:
                '0 0 20px rgba(255,242,0,0.9), 0 0 60px rgba(255,242,0,0.4), 0 0 100px rgba(255,242,0,0.15)',
              letterSpacing: '0.12em',
            }}
          >
            LEADERBOARD
          </h1>
          <span
            className="font-rajdhani text-sm tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Classement des meilleurs dresseurs
          </span>
        </motion.div>

        {/* Séparateur néon */}
        <motion.div
          className="flex items-center gap-4 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.2 }}
        >
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,242,0,0.5))' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fff200', boxShadow: '0 0 8px #fff200' }} />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(255,242,0,0.5))' }} />
        </motion.div>

        {/* Filtres */}
        <motion.div
          className="flex flex-col items-center gap-4 w-full max-w-2xl"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.3 }}
        >
          {/* Mode */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-orbitron text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Mode
            </span>
            <div className="flex gap-2">
              {(Object.keys(MODE_LABELS) as GameMode[]).map((m) => (
                <ToggleBtn
                  key={m}
                  active={mode === m}
                  onClick={() => setMode(m)}
                  color="cyan"
                >
                  {MODE_LABELS[m]}
                </ToggleBtn>
              ))}
            </div>
          </div>

          {/* Difficulté */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-orbitron text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Difficulté
            </span>
            <div className="flex gap-2">
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                <ToggleBtn
                  key={d}
                  active={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  color="magenta"
                >
                  {DIFFICULTY_LABELS[d]}
                </ToggleBtn>
              ))}
            </div>
          </div>

          {/* Période */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-orbitron text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Période
            </span>
            <div className="flex gap-2">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <ToggleBtn
                  key={p}
                  active={period === p}
                  onClick={() => setPeriod(p)}
                  color="yellow"
                >
                  {PERIOD_LABELS[p]}
                </ToggleBtn>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tableau */}
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.45 }}
        >
          <div
            className="glass-card p-4 flex flex-col gap-1"
            style={{ border: '1px solid rgba(255,242,0,0.15)', boxShadow: '0 0 30px rgba(255,242,0,0.05)' }}
          >
            <TableHeader />

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col gap-1 mt-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            )}

            {/* Erreur */}
            {isError && (
              <div
                className="flex flex-col items-center gap-2 py-10 text-center"
              >
                <span
                  className="font-orbitron font-bold text-lg"
                  style={{ color: '#ff003c', textShadow: '0 0 12px #ff003c' }}
                >
                  ERREUR
                </span>
                <span className="font-rajdhani text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Impossible de charger le classement.
                </span>
              </div>
            )}

            {/* Vide */}
            {!isLoading && !isError && entries?.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <span className="text-3xl">🏆</span>
                <span
                  className="font-rajdhani text-base"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Aucun score pour cette combinaison — sois le premier !
                </span>
              </div>
            )}

            {/* Données */}
            {!isLoading && !isError && entries && entries.length > 0 && (
              <AnimatePresence mode="wait">
                <div key={`${mode}-${difficulty}-${period}`} className="flex flex-col gap-1 mt-1">
                  {entries.map((entry, index) => (
                    <LeaderboardRow
                      key={entry.player_id + entry.rank}
                      entry={entry}
                      index={index}
                      isCurrentPlayer={entry.player_id === playerId}
                      reducedMotion={reducedMotion}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* Halo décoratif */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 rounded-full animate-pulse-glow"
        style={{
          width: '50vw',
          height: '30vw',
          background:
            'radial-gradient(circle, rgba(255,242,0,0.06) 0%, rgba(176,38,255,0.04) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  )
}
