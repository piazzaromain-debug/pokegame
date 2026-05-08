import { Link, useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../../store/playerStore'
import { useSettingsStore } from '../../store/settingsStore'

export function Header() {
  const { pseudo, avatarPokemonId, playerId, clearPlayer } = usePlayerStore()
  const { muted, toggleMuted } = useSettingsStore()
  const navigate = useNavigate()

  const spriteUrl = avatarPokemonId
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${avatarPokemonId}.png`
    : null

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-white/10 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-orbitron font-bold text-lg">
          <span className="text-neon-cyan" style={{ textShadow: '0 0 10px rgba(0,245,255,0.6)' }}>POKÉ</span>
          <span className="text-neon-magenta" style={{ textShadow: '0 0 10px rgba(255,0,229,0.6)' }}>GAME</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-rajdhani font-semibold">
          <Link to="/lobby" className="text-white/70 hover:text-neon-cyan transition-colors">Lobby</Link>
          <Link to="/leaderboard" className="text-white/70 hover:text-neon-yellow transition-colors">Leaderboard</Link>
          <Link to="/pokedex" className="text-white/70 hover:text-neon-magenta transition-colors">Pokédex</Link>
        </nav>

        {/* Right: mute + profil */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMuted}
            className="text-white/50 hover:text-white transition-colors text-lg"
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? '🔇' : '🔊'}
          </button>

          {playerId && (
            <Link to="/profile" className="flex items-center gap-2 glass-card px-3 py-1 border border-neon-cyan/20 hover:border-neon-cyan/60 transition-all">
              {spriteUrl && (
                <img src={spriteUrl} alt={pseudo ?? ''} className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
              )}
              <span className="text-sm font-orbitron text-neon-cyan hidden sm:block">{pseudo}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
