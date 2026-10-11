// 2026 Next-Gen Transit Mobile Design System (Edirne Ulaşım - ETUS)
export const theme = {
  colors: {
    // Deep Obsidian & Midnight Surfaces
    bg: '#080C14',
    bgSecondary: '#0E1422',
    sheetBg: '#121929',
    surface: '#172033',
    surfaceElevated: '#1E2940',
    surfacePressed: '#263450',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    
    // Glassmorphism & Translucent Overlays
    glassBg: 'rgba(18, 25, 41, 0.88)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    hairline: 'rgba(255, 255, 255, 0.06)',
    
    // High-Contrast Typography Hierarchy
    textMain: '#FFFFFF',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textDim: '#475569',
    
    // Vibrant Transit Accents
    primary: '#0084FF',
    primaryGlow: '#00D2FF',
    primaryLight: 'rgba(0, 132, 255, 0.16)',
    
    success: '#00E676',
    successLight: 'rgba(0, 230, 118, 0.14)',
    
    warning: '#FF9100',
    warningLight: 'rgba(255, 145, 0, 0.14)',
    
    danger: '#FF3366',
    dangerLight: 'rgba(255, 51, 102, 0.14)',
    
    accentPurple: '#7C4DFF',
    accentPurpleLight: 'rgba(124, 77, 255, 0.14)',
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
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
