import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../store/playerStore'
import '../styles/animations.css'

// Données statiques pour les particules néon flottantes
const NEON_PARTICLES: Array<{
  id: number
  top: string
  left: string
  color: string
  size: string
  delay: string
  duration: string
}> = [
  { id: 1,  top: '10%', left: '5%',  color: '#00f5ff', size: '4px',  delay: '0s',    duration: '3s' },
  { id: 2,  top: '20%', left: '90%', color: '#ff00e5', size: '6px',  delay: '0.5s',  duration: '4s' },
  { id: 3,  top: '35%', left: '15%', color: '#b026ff', size: '3px',  delay: '1s',    duration: '3.5s' },
  { id: 4,  top: '55%', left: '80%', color: '#00ff88', size: '5px',  delay: '1.5s',  duration: '2.8s' },
  { id: 5,  top: '70%', left: '25%', color: '#fff200', size: '4px',  delay: '0.8s',  duration: '4.2s' },
  { id: 6,  top: '80%', left: '70%', color: '#00f5ff', size: '3px',  delay: '2s',    duration: '3.2s' },
  { id: 7,  top: '15%', left: '50%', color: '#ff00e5', size: '5px',  delay: '1.2s',  duration: '3.8s' },
  { id: 8,  top: '45%', left: '60%', color: '#b026ff', size: '4px',  delay: '0.3s',  duration: '4.5s' },
  { id: 9,  top: '65%', left: '40%', color: '#00f5ff', size: '6px',  delay: '1.8s',  duration: '3.1s' },
  { id: 10, top: '88%', left: '10%', color: '#00ff88', size: '3px',  delay: '0.6s',  duration: '3.7s' },
  { id: 11, top: '5%',  left: '70%', color: '#fff200', size: '4px',  delay: '2.2s',  duration: '2.9s' },
  { id: 12, top: '92%', left: '55%', color: '#ff00e5', size: '5px',  delay: '1.4s',  duration: '4.1s' },
]

// Variants Framer Motion pour le staggered reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

const glowVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
}

