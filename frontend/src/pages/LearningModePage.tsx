import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePokemonList } from '../api/pokemon'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useSound } from '../hooks/useSound'
import type { Pokemon } from '../types/pokemon'
import { TYPE_COLORS, getTypeColor } from '../utils/typeColors'
import '../styles/animations.css'

const ALL_TYPES = Object.keys(TYPE_COLORS)

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card flex flex-col items-center gap-2 p-2 rounded-2xl">
      <div className="shimmer w-14 h-14 rounded-lg" />
      <div className="shimmer h-3 w-6 rounded" />
      <div className="shimmer h-3 w-14 rounded" />
    </div>
  )
}

// ─── Mini Pokémon card (grid) ─────────────────────────────────────────────────

interface MiniCardProps {
  pokemon: Pokemon
  index: number
  reducedMotion: boolean
  onClick: (pokemon: Pokemon) => void
}

function MiniCard({ pokemon, index, reducedMotion, onClick }: MiniCardProps) {
  const paddedNumber = String(pokemon.pokedex_number).padStart(3, '0')

  // Pick primary type color for the hover glow
  const primaryType = pokemon.types[0] ?? ''
  const typeGlowMap: Record<string, string> = {
    Feu: 'hover:shadow-[0_0_16px_rgba(249,115,22,0.6)]',
    Eau: 'hover:shadow-[0_0_16px_rgba(59,130,246,0.6)]',
    Plante: 'hover:shadow-[0_0_16px_rgba(34,197,94,0.6)]',
    Électrique: 'hover:shadow-[0_0_16px_rgba(250,204,21,0.6)]',
    Psy: 'hover:shadow-[0_0_16px_rgba(236,72,153,0.6)]',
    Poison: 'hover:shadow-[0_0_16px_rgba(168,85,247,0.6)]',
    Dragon: 'hover:shadow-[0_0_16px_rgba(139,92,246,0.6)]',
    Spectre: 'hover:shadow-[0_0_16px_rgba(88,28,220,0.6)]',
    Glace: 'hover:shadow-[0_0_16px_rgba(34,211,238,0.6)]',
    Normal: 'hover:shadow-[0_0_16px_rgba(107,114,128,0.5)]',
    Combat: 'hover:shadow-[0_0_16px_rgba(185,28,28,0.5)]',
    Sol: 'hover:shadow-[0_0_16px_rgba(217,119,6,0.5)]',
    Vol: 'hover:shadow-[0_0_16px_rgba(99,102,241,0.5)]',
    Insecte: 'hover:shadow-[0_0_16px_rgba(132,204,22,0.5)]',
    Roche: 'hover:shadow-[0_0_16px_rgba(120,113,108,0.5)]',
    Ténèbres: 'hover:shadow-[0_0_16px_rgba(31,41,55,0.5)]',
    Acier: 'hover:shadow-[0_0_16px_rgba(148,163,184,0.5)]',
    Fée: 'hover:shadow-[0_0_16px_rgba(249,168,212,0.5)]',
  }
  const glowClass = typeGlowMap[primaryType] ?? 'hover:shadow-glow-cyan'

  const cardVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.3,
        delay: reducedMotion ? 0 : Math.min(index * 0.015, 1.5),
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <motion.button
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onClick={() => onClick(pokemon)}
      className={`glass-card group flex flex-col items-center gap-1.5 p-2 rounded-2xl cursor-pointer
                  transition-all duration-200 w-full
                  hover:border-white/30 hover:scale-[1.05] ${glowClass}`}
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="w-14 h-14 flex items-center justify-center">
        <img
          src={pokemon.sprite_url}
          alt={pokemon.name_fr}
          width={56}
          height={56}
          className="w-full h-full object-contain group-hover:animate-float drop-shadow"
          loading="lazy"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <span className="font-mono text-[10px] leading-none" style={{ color: '#00f5ff' }}>
        #{paddedNumber}
      </span>
      <span className="font-rajdhani font-semibold text-xs text-center leading-tight text-white truncate w-full px-0.5">
        {pokemon.name_fr}
      </span>
    </motion.button>
  )
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  pokemon: Pokemon
  allPokemon: Pokemon[]
  onClose: () => void
  onNavigate: (pokemon: Pokemon) => void
  reducedMotion: boolean
}

