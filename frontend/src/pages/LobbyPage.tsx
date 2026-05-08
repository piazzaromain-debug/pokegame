import { useState, useEffect, useCallback } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../store/playerStore'
import { useSocket } from '../hooks/useSocket'
import { fetchGames, createGame } from '../api/games'
import type { GameListItem, GameMode, Difficulty, GameCreate } from '../types/game'
import { Particles } from '../components/effects/Particles'
import '../styles/animations.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function spriteUrl(pokemonId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  normal: 'Normal',
  hard: 'Difficile',
}

const DIFFICULTY_COLORS: Record<Difficulty, { text: string; border: string; bg: string; glow: string }> = {
  easy: {
    text: '#00ff88',
    border: 'rgba(0,255,136,0.5)',
    bg: 'rgba(0,255,136,0.12)',
    glow: '0 0 10px rgba(0,255,136,0.4)',
  },
  normal: {
    text: '#fff200',
    border: 'rgba(255,242,0,0.5)',
    bg: 'rgba(255,242,0,0.12)',
    glow: '0 0 10px rgba(255,242,0,0.4)',
  },
  hard: {
    text: '#ff003c',
    border: 'rgba(255,0,60,0.5)',
    bg: 'rgba(255,0,60,0.12)',
    glow: '0 0 10px rgba(255,0,60,0.4)',
  },
}

const MODE_LABELS: Record<GameMode, string> = {
  guess_name: 'Devine le nom',
  guess_image: "Devine l'image",
}

