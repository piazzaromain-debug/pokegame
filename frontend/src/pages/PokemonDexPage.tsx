import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePokemonList } from '../api/pokemon'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Pokemon } from '../types/pokemon'
import '../styles/animations.css'

// ─── Type color mapping ───────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  Normal:     'bg-gray-500/20 text-gray-300 border-gray-500/40',
  Feu:        'bg-orange-500/20 text-orange-300 border-orange-500/40',
  Eau:        'bg-blue-500/20 text-blue-300 border-blue-500/40',
  Électrique: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
  Plante:     'bg-green-500/20 text-green-300 border-green-500/40',
  Glace:      'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
  Combat:     'bg-red-700/20 text-red-300 border-red-700/40',
  Poison:     'bg-purple-500/20 text-purple-300 border-purple-500/40',
  Sol:        'bg-amber-600/20 text-amber-300 border-amber-600/40',
  Vol:        'bg-indigo-400/20 text-indigo-200 border-indigo-400/40',
  Psy:        'bg-pink-500/20 text-pink-300 border-pink-500/40',
  Insecte:    'bg-lime-500/20 text-lime-300 border-lime-500/40',
  Roche:      'bg-stone-500/20 text-stone-300 border-stone-500/40',
  Spectre:    'bg-purple-800/20 text-purple-200 border-purple-800/40',
  Dragon:     'bg-violet-600/20 text-violet-300 border-violet-600/40',
}

const ALL_TYPES = Object.keys(TYPE_COLORS)

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card flex flex-col items-center gap-2 p-3 rounded-2xl">
      {/* Sprite placeholder */}
      <div className="shimmer w-16 h-16 rounded-lg" />
      {/* Number placeholder */}
      <div className="shimmer h-3 w-8 rounded" />
      {/* Name placeholder */}
      <div className="shimmer h-4 w-16 rounded" />
      {/* Type badge placeholder */}
      <div className="shimmer h-4 w-12 rounded-full" />
    </div>
  )
}

// ─── Pokemon card ──────────────────────────────────────────────────────────────

interface PokemonCardProps {
  pokemon: Pokemon
  index: number
  reducedMotion: boolean
}

