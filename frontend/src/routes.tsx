import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
// Les autres pages seront ajoutées au fur et à mesure

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
