import { useState, useEffect, useCallback } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../store/playerStore'
import { useSocket } from '../hooks/useSocket'
import { fetchGame } from '../api/games'
import type { GameResponse, RoomPlayer, Difficulty, GameMode } from '../types/game'
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

const DIFFICULTY_COLORS: Record<Difficulty, { text: string; border: string; bg: string }> = {
  easy: { text: '#00ff88', border: 'rgba(0,255,136,0.5)', bg: 'rgba(0,255,136,0.12)' },
  normal: { text: '#fff200', border: 'rgba(255,242,0,0.5)', bg: 'rgba(255,242,0,0.12)' },
  hard: { text: '#ff003c', border: 'rgba(255,0,60,0.5)', bg: 'rgba(255,0,60,0.12)' },
}

const MODE_LABELS: Record<GameMode, string> = {
  guess_name: 'Devine le nom',
  guess_image: "Devine l'image",
}

const MODE_ICONS: Record<GameMode, string> = {
  guess_name: '📝',
  guess_image: '🖼️',
}

// ─── Player slot ─────────────────────────────────────────────────────────────

interface PlayerSlotProps {
  player: RoomPlayer | null
  isHost: boolean
}

function PlayerSlot({ player, isHost }: PlayerSlotProps) {
  if (!player) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center gap-3 p-5 aspect-square"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}
      >
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <span className="font-rajdhani text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
          En attente...
        </span>
      </div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl flex flex-col items-center justify-center gap-3 p-5 aspect-square relative"
      style={{
        background: isHost
          ? 'rgba(0,245,255,0.06)'
          : 'rgba(176,38,255,0.05)',
        border: isHost
          ? '1px solid rgba(0,245,255,0.3)'
          : '1px solid rgba(176,38,255,0.2)',
        boxShadow: isHost
          ? '0 0 20px rgba(0,245,255,0.1)'
          : '0 0 12px rgba(176,38,255,0.08)',
      }}
    >
      {/* Host badge */}
      {isHost && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full font-orbitron font-bold text-[9px] uppercase tracking-widest"
          style={{
            background: 'linear-gradient(90deg, #00f5ff, #b026ff)',
            color: '#0a0612',
            boxShadow: '0 0 10px rgba(0,245,255,0.4)',
          }}
        >
          HÔTE
        </div>
      )}

      {/* Avatar */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: isHost ? 'rgba(0,245,255,0.1)' : 'rgba(176,38,255,0.1)',
          border: isHost
            ? '1px solid rgba(0,245,255,0.4)'
            : '1px solid rgba(176,38,255,0.3)',
        }}
      >
        <img
          src={spriteUrl(player.avatar_pokemon_id)}
          alt={player.pseudo}
          className="w-10 h-10 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </motion.div>

      {/* Pseudo */}
      <span
        className="font-orbitron font-bold text-xs text-center truncate w-full"
        style={{
          color: isHost ? '#00f5ff' : '#b026ff',
          textShadow: isHost
            ? '0 0 8px rgba(0,245,255,0.5)'
            : '0 0 8px rgba(176,38,255,0.5)',
        }}
      >
        {player.pseudo}
      </span>
    </motion.div>
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="animated-bg min-h-screen flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 rounded-full border-t-2 border-r-2"
        style={{ borderColor: '#00f5ff' }}
      />
    </div>
  )
}

// ─── GameRoomPage ─────────────────────────────────────────────────────────────

