import { useState, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { usePlayerStore } from '../store/playerStore'
import { usePokemonList } from '../api/pokemon'
import { createPlayer } from '../api/players'
import type { Pokemon } from '../types/pokemon'
import '../styles/animations.css'

// ─── Neon particles (same set as HomePage for visual consistency) ────────────
const NEON_PARTICLES: Array<{
  id: number
  top: string
  left: string
  color: string
  size: string
  delay: string
  duration: string
}> = [
  { id: 1,  top: '8%',  left: '4%',  color: '#00f5ff', size: '4px', delay: '0s',   duration: '3s'   },
  { id: 2,  top: '18%', left: '92%', color: '#ff00e5', size: '6px', delay: '0.5s', duration: '4s'   },
  { id: 3,  top: '38%', left: '12%', color: '#b026ff', size: '3px', delay: '1s',   duration: '3.5s' },
  { id: 4,  top: '58%', left: '82%', color: '#00ff88', size: '5px', delay: '1.5s', duration: '2.8s' },
  { id: 5,  top: '72%', left: '22%', color: '#fff200', size: '4px', delay: '0.8s', duration: '4.2s' },
  { id: 6,  top: '82%', left: '68%', color: '#00f5ff', size: '3px', delay: '2s',   duration: '3.2s' },
  { id: 7,  top: '12%', left: '52%', color: '#ff00e5', size: '5px', delay: '1.2s', duration: '3.8s' },
  { id: 8,  top: '48%', left: '62%', color: '#b026ff', size: '4px', delay: '0.3s', duration: '4.5s' },
]

// ─── Motion variants ──────────────────────────────────────────────────────────
const slideIn = (reduced: boolean) => ({
  hidden:  { opacity: 0, x: reduced ? 0 : 60 },
  visible: { opacity: 1, x: 0, transition: { duration: reduced ? 0.01 : 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: reduced ? 0 : -60, transition: { duration: reduced ? 0.01 : 0.3 } },
})

const pokeBounce = (reduced: boolean) => ({
  initial: { scale: reduced ? 1 : 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
})

// ─── Pseudo step ─────────────────────────────────────────────────────────────
interface PseudoStepProps {
  pseudo: string
  onChange: (v: string) => void
  onNext: () => void
  reduced: boolean
}

function PseudoStep({ pseudo, onChange, onNext, reduced }: PseudoStepProps) {
  const isValid = pseudo.length >= 2 && pseudo.length <= 30
  const hasInput = pseudo.length > 0

  const borderColor = !hasInput
    ? 'rgba(0,245,255,0.3)'
    : isValid
    ? '#00ff88'
    : '#ff003c'

  const borderGlow = !hasInput
    ? 'none'
    : isValid
    ? '0 0 12px rgba(0,255,136,0.5), 0 0 24px rgba(0,255,136,0.2)'
    : '0 0 12px rgba(255,0,60,0.5), 0 0 24px rgba(255,0,60,0.2)'

  return (
    <motion.div
      key="step-pseudo"
      variants={slideIn(reduced)}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-6"
    >
      <p
        className="font-rajdhani text-base text-center"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        Le nom qui s'affichera pendant les parties
      </p>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={pseudo}
          onChange={(e) => onChange(e.target.value)}
          maxLength={30}
          placeholder="Ton pseudo de dresseur..."
          autoFocus
          className="w-full px-5 py-4 rounded-xl font-rajdhani text-lg outline-none transition-all duration-200"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: `1px solid ${borderColor}`,
            boxShadow: borderGlow,
            color: '#ffffff',
            caretColor: '#00f5ff',
          }}
          onKeyDown={(e) => e.key === 'Enter' && isValid && onNext()}
        />
        {/* Compteur de caractères */}
        <span
          className="absolute right-4 bottom-4 font-mono text-xs"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {pseudo.length}/30
        </span>
      </div>

      {/* Message de validation */}
      <AnimatePresence mode="wait">
        {hasInput && (
          <motion.p
            key={isValid ? 'ok' : 'err'}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="font-rajdhani text-sm text-center"
            style={{ color: isValid ? '#00ff88' : '#ff003c' }}
          >
            {isValid
              ? '✓ Pseudo valide !'
              : pseudo.length < 2
              ? 'Au moins 2 caractères requis'
              : 'Maximum 30 caractères'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Bouton Suivant */}
      <button
        className="btn-primary w-full py-4 text-base mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
        disabled={!isValid}
        onClick={onNext}
      >
        Suivant →
      </button>
    </motion.div>
  )
}

// ─── Avatar step ─────────────────────────────────────────────────────────────
interface AvatarStepProps {
  pokemon: Pokemon[]
  isLoading: boolean
  selected: number | null
  onSelect: (id: number) => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string | null
  reduced: boolean
}

function AvatarStep({
  pokemon,
  isLoading,
  selected,
  onSelect,
  onSubmit,
  isSubmitting,
  error,
  reduced,
}: AvatarStepProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return pokemon
    const q = search.toLowerCase()
    return pokemon.filter((p) => p.name_fr.toLowerCase().includes(q))
  }, [pokemon, search])

  return (
    <motion.div
      key="step-avatar"
      variants={slideIn(reduced)}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-5"
    >
      <p
        className="font-rajdhani text-base text-center"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        {selected
          ? `${pokemon.find((p) => p.id === selected)?.name_fr ?? ''} sélectionné !`
          : 'Choisis le Pokémon qui te représente'}
      </p>

      {/* Barre de recherche */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un Pokémon..."
          className="w-full px-5 py-3 rounded-xl font-rajdhani text-base outline-none transition-all duration-200"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(0,245,255,0.25)',
            color: '#ffffff',
            caretColor: '#00f5ff',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,245,255,0.6)'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0,245,255,0.3)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,245,255,0.25)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {filtered.length} / {pokemon.length}
        </span>
      </div>

      {/* Grille des Pokémon */}
      <div
        className="overflow-y-auto rounded-xl"
        style={{
          maxHeight: '340px',
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.06)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,245,255,0.3) transparent',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#00f5ff transparent transparent transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <p
            className="font-rajdhani text-center py-8"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Aucun Pokémon trouvé
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 p-2">
            {filtered.map((poke) => (
              <PokemonCard
                key={poke.id}
                pokemon={poke}
                isSelected={selected === poke.id}
                onSelect={onSelect}
                reduced={reduced}
              />
            ))}
          </div>
        )}
      </div>

      {/* Erreur API */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-rajdhani text-sm text-center px-4 py-2 rounded-lg"
            style={{
              color: '#ff003c',
              background: 'rgba(255,0,60,0.1)',
              border: '1px solid rgba(255,0,60,0.3)',
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Bouton C'est parti */}
      <button
        className="btn-primary w-full py-4 text-base mt-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3"
        disabled={!selected || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span
              className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
              style={{ borderColor: '#00f5ff transparent transparent transparent' }}
            />
            Création en cours...
          </>
        ) : (
          "C'est parti ! →"
        )}
      </button>
    </motion.div>
  )
}

// ─── Pokemon card ─────────────────────────────────────────────────────────────
interface PokemonCardProps {
  pokemon: Pokemon
  isSelected: boolean
  onSelect: (id: number) => void
  reduced: boolean
}

function PokemonCard({ pokemon, isSelected, onSelect, reduced }: PokemonCardProps) {
  return (
    <motion.button
      onClick={() => onSelect(pokemon.id)}
      title={pokemon.name_fr}
      className="relative flex flex-col items-center justify-center p-1 rounded-lg cursor-pointer transition-all duration-150 group"
      style={{
        background: isSelected ? 'rgba(0,245,255,0.12)' : 'transparent',
        border: isSelected
          ? '1px solid rgba(0,245,255,0.7)'
          : '1px solid transparent',
        boxShadow: isSelected
          ? '0 0 12px rgba(0,245,255,0.5), 0 0 24px rgba(0,245,255,0.2)'
          : 'none',
        transform: isSelected && !reduced ? 'scale(1.1)' : 'scale(1)',
      }}
      {...(isSelected && !reduced ? pokeBounce(reduced) : {})}
      whileHover={reduced ? {} : { scale: 1.08 }}
      whileTap={reduced ? {} : { scale: 0.95 }}
    >
      <img
        src={pokemon.sprite_url}
        alt={pokemon.name_fr}
        loading="lazy"
        className="w-10 h-10 object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Numéro + nom au hover */}
      <span
        className="absolute inset-x-0 bottom-0 text-center font-mono text-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pb-0.5 truncate px-0.5"
        style={{ color: isSelected ? '#00f5ff' : 'rgba(255,255,255,0.7)' }}
      >
        #{String(pokemon.pokedex_number).padStart(3, '0')}
      </span>
    </motion.button>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { num: 1, label: 'Pseudo' },
    { num: 2, label: 'Avatar' },
  ]
  return (
    <div className="flex items-center gap-3 justify-center mb-2">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center font-orbitron font-bold text-xs transition-all duration-300"
              style={{
                background:
                  step === s.num
                    ? 'rgba(0,245,255,0.2)'
                    : step > s.num
                    ? 'rgba(0,255,136,0.2)'
                    : 'rgba(255,255,255,0.06)',
                border:
                  step === s.num
                    ? '1px solid rgba(0,245,255,0.6)'
                    : step > s.num
                    ? '1px solid rgba(0,255,136,0.5)'
                    : '1px solid rgba(255,255,255,0.15)',
                color:
                  step === s.num
                    ? '#00f5ff'
                    : step > s.num
                    ? '#00ff88'
                    : 'rgba(255,255,255,0.3)',
                boxShadow:
                  step === s.num ? '0 0 8px rgba(0,245,255,0.4)' : 'none',
              }}
            >
              {step > s.num ? '✓' : s.num}
            </span>
            <span
              className="font-rajdhani text-xs uppercase tracking-widest transition-all duration-300"
              style={{
                color:
                  step === s.num
                    ? '#00f5ff'
                    : step > s.num
                    ? '#00ff88'
                    : 'rgba(255,255,255,0.25)',
              }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-8 h-px transition-all duration-300"
              style={{
                background:
                  step > s.num
                    ? 'rgba(0,255,136,0.4)'
                    : 'rgba(255,255,255,0.1)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { playerId, setPlayer } = usePlayerStore()
  const navigate = useNavigate()
  const reduced = useReducedMotion() ?? false

  const [step, setStep] = useState<1 | 2>(1)
  const [pseudo, setPseudo] = useState('')
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { data: pokemonList = [], isLoading: pokemonLoading } = usePokemonList()

  // Redirect si déjà connecté
  if (playerId !== null) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async () => {
    if (!selectedPokemonId) return
    setIsSubmitting(true)
    setApiError(null)
    try {
      const player = await createPlayer({
        pseudo,
        avatar_pokemon_id: selectedPokemonId,
      })
      setPlayer(player.id, player.pseudo, player.avatar_pokemon_id)
      navigate('/')
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animated-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Particules néon */}
      {NEON_PARTICLES.map((p) => (
        <div
          key={p.id}
          className="animate-float pointer-events-none absolute rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}, 0 0 20px ${p.color}`,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {/* Scanlines décoratives */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,245,255,0.8) 0px, transparent 1px, transparent 40px)',
        }}
      />

      {/* Halo central */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse-glow"
        style={{
          width: '60vw',
          height: '60vw',
          maxWidth: '700px',
          maxHeight: '700px',
          background:
            'radial-gradient(circle, rgba(255,0,229,0.1) 0%, rgba(0,245,255,0.05) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Carte principale */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative z-10 w-full max-w-2xl px-8 py-10 flex flex-col gap-7"
        style={{
          border: '1px solid rgba(255,0,229,0.2)',
          boxShadow:
            '0 0 40px rgba(255,0,229,0.08), 0 0 80px rgba(0,245,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Titre */}
        <div className="text-center">
          <h1
            className="font-orbitron font-bold select-none"
            style={{
              fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
              color: '#ff00e5',
              textShadow:
                '0 0 20px rgba(255,0,229,0.9), 0 0 60px rgba(255,0,229,0.4)',
              letterSpacing: '0.08em',
            }}
          >
            CRÉER TON PROFIL
          </h1>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Séparateur */}
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(255,0,229,0.3), rgba(0,245,255,0.3), transparent)',
          }}
        />

        {/* Contenu par étape */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <PseudoStep
              key="pseudo"
              pseudo={pseudo}
              onChange={setPseudo}
              onNext={() => setStep(2)}
              reduced={reduced}
            />
          ) : (
            <AvatarStep
              key="avatar"
              pokemon={pokemonList}
              isLoading={pokemonLoading}
              selected={selectedPokemonId}
              onSelect={(id) => {
                setSelectedPokemonId(id)
                setApiError(null)
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={apiError}
              reduced={reduced}
            />
          )}
        </AnimatePresence>

        {/* Bouton retour étape 2 → 1 */}
        {step === 2 && (
          <button
            className="font-rajdhani text-sm text-center transition-opacity duration-150 hover:opacity-100 opacity-50"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onClick={() => setStep(1)}
          >
            ← Modifier le pseudo
          </button>
        )}
      </motion.div>
    </div>
  )
}
