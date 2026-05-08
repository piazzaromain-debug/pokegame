import { useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchPlayerStats } from '../api/leaderboard'
import type { PlayerStats } from '../api/leaderboard'
import { useAchievements } from '../api/achievements'
import type { AchievementData } from '../api/achievements'
import { usePlayerStore } from '../store/playerStore'
import { useReducedMotion } from '../hooks/useReducedMotion'
import '../styles/animations.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_GEN1 = 151

function getOfficialArtworkUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`
}

function getSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  color: string
  glowColor: string
  index: number
  reducedMotion: boolean
}

function StatCard({ icon, label, value, color, glowColor, index, reducedMotion }: StatCardProps) {
  return (
    <motion.div
      className="glass-card flex flex-col items-center gap-2 px-6 py-5 rounded-2xl"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.4,
        delay: reducedMotion ? 0 : 0.3 + index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        border: `1px solid ${glowColor}30`,
        boxShadow: `0 0 20px ${glowColor}0d`,
      }}
    >
      <span className="text-2xl">{icon}</span>
      <span
        className="font-orbitron font-bold text-2xl leading-none"
        style={{ color, textShadow: `0 0 12px ${glowColor}` }}
      >
        {value}
      </span>
      <span
        className="font-rajdhani text-xs uppercase tracking-widest text-center"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {label}
      </span>
    </motion.div>
  )
}

// ─── Pokédex slot ──────────────────────────────────────────────────────────────

type SlotState = 'caught' | 'seen' | 'unknown'

interface PokedexSlotProps {
  pokemonId: number
  state: SlotState
}

function PokedexSlot({ pokemonId, state }: PokedexSlotProps) {
  const paddedId = String(pokemonId).padStart(3, '0')

  if (state === 'unknown') {
    return (
      <div
        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 hover:scale-105"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <span className="font-orbitron font-bold text-lg" style={{ color: 'rgba(255,255,255,0.15)' }}>?</span>
        </div>
        <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
          #{paddedId}
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 hover:scale-105 cursor-default"
      style={{
        background:
          state === 'caught'
            ? 'rgba(0,255,136,0.06)'
            : 'rgba(255,255,255,0.03)',
        border:
          state === 'caught'
            ? '1px solid rgba(0,255,136,0.3)'
            : '1px solid rgba(255,255,255,0.08)',
        boxShadow:
          state === 'caught'
            ? '0 0 10px rgba(0,255,136,0.12)'
            : undefined,
      }}
    >
      <img
        src={getSpriteUrl(pokemonId)}
        alt={`#${paddedId}`}
        className="w-10 h-10 object-contain"
        loading="lazy"
        style={{
          imageRendering: 'pixelated',
          filter:
            state === 'seen'
              ? 'sepia(1) brightness(0.55) opacity(0.65)'
              : 'drop-shadow(0 0 4px rgba(0,255,136,0.5))',
        }}
      />
      <span
        className="font-mono text-[9px]"
        style={{
          color:
            state === 'caught'
              ? 'rgba(0,255,136,0.7)'
              : 'rgba(255,255,255,0.2)',
        }}
      >
        #{paddedId}
      </span>
    </div>
  )
}

// ─── Mistake card ──────────────────────────────────────────────────────────────

interface MistakeEntryProps {
  pokemonId: number
  count: number
  rank: number
  reducedMotion: boolean
}

function MistakeEntry({ pokemonId, count, rank, reducedMotion }: MistakeEntryProps) {
  return (
    <motion.div
      className="glass-card flex items-center gap-4 px-4 py-3 rounded-xl"
      initial={{ opacity: 0, x: reducedMotion ? 0 : -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.35,
        delay: reducedMotion ? 0 : rank * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        border: '1px solid rgba(255,0,60,0.2)',
        boxShadow: '0 0 12px rgba(255,0,60,0.05)',
      }}
    >
      <span
        className="font-orbitron font-bold text-sm w-6 text-center flex-shrink-0"
        style={{ color: 'rgba(255,0,60,0.7)' }}
      >
        #{rank + 1}
      </span>
      <img
        src={getOfficialArtworkUrl(pokemonId)}
        alt={`Pokémon #${pokemonId}`}
        className="w-12 h-12 object-contain flex-shrink-0"
        loading="lazy"
      />
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="font-rajdhani font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Pokémon #{String(pokemonId).padStart(3, '0')}
        </span>
        <span className="font-rajdhani text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          raté {count} fois
        </span>
      </div>
      <div
        className="flex-shrink-0 font-orbitron font-bold text-lg"
        style={{ color: '#ff003c', textShadow: '0 0 8px rgba(255,0,60,0.5)' }}
      >
        ×{count}
      </div>
    </motion.div>
  )
}

