import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PokemonDexPage from './pages/PokemonDexPage'
import OnboardingPage from './pages/OnboardingPage'
import LobbyPage from './pages/LobbyPage'
import GameRoomPage from './pages/GameRoomPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/pokedex" element={<PokemonDexPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/game/:gameId" element={<GameRoomPage />} />
    </Routes>
  )
}
