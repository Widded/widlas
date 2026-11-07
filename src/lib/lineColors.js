// ETUS hatları için harita üzerinde okunabilir, birbirinden ayrışan renk paleti.
// Hat verisindeki ortak renk yerine UI'da bu palet kullanılır.
const LINE_COLORS = {
  '1A': '#E11D48',
  '1F': '#F97316',
  '1G': '#F59E0B',
  '1T': '#84CC16',
  '2A': '#22C55E',
  '2B': '#10B981',
  '3': '#06B6D4',
  '3A': '#0EA5E9',
  '3AYM': '#3B82F6',
  '3C': '#6366F1',
  '4': '#8B5CF6',
  '4A': '#A855F7',
  '5': '#D946EF',
  '5A': '#EC4899',
  '5B': '#F43F5E',
  '6': '#14B8A6',
  '6A': '#0D9488',
  '6B': '#059669',
  '7': '#65A30D',
  '7A': '#CA8A04',
  '7E': '#EA580C',
  '8': '#DC2626',
  'K1': '#475569'
};

export const getLineColor = (code, fallback = '#0D9488') =>
  LINE_COLORS[code] || fallback || '#0D9488';