function PokemonCard({ pokemon, index, reducedMotion }: PokemonCardProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.35,
        delay: reducedMotion ? 0 : index * 0.02,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  }

  const paddedNumber = String(pokemon.pokedex_number).padStart(3, '0')
  const typeClasses = pokemon.types.map(
    (t) => TYPE_COLORS[t] ?? 'bg-white/10 text-white/60 border-white/20'
  )

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="glass-card group flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer
                 transition-all duration-200
                 hover:border-neon-cyan/50 hover:shadow-glow-cyan hover:scale-[1.05]"
      style={{ borderColor: 'rgba(255,255,255,0.1)' }}
    >
      {/* Sprite */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <img
          src={pokemon.sprite_url}
          alt={pokemon.name_fr}
          width={64}
          height={64}
          className="w-full h-full object-contain group-hover:animate-float drop-shadow-lg"
          loading="lazy"
        />
      </div>

      {/* Numéro */}
      <span
        className="font-mono text-xs leading-none"
        style={{ color: '#00f5ff' }}
      >
        #{paddedNumber}
      </span>

      {/* Nom */}
      <span className="font-rajdhani font-semibold text-sm text-center leading-tight text-white">
        {pokemon.name_fr}
      </span>

      {/* Badges de types */}
      <div className="flex flex-wrap justify-center gap-1">
        {pokemon.types.map((type, i) => (
          <span
            key={i}
            className={`text-[10px] font-rajdhani font-semibold px-2 py-0.5 rounded-full border ${typeClasses[i]}`}
          >
            {type}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  activeType: string | null
  onToggle: (type: string) => void
}

function FilterBar({ activeType, onToggle }: FilterBarProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-4">
      {ALL_TYPES.map((type) => {
        const isActive = activeType === type
        const classes = TYPE_COLORS[type] ?? 'bg-white/10 text-white/60 border-white/20'
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={`text-xs font-rajdhani font-semibold px-3 py-1 rounded-full border
                        transition-all duration-150 hover:scale-105
                        ${classes}
                        ${isActive ? 'ring-2 ring-white/40 scale-105' : 'opacity-70 hover:opacity-100'}`}
          >
            {type}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PokemonDexPage() {
  const { data: pokemonList, isLoading, isError, error } = usePokemonList()
  const reducedMotion = useReducedMotion()
  const [activeType, setActiveType] = useState<string | null>(null)

  function handleTypeToggle(type: string) {
    setActiveType((prev) => (prev === type ? null : type))
  }

  const filteredList = activeType
    ? pokemonList?.filter((p) => p.types.includes(activeType))
    : pokemonList

  return (
    <div className="animated-bg relative min-h-screen flex flex-col overflow-hidden">
      {/* Grille scanline décorative */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,245,255,0.8) 0px, transparent 1px, transparent 40px)',
        }}
      />

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center gap-6 py-12 px-4">
        {/* En-tête */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: reducedMotion ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}
        >
          <h1
            className="font-orbitron font-bold leading-none select-none"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              color: '#00f5ff',
              textShadow:
                '0 0 20px rgba(0,245,255,0.9), 0 0 60px rgba(0,245,255,0.5), 0 0 100px rgba(0,245,255,0.2)',
              letterSpacing: '0.1em',
            }}
          >
            POKÉDEX
          </h1>

          {/* Compteur */}
          <span
            className="font-rajdhani text-lg tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {isLoading
              ? 'Chargement…'
              : isError
              ? 'Erreur de chargement'
              : `${filteredList?.length ?? 0}${activeType ? ` / ${pokemonList?.length ?? 0}` : ''} Pokémon`}
          </span>
        </motion.div>

        {/* Séparateur néon */}
        <motion.div
          className="flex items-center gap-4 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.2 }}
        >
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(0,245,255,0.5))' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(0,245,255,0.5))' }} />
        </motion.div>

        {/* Filtre par type */}
        {!isLoading && !isError && (
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.3 }}
            className="w-full max-w-5xl"
          >
            <FilterBar activeType={activeType} onToggle={handleTypeToggle} />
          </motion.div>
        )}

        {/* État : erreur */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card flex flex-col items-center gap-3 px-10 py-8 max-w-sm text-center"
            style={{ borderColor: 'rgba(255,0,60,0.4)', boxShadow: '0 0 20px rgba(255,0,60,0.3)' }}
          >
            <span
              className="font-orbitron font-bold text-2xl"
              style={{ color: '#ff003c', textShadow: '0 0 12px #ff003c' }}
            >
              ERREUR
            </span>
            <span className="font-rajdhani text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {error instanceof Error ? error.message : 'Impossible de charger les Pokémon.'}
            </span>
            <span className="font-rajdhani text-sm" style={{ color: 'rgba(255,0,60,0.7)' }}>
              Vérifiez que le serveur backend est lancé.
            </span>
          </motion.div>
        )}

        {/* État : chargement — 151 skeletons */}
        {isLoading && (
          <div className="w-full max-w-screen-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 px-2">
            {Array.from({ length: 151 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* État : succès — grille des Pokémon */}
        {!isLoading && !isError && filteredList && (
          <AnimatePresence mode="popLayout">
            <div className="w-full max-w-screen-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 px-2">
              {filteredList.map((pokemon, index) => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={index}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Message quand le filtre est vide */}
        {!isLoading && !isError && filteredList?.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-rajdhani text-lg"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Aucun Pokémon pour ce type.
          </motion.p>
        )}
      </div>

      {/* Halo de lumière derrière le titre */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 rounded-full animate-pulse-glow"
        style={{
          width: '50vw',
          height: '30vw',
          background:
            'radial-gradient(circle, rgba(0,245,255,0.08) 0%, rgba(176,38,255,0.06) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  )
}
