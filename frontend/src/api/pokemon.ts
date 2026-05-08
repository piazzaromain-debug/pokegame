import { useQuery } from '@tanstack/react-query'
import type { Pokemon } from '../types/pokemon'

const API_BASE = '/api'

export async function fetchPokemonList(): Promise<Pokemon[]> {
  const res = await fetch(`${API_BASE}/pokemon`)
  if (!res.ok) throw new Error('Erreur chargement Pokémon')
  return res.json()
}

export function usePokemonList() {
  return useQuery({
    queryKey: ['pokemon'],
    queryFn: fetchPokemonList,
    staleTime: Infinity, // Les 151 ne changent jamais
  })
}