const MODE_ICONS: Record<GameMode, string> = {
  guess_name: '📝',
  guess_image: '🖼️',
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card p-5 rounded-2xl animate-pulse" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3 flex-1">
          <div className="h-4 rounded" style={{ background: 'rgba(255,255,255,0.08)', width: '40%' }} />
          <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', width: '60%' }} />
          <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', width: '80%' }} />
        </div>
        <div className="w-20 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="mt-4 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

// ─── GameCard ─────────────────────────────────────────────────────────────────

interface GameCardProps {
  game: GameListItem
  onJoin: (gameId: string) => void
}

function GameCard({ game, onJoin }: GameCardProps) {
  const diff = DIFFICULTY_COLORS[game.difficulty]
  const fillPct = Math.round((game.players_count / game.max_players) * 100)
  const isFull = game.players_count >= game.max_players

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5 rounded-2xl flex flex-col gap-4"
      style={{ border: '1px solid rgba(0,245,255,0.12)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          {/* Mode */}
          <div className="flex items-center gap-2">
            <span className="text-base">{MODE_ICONS[game.mode]}</span>
            <span
              className="font-orbitron font-bold text-xs uppercase tracking-wider"
              style={{ color: '#00f5ff' }}
            >
              {MODE_LABELS[game.mode]}
            </span>
          </div>

          {/* Hôte */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(176,38,255,0.15)', border: '1px solid rgba(176,38,255,0.35)' }}
            >
              <img
                src={spriteUrl(game.host_avatar_pokemon_id)}
                alt={game.host_pseudo}
                className="w-5 h-5 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <span className="font-rajdhani text-sm truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {game.host_pseudo}
            </span>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Difficulty badge */}
            <span
              className="font-rajdhani font-semibold text-xs uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                color: diff.text,
                border: `1px solid ${diff.border}`,
                backgroundColor: diff.bg,
                boxShadow: diff.glow,
              }}
            >
              {DIFFICULTY_LABELS[game.difficulty]}
            </span>
            {/* Questions count */}
            <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {game.nb_questions} questions
            </span>
          </div>
        </div>

        {/* Join button */}
        <button
          onClick={() => onJoin(game.id)}
          disabled={isFull}
          className="flex-shrink-0 font-orbitron font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-200"
          style={
            isFull
              ? {
                  color: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  cursor: 'not-allowed',
                }
              : {
                  color: '#00f5ff',
                  border: '1px solid rgba(0,245,255,0.4)',
                  backgroundColor: 'rgba(0,245,255,0.08)',
                  boxShadow: '0 0 12px rgba(0,245,255,0.2)',
                }
          }
        >
          {isFull ? 'Complet' : 'Rejoindre →'}
        </button>
      </div>

      {/* Players progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-rajdhani text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Joueurs
          </span>
          <span
            className="font-orbitron font-bold text-xs"
            style={{ color: isFull ? '#ff003c' : '#00f5ff' }}
          >
            {game.players_count} / {game.max_players}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              background: isFull
                ? 'linear-gradient(90deg, #ff003c, #ff00e5)'
                : 'linear-gradient(90deg, #00f5ff, #b026ff)',
              boxShadow: isFull
                ? '0 0 8px rgba(255,0,60,0.5)'
                : '0 0 8px rgba(0,245,255,0.4)',
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-16 text-center"
    >
      {/* Pokéball animée */}
      <motion.div
        animate={{ rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
        className="text-6xl select-none"
        style={{ filter: 'drop-shadow(0 0 16px rgba(0,245,255,0.5))' }}
      >
        ⚪
      </motion.div>
      <div className="flex flex-col gap-2">
        <p
          className="font-orbitron font-bold text-base uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Aucune partie en attente
        </p>
        <p className="font-rajdhani text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Sois le premier — crée une partie !
        </p>
      </div>
    </motion.div>
  )
}

// ─── Create Game Panel ────────────────────────────────────────────────────────

interface CreatePanelProps {
  playerId: string
  onCreated: (gameId: string) => void
}

function CreatePanel({ playerId, onCreated }: CreatePanelProps) {
  const [mode, setMode] = useState<GameMode>('guess_name')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [nbQuestions, setNbQuestions] = useState<number>(10)
  const [maxPlayers, setMaxPlayers] = useState<number>(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload: GameCreate = {
        host_player_id: playerId,
        mode,
        difficulty,
        nb_questions: nbQuestions,
        max_players: maxPlayers,
      }
      const game = await createGame(payload)
      onCreated(game.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [playerId, mode, difficulty, nbQuestions, maxPlayers, onCreated])

  const btnActive = (active: boolean) => ({
    color: active ? '#0a0612' : 'rgba(255,255,255,0.55)',
    background: active
      ? 'linear-gradient(135deg, #00f5ff, #b026ff)'
      : 'rgba(255,255,255,0.04)',
    border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
    boxShadow: active ? '0 0 14px rgba(0,245,255,0.35)' : 'none',
    fontWeight: active ? 700 : 400,
  } as React.CSSProperties)

  return (
    <div
      className="glass-card rounded-2xl p-6 flex flex-col gap-6"
      style={{ border: '1px solid rgba(176,38,255,0.25)', boxShadow: '0 0 30px rgba(176,38,255,0.08)' }}
    >
      <h2
        className="font-orbitron font-bold text-sm uppercase tracking-widest"
        style={{ color: '#b026ff', textShadow: '0 0 10px rgba(176,38,255,0.6)' }}
      >
        Créer une partie
      </h2>

      {/* Mode */}
      <div className="flex flex-col gap-2">
        <label className="font-rajdhani font-semibold text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['guess_name', 'guess_image'] as GameMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="rounded-lg px-3 py-2.5 font-rajdhani font-semibold text-sm transition-all duration-150"
              style={btnActive(mode === m)}
            >
              {MODE_ICONS[m]} {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="flex flex-col gap-2">
        <label className="font-rajdhani font-semibold text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Difficulté
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => {
            const c = DIFFICULTY_COLORS[d]
            const active = difficulty === d
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="rounded-lg px-2 py-2 font-rajdhani font-semibold text-xs uppercase tracking-widest transition-all duration-150"
                style={
                  active
                    ? {
                        color: c.text,
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        boxShadow: c.glow,
                      }
                    : {
                        color: 'rgba(255,255,255,0.4)',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }
                }
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Nb questions */}
      <div className="flex flex-col gap-2">
        <label className="font-rajdhani font-semibold text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Nb questions
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 20, 50].map((n) => (
            <button
              key={n}
              onClick={() => setNbQuestions(n)}
              className="rounded-lg py-2 font-orbitron font-bold text-sm transition-all duration-150"
              style={btnActive(nbQuestions === n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Max players */}
      <div className="flex flex-col gap-2">
        <label className="font-rajdhani font-semibold text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Max joueurs
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[2, 3, 4, 5, 6, 8].map((n) => (
            <button
              key={n}
              onClick={() => setMaxPlayers(n)}
              className="rounded-lg py-2 font-orbitron font-bold text-sm transition-all duration-150"
              style={btnActive(maxPlayers === n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="font-rajdhani text-sm" style={{ color: '#ff003c' }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-xl py-3 font-orbitron font-bold text-sm uppercase tracking-widest transition-all duration-200"
        style={
          loading
            ? { color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'not-allowed' }
            : {
                color: '#0a0612',
                background: 'linear-gradient(135deg, #00f5ff, #b026ff)',
                border: '1px solid transparent',
                boxShadow: '0 0 20px rgba(0,245,255,0.35)',
              }
        }
      >
        {loading ? 'Création...' : 'Créer la partie →'}
      </button>
    </div>
  )
}

// ─── LobbyPage ────────────────────────────────────────────────────────────────

export default function LobbyPage() {
  const { playerId, pseudo, avatarPokemonId, clearPlayer } = usePlayerStore()
  const navigate = useNavigate()
  const { emit, on } = useSocket()

  const [games, setGames] = useState<GameListItem[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect if not connected
  if (!playerId) return <Navigate to="/onboarding" replace />

  // Join/leave lobby + REST fetch + socket subscription
  useEffect(() => {
    emit('lobby:join')

    fetchGames()
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false))

    const cleanup = on<GameListItem[]>('lobby:games_updated', (updated) => {
      setGames(updated)
    })

    return () => {
      cleanup()
      emit('lobby:leave')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleJoin = useCallback(
    (gameId: string) => {
      navigate(`/game/${gameId}`)
    },
    [navigate],
  )

  const handleCreated = useCallback(
    (gameId: string) => {
      navigate(`/game/${gameId}`)
    },
    [navigate],
  )

  return (
    <div className="animated-bg relative min-h-screen flex flex-col overflow-hidden">
      {/* Particules flottantes */}
      <Particles count={15} />

      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,245,255,0.8) 0px, transparent 1px, transparent 40px)',
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        {/* Player info */}
        {avatarPokemonId && (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(0,245,255,0.08)',
                border: '1px solid rgba(0,245,255,0.35)',
                boxShadow: '0 0 10px rgba(0,245,255,0.25)',
              }}
            >
              <img
                src={spriteUrl(avatarPokemonId)}
                alt="avatar"
                className="w-7 h-7 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <span
              className="font-orbitron font-bold text-sm"
              style={{ color: '#00f5ff', textShadow: '0 0 8px rgba(0,245,255,0.5)' }}
            >
              {pseudo}
            </span>
          </div>
        )}

        {/* Logo */}
        <Link
          to="/"
          className="font-orbitron font-bold text-lg absolute left-1/2 -translate-x-1/2 hover:opacity-80 transition-opacity"
          style={{ color: '#ff00e5', textShadow: '0 0 12px rgba(255,0,229,0.6)' }}
        >
          POKÉGAME
        </Link>

        {/* Déconnexion */}
        <button
          onClick={clearPlayer}
          className="font-rajdhani text-xs uppercase tracking-widest opacity-40 hover:opacity-75 transition-opacity"
          style={{ color: 'rgba(255,0,60,0.9)' }}
        >
          Déconnexion
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 flex flex-col gap-8 px-6 py-8 max-w-6xl mx-auto w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-1"
        >
          <h1
            className="font-orbitron font-bold text-4xl md:text-5xl uppercase"
            style={{
              color: '#00f5ff',
              textShadow: '0 0 30px rgba(0,245,255,0.7), 0 0 60px rgba(0,245,255,0.3)',
              letterSpacing: '0.05em',
            }}
          >
            LOBBY
          </h1>
          <p className="font-rajdhani text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Rejoins ou crée une partie
          </p>
        </motion.div>

        {/* Desktop: 2-col layout */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* ── Game list (2/3) ── */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4 lg:flex-[2]"
          >
            <div className="flex items-center justify-between">
              <h2
                className="font-orbitron font-bold text-xs uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Parties disponibles
              </h2>
              {!loading && (
                <span
                  className="font-mono text-xs"
                  style={{ color: 'rgba(0,245,255,0.6)' }}
                >
                  {games.length} partie{games.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {loading ? (
                // Skeleton
                [1, 2, 3].map((i) => <SkeletonCard key={i} />)
              ) : games.length === 0 ? (
                <EmptyState />
              ) : (
                <AnimatePresence mode="popLayout">
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} onJoin={handleJoin} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.section>

          {/* ── Create panel (1/3) ── */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:flex-[1] lg:max-w-xs xl:max-w-sm"
          >
            <CreatePanel playerId={playerId} onCreated={handleCreated} />
          </motion.aside>
        </div>
      </main>

      {/* Background glows */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 rounded-full"
        style={{
          width: '40vw',
          height: '40vw',
          maxWidth: '500px',
          maxHeight: '500px',
          background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 rounded-full"
        style={{
          width: '35vw',
          height: '35vw',
          maxWidth: '450px',
          maxHeight: '450px',
          background: 'radial-gradient(circle, rgba(176,38,255,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  )
}
