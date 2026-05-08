import { useQuery } from '@tanstack/react-query'

export interface AchievementData {
  code: string
  name_fr: string
  description_fr: string
  icon_emoji: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export async function fetchAllAchievements(): Promise<AchievementData[]> {
  const res = await fetch('/api/achievements')
  if (!res.ok) throw new Error('Erreur achievements')
  return res.json()
}

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAllAchievements,
    staleTime: Infinity,
  })
}
