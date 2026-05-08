import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PokemonDexPage from './pages/PokemonDexPage'
import OnboardingPage from './pages/OnboardingPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/pokedex" element={<PokemonDexPage />} />
    </Routes>
  )
}
