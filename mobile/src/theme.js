// Modern Transit Design Tokens for Edirne Ulaşım (ETUS)
export const theme = {
  colors: {
    // Canvas & Layering
    bg: '#080C14',
    bgElevated: '#0F172A',
    surface: '#141E33',
    surfaceElevated: '#1C2942',
    surfaceHighlight: '#243352',
    inputBg: 'rgba(255, 255, 255, 0.05)',
    
    // Glassmorphism & Hairlines
    glass: 'rgba(15, 23, 42, 0.92)',
    glassBg: 'rgba(15, 23, 42, 0.92)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.07)',
    hairline: 'rgba(255, 255, 255, 0.07)',
    
    // Typography Hierarchy
    textPrimary: '#FFFFFF',
    textMain: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textTertiary: '#64748B',
    textDim: '#475569',
    
    // Controlled Accents: Studio Violet & Lavender
    violet: '#8B5CF6',
    violetDark: '#6D28D9',
    lavender: '#C4B5FD',
    lavenderLight: 'rgba(139, 92, 246, 0.16)',
    
    // Functional Transit Accents
    primary: '#0084FF',
    primaryGlow: '#00D2FF',
    primaryLight: 'rgba(0, 132, 255, 0.15)',
    
    emerald: '#10B981',
    emeraldLight: 'rgba(16, 185, 129, 0.15)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    
    amber: '#F59E0B',
    amberLight: 'rgba(245, 158, 11, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    
    rose: '#F43F5E',
    roseLight: 'rgba(244, 63, 94, 0.15)',
    danger: '#F43F5E',
    dangerLight: 'rgba(244, 63, 94, 0.15)',
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 9999,
  },
  shadows: {
    floating: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    }
  }
};
