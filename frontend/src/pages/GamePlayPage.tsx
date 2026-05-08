import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '../hooks/useSocket'
import { useTimer } from '../hooks/useTimer'
import { useSound } from '../hooks/useSound'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { usePlayerStore } from '../store/playerStore'
import {
  useGameStore,
  type Question,
  type ScoreEntry,
  type GamePhase,
} from '../store/gameStore'

// ─── Types locaux ────────────────────────────────────────────────────────────

interface RevealData {
  correct_pokemon_id: number
  name_fr: string
  cry_url: string
}

interface PlayerAnsweredData {
  player_id: string
  points_earned: number
  total_score: number
  is_correct: boolean
}

interface ReactionData {
  player_id: string
  emoji: string
}

interface FloatingToast {
  id: number
  playerId: string
  points: number
  isCorrect: boolean
}

interface FloatingReaction {
  id: number
  emoji: string
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const REACTION_EMOJIS = ['👍', '😂', '🔥', '😎', '⚡'] as const
const TIMER_RADIUS = 44
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS

// ─── Sous-composants ─────────────────────────────────────────────────────────

function TimerArc({
  progress,
  isCritical,
  timeLeftMs,
}: {
  progress: number
  isCritical: boolean
  timeLeftMs: number
}) {
  const offset = TIMER_CIRCUMFERENCE * (1 - progress)

  let color = '#00f5ff'
  if (progress < 0.5) color = '#fff200'
  if (progress < 0.2) color = '#ff003c'

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96" viewBox="0 0 96 96">
        {/* Track */}
        <circle
          cx="48"
          cy="48"
          r={TIMER_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        {/* Progress arc */}
        <circle
          cx="48"
          cy="48"
          r={TIMER_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={TIMER_CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke 0.3s ease', filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span
        className={`font-orbitron font-bold text-lg z-10 ${isCritical ? 'text-neon-red animate-pulse' : 'text-white'}`}
      >
        {Math.ceil(timeLeftMs / 1000)}
      </span>
    </div>
  )
}

function CountdownScreen({ value }: { value: number }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="font-orbitron font-bold text-9xl text-neon-cyan"
          style={{ textShadow: '0 0 40px rgba(0,245,255,0.8), 0 0 80px rgba(0,245,255,0.4)' }}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PokemonImage({
  imageUrl,
  difficulty,
  timerProgress,
  revealed,
}: {
  imageUrl: string | null
  difficulty: 'easy' | 'normal' | 'hard'
  timerProgress: number
  revealed: boolean
}) {
  if (!imageUrl) {
    return (
      <div className="w-64 h-64 glass-card flex items-center justify-center text-text-muted text-sm">
        Image non disponible
      </div>
    )
  }

  let filterStyle = ''
  if (!revealed) {
    if (difficulty === 'normal') {
      filterStyle = 'brightness(0)'
    } else if (difficulty === 'hard') {
      const blur = 20 * timerProgress
      filterStyle = `blur(${blur.toFixed(1)}px)`
    }
    // easy: no filter
  }

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <img
        src={imageUrl}
        alt="Pokémon mystère"
        className="w-full h-full object-contain select-none"
        style={{
          filter: filterStyle || undefined,
          transition: difficulty === 'hard' ? 'filter 0.1s linear' : undefined,
          imageRendering: 'pixelated',
        }}
        draggable={false}
      />
    </div>
  )
}

function OptionButton({
  option,
  mode,
  selected,
  disabled,
  correctId,
  revealed,
  onClick,
  reducedMotion,
}: {
  option: { id: number; name_fr: string; sprite_url: string | null }
  mode: 'guess_name' | 'guess_image'
  selected: boolean
  disabled: boolean
  correctId: number | null
  revealed: boolean
  onClick: () => void
  reducedMotion: boolean
}) {
  const isCorrect = revealed && option.id === correctId
  const isWrong = revealed && selected && option.id !== correctId

  let borderClass = 'border-white/10 hover:border-neon-cyan/60'
  let bgClass = 'bg-white/[0.04]'
  let shadowStyle: React.CSSProperties = {}

  if (isCorrect) {
    borderClass = 'border-neon-green'
    bgClass = 'bg-neon-green/20'
    shadowStyle = { boxShadow: '0 0 20px rgba(0,255,136,0.5), inset 0 0 20px rgba(0,255,136,0.1)' }
  } else if (isWrong) {
    borderClass = 'border-neon-red'
    bgClass = 'bg-neon-red/20'
    shadowStyle = { boxShadow: '0 0 20px rgba(255,0,60,0.5), inset 0 0 20px rgba(255,0,60,0.1)' }
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      animate={isWrong && !reducedMotion ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
      transition={{ duration: 0.5 }}
      className={`
        relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
        font-rajdhani font-semibold text-base
        ${borderClass} ${bgClass}
        ${!disabled ? 'cursor-pointer hover:scale-102 active:scale-98' : 'cursor-not-allowed opacity-80'}
        ${selected && !revealed ? 'border-neon-cyan/80 bg-neon-cyan/10' : ''}
      `}
      style={shadowStyle}
    >
      {mode === 'guess_image' && option.sprite_url && (
        <img
          src={option.sprite_url}
          alt={option.name_fr}
          className="w-10 h-10 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
      <span className="flex-1 text-center">
        {option.name_fr}
        {isCorrect && <span className="ml-2 text-neon-green">✓</span>}
        {isWrong && <span className="ml-2 text-neon-red">✗</span>}
      </span>
    </motion.button>
  )
}

function ScoreboardPanel({
  scoreboard,
  currentPlayerId,
}: {
  scoreboard: ScoreEntry[]
  currentPlayerId: string | null
}) {
  const rankBadge = (rank: number) => {
    if (rank === 1) return '👑'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-orbitron text-xs uppercase tracking-widest text-text-muted mb-1">
        Classement
      </h3>
      <AnimatePresence>
        {scoreboard.map((entry) => (
          <motion.div
            key={entry.player_id}
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              flex items-center gap-2 p-2 rounded-lg border text-sm
              ${entry.player_id === currentPlayerId
                ? 'border-neon-cyan/40 bg-neon-cyan/5'
                : 'border-white/5 bg-white/[0.02]'}
            `}
          >
            <span className="text-base w-6 text-center">{rankBadge(entry.rank)}</span>
            <span
              className={`w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold overflow-hidden`}
            >
              {entry.avatar_pokemon_id ? (
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.avatar_pokemon_id}.png`}
                  alt={entry.pseudo}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                entry.pseudo.charAt(0).toUpperCase()
              )}
            </span>
            <span className="flex-1 truncate font-semibold text-xs">{entry.pseudo}</span>
            <span className="font-orbitron text-neon-cyan text-xs font-bold">{entry.score}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function GamePlayPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { on, emit } = useSocket()
  const { play, playCry } = useSound()

  const { playerId, pseudo: _pseudo } = usePlayerStore()
  const { setPhase, setCurrentQuestion, setScoreboard, setFinalScoreboard, scoreboard } =
    useGameStore()

  // ── State local ──────────────────────────────────────────────────────────
  const [phase, setLocalPhase] = useState<GamePhase>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [question, setQuestion] = useState<Question | null>(null)
  const [revealData, setRevealData] = useState<RevealData | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [answerStartTime, setAnswerStartTime] = useState<number>(0)
  const [toasts, setToasts] = useState<FloatingToast[]>([])
  const [reactions, setReactions] = useState<FloatingReaction[]>([])
  const [showScoreboard, setShowScoreboard] = useState(false)
  const toastIdRef = useRef(0)
  const reactionIdRef = useRef(0)

  // ── Redirect si non connecté ─────────────────────────────────────────────
  useEffect(() => {
    if (!playerId) navigate('/onboarding')
  }, [playerId, navigate])

  // ── Timer ────────────────────────────────────────────────────────────────
  const handleTimerExpire = useCallback(() => {
    // Temps écoulé sans réponse, on attend la révélation serveur
  }, [])

  const timer = useTimer(question?.time_limit_ms ?? 30000, handleTimerExpire)

  // Son tick critique — déclenché tous les 500 ms quand critique
  const tickBucket = Math.floor(timer.timeLeftMs / 500)
  useEffect(() => {
    if (timer.isCritical && phase === 'question' && timer.isRunning) {
      play('tick')
    }
  }, [tickBucket]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const offStarting = on<{ countdown: number }>('game:starting', (data) => {
      setLocalPhase('countdown')
      setPhase('countdown')
      setCountdown(data.countdown)
    })

    const offNewQuestion = on<Question>('game:new_question', (data) => {
      setQuestion(data)
      setCurrentQuestion(data)
      setSelectedId(null)
      setRevealData(null)
      setLocalPhase('question')
      setPhase('question')
      setAnswerStartTime(performance.now())
      timer.start()
    })

    const offPlayerAnswered = on<PlayerAnsweredData>('game:player_answered', (data) => {
      if (data.player_id !== playerId) {
        const id = ++toastIdRef.current
        setToasts((prev) => [...prev, { id, playerId: data.player_id, points: data.points_earned, isCorrect: data.is_correct }])
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 2500)
      }
    })

    const offRevealed = on<RevealData>('game:question_revealed', (data) => {
      timer.stop()
      setRevealData(data)
      setLocalPhase('revealed')
      setPhase('revealed')
      playCry(data.cry_url)
      play('reveal')
    })

    const offScoreboard = on<ScoreEntry[]>('game:scoreboard_update', (data) => {
      setScoreboard(data)
    })

    const offReaction = on<ReactionData>('game:reaction', (data) => {
      const id = ++reactionIdRef.current
      setReactions((prev) => [...prev, { id, emoji: data.emoji }])
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id))
      }, 2000)
    })

    const offFinished = on<{ final_scoreboard: ScoreEntry[] }>('game:finished', (data) => {
      timer.stop()
      setFinalScoreboard(data.final_scoreboard)
      setLocalPhase('finished')
      setPhase('finished')
      setTimeout(() => navigate(`/game/${gameId}/results`), 800)
    })

    return () => {
      offStarting()
      offNewQuestion()
      offPlayerAnswered()
      offRevealed()
      offScoreboard()
      offReaction()
      offFinished()
    }
  }, [on, emit, gameId, playerId, navigate, playCry, play, setPhase, setCurrentQuestion, setScoreboard, setFinalScoreboard]) // eslint-disable-line

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (pokemonId: number) => {
      if (!question || selectedId !== null || phase !== 'question') return
      const responseTimeMs = Math.round(performance.now() - answerStartTime)
      setSelectedId(pokemonId)
      emit('game:answer', {
        game_id: gameId,
        question_id: question.question_id,
        selected_pokemon_id: pokemonId,
        response_time_ms: responseTimeMs,
        player_id: playerId,
      })
      play('click')
    },
    [question, selectedId, phase, answerStartTime, emit, gameId, playerId, play],
  )

