import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PokemonDexPage from './pages/PokemonDexPage'
import LearningModePage from './pages/LearningModePage'
import OnboardingPage from './pages/OnboardingPage'
import LobbyPage from './pages/LobbyPage'
import GameRoomPage from './pages/GameRoomPage'
import GamePlayPage from './pages/GamePlayPage'
import ResultsPage from './pages/ResultsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/pokedex" element={<PokemonDexPage />} />
      <Route path="/learn" element={<LearningModePage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/game/:gameId" element={<GameRoomPage />} />
      <Route path="/game/:gameId/play" element={<GamePlayPage />} />
      <Route path="/game/:gameId/results" element={<ResultsPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:playerId" element={<ProfilePage />} />
    </Routes>
  )
}