// ─── Player profile card (displayed when logged in) ──────────────────────────
function PlayerCard() {
  const { pseudo, avatarPokemonId, clearPlayer } = usePlayerStore()
  const navigate = useNavigate()

  const spriteUrl = avatarPokemonId
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${avatarPokemonId}.png`
    : null

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
      className="glass-card flex items-center gap-4 px-6 py-4"
      style={{
        border: '1px solid rgba(0,245,255,0.25)',
        boxShadow: '0 0 20px rgba(0,245,255,0.08)',
      }}
    >
      {/* Sprite Pokémon dans un cercle */}
      {spriteUrl && (
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.35)',
            boxShadow: '0 0 12px rgba(0,245,255,0.3)',
          }}
        >
          <img
            src={spriteUrl}
            alt="avatar"
            className="w-10 h-10 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      )}

      {/* Pseudo + actions */}
      <div className="flex flex-col gap-1 min-w-0">
        <span
          className="font-orbitron font-bold text-sm truncate"
          style={{ color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.6)' }}
        >
          {pseudo}
        </span>
        <div className="flex items-center gap-3">
          <button
            className="font-rajdhani text-xs uppercase tracking-widest transition-opacity duration-150 hover:opacity-100 opacity-50"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onClick={() => navigate('/onboarding')}
          >
            Changer de profil
          </button>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <button
            className="font-rajdhani text-xs uppercase tracking-widest transition-opacity duration-150 hover:opacity-100 opacity-50"
            style={{ color: 'rgba(255,0,60,0.8)' }}
            onClick={clearPlayer}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const { playerId } = usePlayerStore()
  const navigate = useNavigate()

  return (
    <div className="animated-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Particules néon flottantes */}
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

      {/* Grille scanline décorative */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,245,255,0.8) 0px, transparent 1px, transparent 40px)',
        }}
      />

      {/* Contenu principal avec stagger */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge "BETA" */}
        <motion.div variants={itemVariants}>
          <span
            className="font-mono text-xs uppercase tracking-[0.3em] px-3 py-1 rounded-full"
            style={{
              color: '#00ff88',
              border: '1px solid rgba(0,255,136,0.4)',
              backgroundColor: 'rgba(0,255,136,0.08)',
              boxShadow: '0 0 12px rgba(0,255,136,0.3)',
            }}
          >
            Beta — Multijoueur Temps Réel
          </span>
        </motion.div>

        {/* Logo principal */}
        <motion.div variants={glowVariants} className="flex flex-col items-center gap-1">
          {/* "POKÉ" en cyan */}
          <h1
            className="font-orbitron font-bold leading-none select-none"
            style={{
              fontSize: 'clamp(3.5rem, 12vw, 8rem)',
              color: '#00f5ff',
              textShadow:
                '0 0 20px rgba(0,245,255,0.9), 0 0 60px rgba(0,245,255,0.5), 0 0 100px rgba(0,245,255,0.2)',
              letterSpacing: '0.05em',
            }}
          >
            POKÉ
          </h1>
          {/* "GAME" en magenta décalé */}
          <h1
            className="font-orbitron font-bold leading-none select-none"
            style={{
              fontSize: 'clamp(3.5rem, 12vw, 8rem)',
              color: '#ff00e5',
              textShadow:
                '0 0 20px rgba(255,0,229,0.9), 0 0 60px rgba(255,0,229,0.5), 0 0 100px rgba(255,0,229,0.2)',
              letterSpacing: '0.15em',
              marginTop: '-0.1em',
            }}
          >
            GAME
          </h1>
        </motion.div>

        {/* Sous-titre */}
        <motion.p
          variants={itemVariants}
          className="font-rajdhani text-xl md:text-2xl max-w-lg"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          Affronte tes amis dans des quiz Pokémon épiques.
          <br />
          <span style={{ color: '#00f5ff' }}>Qui sera le meilleur dresseur ?</span>
        </motion.p>

        {/* Séparateur néon */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-4 w-full max-w-xs"
        >
          <div
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(0,245,255,0.5))',
            }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#00f5ff',
              boxShadow: '0 0 8px #00f5ff',
            }}
          />
          <div
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(to left, transparent, rgba(0,245,255,0.5))',
            }}
          />
        </motion.div>

        {/* Profil joueur ou CTA onboarding */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
          {playerId ? (
            <>
              <PlayerCard />
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="btn-primary text-base px-10 py-4" onClick={() => navigate('/lobby')}>
                  Jouer
                </button>
                <Link to="/pokedex" className="btn-secondary text-base px-10 py-4">
                  Voir le Pokédex →
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/learn"
                  className="font-orbitron font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-center"
                  style={{
                    background: 'rgba(255,0,229,0.08)',
                    border: '1px solid rgba(255,0,229,0.3)',
                    color: '#ff00e5',
                    boxShadow: '0 0 10px rgba(255,0,229,0.15)',
                  }}
                >
                  Mode Apprentissage
                </Link>
                <Link
                  to="/leaderboard"
                  className="font-orbitron font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-center"
                  style={{
                    background: 'rgba(255,242,0,0.08)',
                    border: '1px solid rgba(255,242,0,0.3)',
                    color: '#fff200',
                    boxShadow: '0 0 10px rgba(255,242,0,0.15)',
                  }}
                >
                  🏆 Leaderboard
                </Link>
                <Link
                  to="/profile"
                  className="font-orbitron font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-center"
                  style={{
                    background: 'rgba(0,255,136,0.08)',
                    border: '1px solid rgba(0,255,136,0.3)',
                    color: '#00ff88',
                    boxShadow: '0 0 10px rgba(0,255,136,0.15)',
                  }}
                >
                  👤 Mon profil
                </Link>
              </div>
            </>
          ) : (
            <button
              className="btn-primary text-base px-12 py-4"
              onClick={() => navigate('/onboarding')}
            >
              Commencer →
            </button>
          )}
        </motion.div>

        {/* Stats déco */}
        <motion.div
          variants={itemVariants}
          className="glass-card neon-border-cyan flex gap-8 px-8 py-4"
        >
          {[
            { label: 'Pokémon', value: '1025', color: '#00f5ff' },
            { label: 'Questions', value: '500+', color: '#ff00e5' },
            { label: 'Joueurs', value: '∞', color: '#00ff88' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span
                className="font-orbitron font-bold text-2xl"
                style={{ color, textShadow: `0 0 12px ${color}` }}
              >
                {value}
              </span>
              <span
                className="font-rajdhani text-xs uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Halo de lumière central derrière le titre */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse-glow"
        style={{
          width: '60vw',
          height: '60vw',
          maxWidth: '700px',
          maxHeight: '700px',
          background:
            'radial-gradient(circle, rgba(176,38,255,0.12) 0%, rgba(0,245,255,0.06) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  )
}