export default function GameRoomPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { playerId, pseudo, avatarPokemonId } = usePlayerStore()
  const navigate = useNavigate()
  const { emit, on } = useSocket()

  const [gameInfo, setGameInfo] = useState<GameResponse | null>(null)
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [notFound, setNotFound] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Redirect if not authenticated
  if (!playerId || !pseudo || !avatarPokemonId) {
    return <Navigate to="/onboarding" replace />
  }

  // Fetch game info + join room
  useEffect(() => {
    if (!gameId) return

    fetchGame(gameId)
      .then((info) => {
        setGameInfo(info)
        setFetching(false)
        // Join the socket room
        emit('game:join', {
          game_id: gameId,
          player_id: playerId,
          pseudo,
          avatar_pokemon_id: avatarPokemonId,
        })
      })
      .catch(() => {
        setNotFound(true)
        setFetching(false)
      })

    // Socket event: full room state on join
    const cleanRoomState = on<{ players: RoomPlayer[] }>('game:room_state', ({ players: initialPlayers }) => {
      setPlayers(initialPlayers)
    })

    // Socket event: new player joined
    const cleanPlayerJoined = on<RoomPlayer>('game:player_joined', (player) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.player_id === player.player_id)) return prev
        return [...prev, player]
      })
    })

    // Socket event: player left
    const cleanPlayerLeft = on<{ player_id: string }>('game:player_left', ({ player_id }) => {
      setPlayers((prev) => prev.filter((p) => p.player_id !== player_id))
    })

    return () => {
      cleanRoomState()
      cleanPlayerJoined()
      cleanPlayerLeft()
      emit('game:leave', { game_id: gameId, player_id: playerId })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const isHost = gameInfo?.host_player_id === playerId

  const handleStartGame = useCallback(() => {
    // Phase 5 — not yet implemented
  }, [])

  if (fetching) return <LoadingScreen />
  if (notFound) {
    // Redirect to lobby
    return <Navigate to="/lobby" replace />
  }

  const maxSlots = gameInfo?.max_players ?? 4
  const filledSlots: (RoomPlayer | null)[] = [
    ...players,
    ...Array(Math.max(0, maxSlots - players.length)).fill(null),
  ]

  const diff = gameInfo ? DIFFICULTY_COLORS[gameInfo.difficulty] : null

  return (
    <div className="animated-bg relative min-h-screen flex flex-col overflow-hidden">
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
        <button
          onClick={() => navigate('/lobby')}
          className="font-rajdhani text-sm uppercase tracking-widest opacity-50 hover:opacity-90 transition-opacity flex items-center gap-1"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          ← Lobby
        </button>
        <span
          className="font-orbitron font-bold text-base absolute left-1/2 -translate-x-1/2"
          style={{ color: '#ff00e5', textShadow: '0 0 12px rgba(255,0,229,0.6)' }}
        >
          SALLE D'ATTENTE
        </span>
        <div /> {/* spacer */}
      </header>

      <main className="relative z-10 flex-1 flex flex-col gap-8 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* ── Game info banner ── */}
        {gameInfo && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card rounded-2xl px-6 py-4 flex flex-wrap items-center gap-4"
            style={{ border: '1px solid rgba(0,245,255,0.15)' }}
          >
            {/* Mode */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{MODE_ICONS[gameInfo.mode]}</span>
              <span
                className="font-orbitron font-bold text-sm"
                style={{ color: '#00f5ff' }}
              >
                {MODE_LABELS[gameInfo.mode]}
              </span>
            </div>

            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

            {/* Difficulty */}
            {diff && (
              <span
                className="font-rajdhani font-semibold text-xs uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: diff.text, border: `1px solid ${diff.border}`, background: diff.bg }}
              >
                {DIFFICULTY_LABELS[gameInfo.difficulty]}
              </span>
            )}

            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

            {/* Questions */}
            <span className="font-mono text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {gameInfo.nb_questions} questions
            </span>

            <div className="flex-1" />

            {/* Player count */}
            <span
              className="font-orbitron font-bold text-sm"
              style={{ color: '#b026ff' }}
            >
              {players.length} / {maxSlots} joueurs
            </span>
          </motion.div>
        )}

        {/* ── Player grid ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
        >
          <h2
            className="font-orbitron font-bold text-xs uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Joueurs connectés
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {filledSlots.map((player, idx) => (
                <PlayerSlot
                  key={player ? player.player_id : `empty-${idx}`}
                  player={player}
                  isHost={player?.player_id === gameInfo?.host_player_id}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ── Host controls ── */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3 mt-auto pt-4"
          >
            <div className="relative group">
              <button
                onClick={handleStartGame}
                disabled
                className="font-orbitron font-bold text-sm uppercase tracking-widest px-10 py-4 rounded-xl transition-all duration-200 cursor-not-allowed"
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Lancer la partie ▶
              </button>
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg font-rajdhani text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap"
                style={{
                  background: 'rgba(10,6,18,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Bientôt disponible (Phase 5)
              </div>
            </div>
            <p className="font-rajdhani text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Seul l'hôte peut lancer la partie
            </p>
          </motion.div>
        )}
      </main>

      {/* Background glows */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/3 rounded-full"
        style={{
          width: '50vw',
          height: '50vw',
          maxWidth: '600px',
          maxHeight: '600px',
          background: 'radial-gradient(circle, rgba(0,245,255,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  )
}