// ─── Achievement grid ──────────────────────────────────────────────────────────

const RARITY_BADGE: Record<string, { label: string; color: string; border: string; glow: string }> = {
  common:    { label: 'Commun',    color: 'rgba(200,200,200,0.8)',   border: 'rgba(200,200,200,0.3)',  glow: '' },
  rare:      { label: 'Rare',      color: 'rgba(96,165,250,0.9)',    border: 'rgba(96,165,250,0.5)',   glow: '0 0 10px rgba(96,165,250,0.3)' },
  epic:      { label: 'Épique',    color: 'rgba(176,38,255,0.9)',    border: 'rgba(176,38,255,0.5)',   glow: '0 0 10px rgba(176,38,255,0.4)' },
  legendary: { label: 'Légendaire', color: 'rgba(255,242,0,0.95)',   border: 'rgba(255,242,0,0.6)',    glow: '0 0 15px rgba(255,242,0,0.5)' },
}

interface AchievementGridProps {
  allAchievements: AchievementData[]
  unlockedCodes: Set<string>
  reducedMotion: boolean
}

function AchievementGrid({ allAchievements, unlockedCodes, reducedMotion }: AchievementGridProps) {
  return (
    <div
      className="glass-card p-4 grid gap-3"
      style={{
        border: '1px solid rgba(176,38,255,0.15)',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      }}
    >
      {allAchievements.map((a, i) => {
        const unlocked = unlockedCodes.has(a.code)
        const badge = RARITY_BADGE[a.rarity] ?? RARITY_BADGE.common

        if (!unlocked) {
          return (
            <div
              key={a.code}
              className="group relative flex flex-col items-center gap-2 p-3 rounded-xl cursor-default"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <span className="font-orbitron font-bold text-xl" style={{ color: 'rgba(255,255,255,0.15)' }}>?</span>
              </div>
              <span className="font-rajdhani text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                ???
              </span>
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none"
                style={{ minWidth: '140px' }}
              >
                <div
                  className="glass-card px-3 py-2 rounded-xl text-center"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <p className="font-orbitron text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Verrouillé
                  </p>
                  <p className="font-rajdhani text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {a.description_fr}
                  </p>
                </div>
              </div>
            </div>
          )
        }

        return (
          <motion.div
            key={a.code}
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : i * 0.04 }}
            className="flex flex-col items-center gap-2 p-3 rounded-xl"
            style={{
              background: 'rgba(176,38,255,0.06)',
              border: `1px solid ${badge.border}`,
              boxShadow: badge.glow || undefined,
            }}
          >
            <span className="text-3xl">{a.icon_emoji}</span>
            <span
              className="font-orbitron font-bold text-xs text-center leading-tight"
              style={{ color: badge.color }}
            >
              {a.name_fr}
            </span>
            <span
              className="font-rajdhani text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{
                color: badge.color,
                border: `1px solid ${badge.border}`,
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              {badge.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl px-4 py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="shimmer w-28 h-28 rounded-full" />
        <div className="shimmer w-40 h-6 rounded" />
        <div className="shimmer w-24 h-4 rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { playerId: routePlayerId } = useParams<{ playerId?: string }>()
  const { playerId: connectedId, pseudo, avatarPokemonId } = usePlayerStore()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  // Redirect unauthenticated users trying to view their own profile
  useEffect(() => {
    if (!routePlayerId && !connectedId) {
      navigate('/onboarding', { replace: true })
    }
  }, [routePlayerId, connectedId, navigate])

  const targetId = routePlayerId ?? connectedId
  const isOwnProfile = !routePlayerId || routePlayerId === connectedId

  const { data: stats, isLoading, isError } = useQuery<PlayerStats>({
    queryKey: ['player-stats', targetId],
    queryFn: () => fetchPlayerStats(targetId!),
    enabled: !!targetId,
  })

  const { data: allAchievements = [] } = useAchievements()

  if (!targetId) return null

  // Build Pokédex slot states
  const caughtSet = new Set(stats?.pokemon_caught ?? [])
  const seenSet = new Set(stats?.pokemon_seen ?? [])

  function getSlotState(id: number): SlotState {
    if (caughtSet.has(id)) return 'caught'
    if (seenSet.has(id)) return 'seen'
    return 'unknown'
  }

  // Top 5 mistakes
  const top5Mistakes: Array<{ pokemonId: number; count: number }> = stats
    ? Object.entries(stats.pokemon_mistakes)
        .map(([id, count]) => ({ pokemonId: Number(id), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    : []

  // Achievements unlocked by this player (from their stats if available, else derive from allAchievements)
  // The backend may return unlocked codes in stats; here we use a best-effort approach:
  // show all if no individual data available, locked state derived from server data when available.
  const unlockedAchievementCodes: Set<string> = new Set(
    (stats as (PlayerStats & { achievements_unlocked?: string[] }) | undefined)
      ?.achievements_unlocked ?? []
  )

  const displayAvatar = isOwnProfile ? avatarPokemonId : null
  const displayPseudo = isOwnProfile ? pseudo : `Dresseur #${targetId.slice(0, 6)}`

  const accuracy = stats ? Math.round(stats.accuracy * 100) : 0

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

      <div className="relative z-10 flex flex-col items-center gap-8 py-12 px-4">
        {/* Bouton retour */}
        <div className="w-full max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-rajdhani font-semibold text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: '#00f5ff' }}
          >
            ← Accueil
          </Link>
        </div>

        {isLoading && <ProfileSkeleton />}

        {isError && (
          <div
            className="glass-card flex flex-col items-center gap-3 px-10 py-8 max-w-sm text-center mt-20"
            style={{ borderColor: 'rgba(255,0,60,0.4)', boxShadow: '0 0 20px rgba(255,0,60,0.3)' }}
          >
            <span
              className="font-orbitron font-bold text-2xl"
              style={{ color: '#ff003c', textShadow: '0 0 12px #ff003c' }}
            >
              ERREUR
            </span>
            <span className="font-rajdhani text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Profil introuvable ou serveur hors ligne.
            </span>
          </div>
        )}

        {!isLoading && !isError && stats && (
          <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
            {/* En-tête profil */}
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: reducedMotion ? 0 : -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' }}
            >
              {/* Grand avatar */}
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: 'rgba(0,245,255,0.08)',
                  border: '2px solid rgba(0,245,255,0.4)',
                  boxShadow: '0 0 24px rgba(0,245,255,0.25)',
                }}
              >
                {displayAvatar ? (
                  <img
                    src={getOfficialArtworkUrl(displayAvatar)}
                    alt="avatar"
                    className="w-24 h-24 object-contain"
                  />
                ) : (
                  <span className="font-orbitron font-bold text-3xl" style={{ color: 'rgba(0,245,255,0.5)' }}>?</span>
                )}
              </div>

              {/* Pseudo */}
              <h1
                className="font-orbitron font-bold leading-none"
                style={{
                  fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                  color: '#00f5ff',
                  textShadow:
                    '0 0 20px rgba(0,245,255,0.8), 0 0 50px rgba(0,245,255,0.3)',
                  letterSpacing: '0.08em',
                }}
              >
                {displayPseudo}
              </h1>

              {isOwnProfile && (
                <span
                  className="font-rajdhani text-xs uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Dresseur connecté
                </span>
              )}
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

            {/* Cards stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              <StatCard
                icon="🎮"
                label="Parties jouées"
                value={stats.games_played}
                color="#00f5ff"
                glowColor="rgba(0,245,255,0.5)"
                index={0}
                reducedMotion={reducedMotion}
              />
              <StatCard
                icon="✅"
                label="Taux de réussite"
                value={`${accuracy}%`}
                color="#00ff88"
                glowColor="rgba(0,255,136,0.5)"
                index={1}
                reducedMotion={reducedMotion}
              />
              <StatCard
                icon="🏆"
                label="Victoires"
                value={stats.games_won}
                color="#fff200"
                glowColor="rgba(255,242,0,0.5)"
                index={2}
                reducedMotion={reducedMotion}
              />
              <StatCard
                icon="🔥"
                label="Meilleure série"
                value={stats.best_streak}
                color="#ff00e5"
                glowColor="rgba(255,0,229,0.5)"
                index={3}
                reducedMotion={reducedMotion}
              />
            </div>

            {/* Section Pokédex personnel */}
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.5 }}
            >
              {/* Titre section */}
              <div className="flex items-center gap-4 mb-4">
                <h2
                  className="font-orbitron font-bold text-lg uppercase tracking-widest"
                  style={{ color: '#00ff88', textShadow: '0 0 12px rgba(0,255,136,0.6)' }}
                >
                  {isOwnProfile ? 'MON POKÉDEX' : 'POKÉDEX'}
                </h2>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(0,255,136,0.4), transparent)' }} />
                {/* Compteur */}
                <span
                  className="font-orbitron text-sm font-bold"
                  style={{ color: '#00ff88', textShadow: '0 0 8px rgba(0,255,136,0.5)' }}
                >
                  {caughtSet.size} <span style={{ color: 'rgba(255,255,255,0.35)' }}>/ {TOTAL_GEN1} attrapés</span>
                </span>
              </div>

              {/* Légende */}
              <div className="flex flex-wrap gap-4 mb-4">
                {[
                  { color: 'rgba(0,255,136,0.7)', border: '1px solid rgba(0,255,136,0.4)', label: 'Attrapé' },
                  { color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', label: 'Vu' },
                  { color: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.06)', label: 'Inconnu' },
                ].map(({ color, border, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: color, border }}
                    />
                    <span className="font-rajdhani text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grille 151 */}
              <div
                className="glass-card p-4 grid gap-1.5"
                style={{
                  border: '1px solid rgba(0,255,136,0.12)',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                }}
              >
                {Array.from({ length: TOTAL_GEN1 }, (_, i) => i + 1).map((id) => (
                  <PokedexSlot key={id} pokemonId={id} state={getSlotState(id)} />
                ))}
              </div>
            </motion.div>

            {/* Section points faibles */}
            {top5Mistakes.length > 0 && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.65 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <h2
                    className="font-orbitron font-bold text-lg uppercase tracking-widest"
                    style={{ color: '#ff003c', textShadow: '0 0 12px rgba(255,0,60,0.6)' }}
                  >
                    {isOwnProfile ? 'MES POINTS FAIBLES' : 'POINTS FAIBLES'}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(255,0,60,0.4), transparent)' }} />
                </div>
                <div className="flex flex-col gap-2">
                  {top5Mistakes.map(({ pokemonId, count }, rank) => (
                    <MistakeEntry
                      key={pokemonId}
                      pokemonId={pokemonId}
                      count={count}
                      rank={rank}
                      reducedMotion={reducedMotion}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Section achievements */}
            {allAchievements.length > 0 && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.8 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <h2
                    className="font-orbitron font-bold text-lg uppercase tracking-widest"
                    style={{ color: '#b026ff', textShadow: '0 0 12px rgba(176,38,255,0.6)' }}
                  >
                    {isOwnProfile ? 'MES ACHIEVEMENTS' : 'ACHIEVEMENTS'}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(176,38,255,0.4), transparent)' }} />
                  <span
                    className="font-orbitron text-sm font-bold"
                    style={{ color: '#b026ff', textShadow: '0 0 8px rgba(176,38,255,0.5)' }}
                  >
                    {unlockedAchievementCodes.size}{' '}
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>/ {allAchievements.length}</span>
                  </span>
                </div>
                <AchievementGrid
                  allAchievements={allAchievements}
                  unlockedCodes={unlockedAchievementCodes}
                  reducedMotion={reducedMotion}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Halo décoratif */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 rounded-full animate-pulse-glow"
        style={{
          width: '50vw',
          height: '30vw',
          background:
            'radial-gradient(circle, rgba(0,245,255,0.07) 0%, rgba(0,255,136,0.04) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  )
}
