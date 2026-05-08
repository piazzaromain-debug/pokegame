import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PokemonDexPage from './pages/PokemonDexPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pokedex" element={<PokemonDexPage />} />
    </Routes>
  )
}