function DetailDrawer({ pokemon, allPokemon, onClose, onNavigate, reducedMotion }: DetailDrawerProps) {
  const { playCry } = useSound()
  const paddedNumber = String(pokemon.pokedex_number).padStart(3, '0')

  const currentIndex = allPokemon.findIndex((p) => p.id === pokemon.id)
  const prevPokemon = currentIndex > 0 ? allPokemon[currentIndex - 1] : null
  const nextPokemon = currentIndex < allPokemon.length - 1 ? allPokemon[currentIndex + 1] : null

  function handleCry() {
    if (pokemon.cry_url) {
      playCry(pokemon.cry_url)
    }
  }

  // Drawer animation
  const drawerVariants = {
    hidden: { x: reducedMotion ? 0 : 400, opacity: reducedMotion ? 0 : 1 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0.15 : 0.35,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
    exit: {
      x: reducedMotion ? 0 : 400,
      opacity: 0,
      transition: { duration: reducedMotion ? 0.1 : 0.25, ease: 'easeIn' as const },
    },
  }

  // Overlay animation
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: reducedMotion ? 0.1 : 0.2 } },
    exit: { opacity: 0, transition: { duration: reducedMotion ? 0.05 : 0.15 } },
  }

  // Content keyed on pokemon.id to re-mount with animation on navigation
  const contentVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' as const },
    },
  }

  return (
    <>
      {/* Overlay */}
      <motion.div
        key="overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel — desktop: right side fixed, mobile: bottom sheet */}
      <motion.div
        key="drawer"
        variants={drawerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed z-50 flex flex-col
                   bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh]
                   sm:bottom-auto sm:top-0 sm:left-auto sm:right-0 sm:h-full sm:w-[400px] sm:max-h-none sm:rounded-none sm:rounded-l-3xl"
        style={{
          background: 'rgba(10, 6, 18, 0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.6), 0 0 60px rgba(176,38,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Scrollable inner content */}
        <div className="flex flex-col flex-1 overflow-y-auto overscroll-contain px-6 pt-5 pb-6 gap-6">
          {/* Header: close + number */}
          <div className="flex items-center justify-between flex-shrink-0">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150
                         hover:bg-white/10 active:scale-90"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
              aria-label="Fermer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <span
              className="font-orbitron font-bold text-2xl"
              style={{ color: '#00f5ff', textShadow: '0 0 12px rgba(0,245,255,0.6)' }}
            >
              #{paddedNumber}
            </span>
          </div>

          {/* Pokémon content — keyed to animate on change */}
          <motion.div
            key={pokemon.id}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-5"
          >
            {/* Sprites */}
            <div className="relative flex-shrink-0">
              {/* Official sprite 200×200 */}
              <div
                className="w-[200px] h-[200px] flex items-center justify-center rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <img
                  src={pokemon.sprite_url}
                  alt={pokemon.name_fr}
                  width={200}
                  height={200}
                  className="w-full h-full object-contain drop-shadow-lg"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Shiny sprite badge — bottom-right corner */}
              {pokemon.sprite_shiny_url && (
                <div
                  className="absolute -bottom-3 -right-3 flex flex-col items-center gap-0.5"
                  title="Forme Shiny"
                >
                  <div
                    className="w-16 h-16 flex items-center justify-center rounded-xl"
                    style={{
                      background: 'rgba(255,242,0,0.08)',
                      border: '1px solid rgba(255,242,0,0.35)',
                      boxShadow: '0 0 10px rgba(255,242,0,0.3)',
                    }}
                  >
                    <img
                      src={pokemon.sprite_shiny_url}
                      alt={`${pokemon.name_fr} shiny`}
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <span
                    className="font-rajdhani font-semibold text-[10px] uppercase tracking-wider"
                    style={{ color: '#fff200', textShadow: '0 0 6px rgba(255,242,0,0.8)' }}
                  >
                    Shiny
                  </span>
                </div>
              )}
            </div>

            {/* Name */}
            <h2
              className="font-orbitron font-bold text-2xl text-center"
              style={{
                color: '#ffffff',
                textShadow: '0 0 20px rgba(255,255,255,0.2)',
                marginTop: pokemon.sprite_shiny_url ? '1.5rem' : 0,
              }}
            >
              {pokemon.name_fr.toUpperCase()}
            </h2>

            {/* Type badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className={`text-sm font-rajdhani font-semibold px-4 py-1 rounded-full border ${getTypeColor(type)}`}
                >
                  {type}
                </span>
              ))}
            </div>

            {/* Cry button */}
            <button
              onClick={handleCry}
              disabled={!pokemon.cry_url}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-rajdhani font-semibold text-sm
                         transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                         hover:scale-105 active:scale-95"
              style={
                pokemon.cry_url
                  ? {
                      background: 'rgba(0,245,255,0.1)',
                      border: '1px solid rgba(0,245,255,0.4)',
                      color: '#00f5ff',
                      boxShadow: '0 0 14px rgba(0,245,255,0.25)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.35)',
                    }
              }
            >
              <span className="text-base">🔊</span>
              Écouter le cri
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <span
                className="font-orbitron text-[10px] uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Description
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Pokédex description */}
            <p
              className="font-rajdhani text-base text-center leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {pokemon.pokedex_description ?? 'Aucune description disponible.'}
            </p>
          </motion.div>
        </div>

        {/* Navigation footer — sticky at bottom of drawer */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-4 gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={() => prevPokemon && onNavigate(prevPokemon)}
            disabled={!prevPokemon}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-rajdhani font-semibold text-sm
                       transition-all duration-150
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-white/10 active:scale-95"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
          >
            <span>←</span>
            {prevPokemon && (
              <span className="hidden sm:inline truncate max-w-[80px]">{prevPokemon.name_fr}</span>
            )}
          </button>

          <span
            className="font-orbitron text-xs text-center"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {currentIndex + 1} / {allPokemon.length}
          </span>

          <button
            onClick={() => nextPokemon && onNavigate(nextPokemon)}
            disabled={!nextPokemon}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-rajdhani font-semibold text-sm
                       transition-all duration-150
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-white/10 active:scale-95"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
          >
            {nextPokemon && (
              <span className="hidden sm:inline truncate max-w-[80px]">{nextPokemon.name_fr}</span>
            )}
            <span>→</span>
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Search bar ───────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-sm">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-sm"
        style={{ color: 'rgba(0,245,255,0.5)' }}
      >
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un Pokémon…"
        className="w-full pl-9 pr-4 py-2.5 rounded-xl font-rajdhani text-sm
                   bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30
                   focus:outline-none focus:border-neon-cyan/50 focus:shadow-glow-cyan
                   transition-all duration-200"
      />
    </div>
  )
}