  const handleReaction = useCallback(
    (emoji: string) => {
      emit('game:react', { game_id: gameId, emoji, player_id: playerId })
      play('click')
    },
    [emit, gameId, playerId, play],
  )

  // ── Déductions ──────────────────────────────────────────────────────────
  const mode = 'guess_name' // TODO: récupérer depuis gameStore si besoin
  const gridCols =
    question && question.options.length === 6
      ? 'grid-cols-2 sm:grid-cols-3'
      : 'grid-cols-2'

  // ── Render ───────────────────────────────────────────────────────────────

  if (phase === 'finished') {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="font-orbitron text-2xl text-neon-cyan animate-pulse">
          Fin de partie...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-white flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Countdown overlay */}
      <AnimatePresence>
        {phase === 'countdown' && <CountdownScreen value={countdown} />}
      </AnimatePresence>

      {/* Floating toasts — adversaires */}
      <div className="fixed top-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -20, x: 20 }}
              className={`px-3 py-1 rounded-full font-orbitron text-xs font-bold ${t.isCorrect ? 'bg-neon-green/20 text-neon-green border border-neon-green/40' : 'bg-neon-red/20 text-neon-red border border-neon-red/40'}`}
            >
              +{t.points} pts
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating reactions */}
      <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 2, y: reducedMotion ? 0 : -60 }}
              exit={{ opacity: 0, scale: 0.5, y: reducedMotion ? 0 : -120 }}
              transition={{ duration: 0.6 }}
              className="absolute text-5xl"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {question && (
            <>
              <span className="font-orbitron text-xs text-text-muted uppercase tracking-widest">
                Question
              </span>
              <span className="font-orbitron font-bold text-neon-cyan text-sm">
                {question.question_index + 1}
                <span className="text-text-muted">/{question.total}</span>
              </span>
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neon-cyan rounded-full transition-all duration-500"
                  style={{ width: `${((question.question_index + 1) / question.total) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <TimerArc
            progress={timer.progress}
            isCritical={timer.isCritical}
            timeLeftMs={timer.timeLeftMs}
          />
          {/* Mobile: toggle scoreboard */}
          <button
            className="lg:hidden btn-primary text-xs py-1 px-3"
            onClick={() => setShowScoreboard((v) => !v)}
          >
            Score
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <main className="flex-1 flex flex-col items-center justify-center gap-6 p-4 overflow-y-auto">
          {/* Phase question / revealed */}
          {(phase === 'question' || phase === 'revealed') && question && (
            <>
              {/* Pokémon image */}
              <PokemonImage
                imageUrl={question.image_url}
                difficulty={question.difficulty}
                timerProgress={timer.progress}
                revealed={phase === 'revealed'}
              />

              {/* Revealed name */}
              <AnimatePresence>
                {phase === 'revealed' && revealData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <p className="font-orbitron text-2xl font-bold text-neon-yellow"
                      style={{ textShadow: '0 0 20px rgba(255,242,0,0.6)' }}>
                      {revealData.name_fr}
                    </p>
                    {selectedId !== null && selectedId === revealData.correct_pokemon_id && (
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-neon-green font-bold mt-1"
                      >
                        Bonne réponse ! 🎉
                      </motion.p>
                    )}
                    {selectedId !== null && selectedId !== revealData.correct_pokemon_id && (
                      <p className="text-neon-red font-bold mt-1">Raté...</p>
                    )}
                    {selectedId === null && (
                      <p className="text-text-muted mt-1 text-sm">Temps écoulé</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Options grid */}
              <div className={`grid ${gridCols} gap-3 w-full max-w-lg`}>
                {question.options.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    option={opt}
                    mode={mode}
                    selected={selectedId === opt.id}
                    disabled={selectedId !== null || phase === 'revealed'}
                    correctId={revealData?.correct_pokemon_id ?? null}
                    revealed={phase === 'revealed'}
                    onClick={() => handleAnswer(opt.id)}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Sidebar scoreboard (desktop) */}
        <aside
          className={`
            w-64 border-l border-white/5 bg-black/20 p-4 flex-col gap-4 overflow-y-auto
            hidden lg:flex
          `}
        >
          <ScoreboardPanel scoreboard={scoreboard} currentPlayerId={playerId} />
        </aside>

        {/* Scoreboard mobile overlay */}
        <AnimatePresence>
          {showScoreboard && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-72 bg-bg-deep border-l border-white/10 p-4 z-30 overflow-y-auto lg:hidden"
              style={{ background: 'var(--bg-deep)' }}
            >
              <button
                className="mb-4 text-text-muted text-sm hover:text-white transition-colors"
                onClick={() => setShowScoreboard(false)}
              >
                ✕ Fermer
              </button>
              <ScoreboardPanel scoreboard={scoreboard} currentPlayerId={playerId} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer réactions ─────────────────────────────────────────────── */}
      <footer className="flex items-center justify-center gap-3 px-4 py-3 border-t border-white/5 bg-black/30">
        {REACTION_EMOJIS.map((emoji) => (
          <motion.button
            key={emoji}
            whileTap={reducedMotion ? {} : { scale: 1.4 }}
            whileHover={reducedMotion ? {} : { scale: 1.15 }}
            onClick={() => handleReaction(emoji)}
            className="text-2xl p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-neon-cyan/40 hover:bg-neon-cyan/5 transition-all duration-150 active:scale-95"
          >
            {emoji}
          </motion.button>
        ))}
      </footer>
    </div>
  )
}
