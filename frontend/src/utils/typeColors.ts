export const TYPE_COLORS: Record<string, string> = {
  Normal:     'bg-gray-500/20 text-gray-300 border-gray-500/40',
  Feu:        'bg-orange-500/20 text-orange-300 border-orange-500/40',
  Eau:        'bg-blue-500/20 text-blue-300 border-blue-500/40',
  Électrique: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
  Plante:     'bg-green-500/20 text-green-300 border-green-500/40',
  Glace:      'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
  Combat:     'bg-red-700/20 text-red-300 border-red-700/40',
  Poison:     'bg-purple-500/20 text-purple-300 border-purple-500/40',
  Sol:        'bg-amber-600/20 text-amber-300 border-amber-600/40',
  Vol:        'bg-indigo-400/20 text-indigo-200 border-indigo-400/40',
  Psy:        'bg-pink-500/20 text-pink-300 border-pink-500/40',
  Insecte:    'bg-lime-500/20 text-lime-300 border-lime-500/40',
  Roche:      'bg-stone-500/20 text-stone-300 border-stone-500/40',
  Spectre:    'bg-purple-800/20 text-purple-200 border-purple-800/40',
  Dragon:     'bg-violet-600/20 text-violet-300 border-violet-600/40',
  Ténèbres:   'bg-gray-800/20 text-gray-300 border-gray-800/40',
  Acier:      'bg-slate-400/20 text-slate-200 border-slate-400/40',
  Fée:        'bg-pink-300/20 text-pink-200 border-pink-300/40',
}

export function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? 'bg-white/10 text-white/60 border-white/20'
}