// ─── Type filter bar ──────────────────────────────────────────────────────────

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
                        ${isActive ? 'ring-2 ring-white/40 scale-105' : 'opacity-60 hover:opacity-100'}`}
          >
            {type}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LearningModePage() {
  const { data: pokemonList, isLoading, isError, error } = usePokemonList()
  const reducedMotion = useReducedMotion()

  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)

  // Build filtered list
  const filteredList = (() => {
    if (!pokemonList) return []
    let list = pokemonList
    if (activeType) list = list.filter((p) => p.types.includes(activeType))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name_fr.toLowerCase().includes(q) ||
          String(p.pokedex_number).padStart(3, '0').includes(q)
      )
    }
    return list
  })()

  const isFiltered = !!activeType || search.trim() !== ''

  function handleTypeToggle(type: string) {
    setActiveType((prev) => (prev === type ? null : type))
  }

  // Navigate in drawer using keyboard arrows + Escape
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedPokemon || !pokemonList) return
      const list = filteredList.length > 0 ? filteredList : pokemonList
      const idx = list.findIndex((p) => p.id === selectedPokemon.id)
      if (direction === 'prev' && idx > 0) setSelectedPokemon(list[idx - 1])
      if (direction === 'next' && idx < list.length - 1) setSelectedPokemon(list[idx + 1])
    },
    [selectedPokemon, filteredList, pokemonList]
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (selectedPokemon) {
        if (e.key === 'Escape') setSelectedPokemon(null)
        if (e.key === 'ArrowLeft') handleNavigate('prev')
        if (e.key === 'ArrowRight') handleNavigate('next')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedPokemon, handleNavigate])

  // The list used for prev/next in the drawer should be the currently filtered list
  // so navigation stays consistent with what the user sees in the grid.
  const drawerList = filteredList.length > 0 || isFiltered ? filteredList : pokemonList ?? []

  return (
    <div className="animated-bg relative min-h-screen flex flex-col overflow-hidden">
      {/* Scanline decoration */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,0,229,0.6) 0px, transparent 1px, transparent 40px)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 py-12 px-4">

        {/* Header */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: reducedMotion ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}
        >
          <h1
            className="font-orbitron font-bold leading-none select-none text-center"
            style={{
              fontSize: 'clamp(1.6rem, 6vw, 3.5rem)',
              color: '#ff00e5',
              textShadow:
                '0 0 20px rgba(255,0,229,0.9), 0 0 60px rgba(255,0,229,0.5), 0 0 100px rgba(255,0,229,0.2)',
              letterSpacing: '0.1em',
            }}
          >
            MODE APPRENTISSAGE
          </h1>
          <p
            className="font-rajdhani text-lg tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Explore tous les Pokémon de Kanto
          </p>

          {/* Counter */}
          {!isLoading && !isError && (
            <span
              className="font-rajdhani text-sm tracking-wider"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              151 Pokémon
              {isFiltered && ` · ${filteredList.length} affiché${filteredList.length !== 1 ? 's' : ''}`}
            </span>
          )}
        </motion.div>

        {/* Neon separator */}
        <motion.div
          className="flex items-center gap-4 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.2 }}
        >
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,0,229,0.5))' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff00e5', boxShadow: '0 0 8px #ff00e5' }} />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(255,0,229,0.5))' }} />
        </motion.div>

        {/* Search + filter controls */}
        {!isLoading && !isError && (
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.3 }}
            className="w-full max-w-5xl flex flex-col items-center gap-4"
          >
            <SearchBar value={search} onChange={setSearch} />
            <FilterBar activeType={activeType} onToggle={handleTypeToggle} />
          </motion.div>
        )}

        {/* Error state */}
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

        {/* Loading — skeleton grid */}
        {isLoading && (
          <div className="w-full max-w-screen-xl grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 px-2">
            {Array.from({ length: 151 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Success — Pokémon grid */}
        {!isLoading && !isError && (
          <AnimatePresence mode="popLayout">
            {filteredList.length > 0 ? (
              <div className="w-full max-w-screen-xl grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 px-2">
                {filteredList.map((pokemon, index) => (
                  <MiniCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    index={index}
                    reducedMotion={reducedMotion}
                    onClick={setSelectedPokemon}
                  />
                ))}
              </div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-rajdhani text-lg"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Aucun Pokémon ne correspond à votre recherche.
              </motion.p>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedPokemon && (
          <DetailDrawer
            key="detail-drawer"
            pokemon={selectedPokemon}
            allPokemon={drawerList}
            onClose={() => setSelectedPokemon(null)}
            onNavigate={setSelectedPokemon}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>

      {/* Background glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 rounded-full animate-pulse-glow"
        style={{
          width: '50vw',
          height: '30vw',
          background:
            'radial-gradient(circle, rgba(255,0,229,0.08) 0%, rgba(176,38,255,0.06) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  )
}
