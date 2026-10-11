// Central Design Tokens for ETUS Edirne Toplu Taşıma
// Strictly adhering to: Dark-first, Minimal, Apple Maps + Linear inspired hierarchy

export const theme = {
  colors: {
    // 1. Charcoal & Deep Dark Base
    bg: '#090B0F',
    surface: '#11151B',
    surfaceElevated: '#171D25',
    surfaceHover: '#1E2530',
    border: '#252C36',
    borderSubtle: '#1B222B',
    hairline: '#1E2530',
    inputBg: '#171D25',

    // 2. Controlled Typography Hierarchy
    textPrimary: '#F3F4F6',
    textSecondary: '#9AA3AF',
    textMuted: '#687281',
    textDim: '#4B5563',

    // 3. Functional Transit Accents (Controlled & Purposeful)
    // Primary Accent: Active lines, live transit, GPS, start stops
    primary: '#24C795',
    primaryLight: 'rgba(36, 199, 149, 0.12)',
    emerald: '#24C795',
    emeraldLight: 'rgba(36, 199, 149, 0.12)',

    // Secondary Accent: Selected route, lines highlight
    secondary: '#9275F5',
    secondaryLight: 'rgba(146, 117, 245, 0.14)',
    violet: '#9275F5',
    violetDark: '#7958E8',
    lavender: '#9275F5',
    lavenderLight: 'rgba(146, 117, 245, 0.14)',

    // Fare Accent: Tariffs, wallet, transfer fees
    fare: '#F0B35A',
    fareLight: 'rgba(240, 179, 90, 0.12)',
    amber: '#F0B35A',
    amberLight: 'rgba(240, 179, 90, 0.12)',

    // Error & Alight Nodes
    error: '#F06470',
    errorLight: 'rgba(240, 100, 112, 0.12)',
    rose: '#F06470',
    roseLight: 'rgba(240, 100, 112, 0.12)',
  },

  // 4. Controlled Geometric Radius (10-14px system standard)
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },

  // 5. Spacing Scale (4 / 8pt standard)
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // 6. Typography Scale
  typography: {
    caption: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },
    bodySm: { fontSize: 13, fontWeight: '400', letterSpacing: -0.1 },
    body: { fontSize: 14, fontWeight: '400', letterSpacing: -0.15 },
    bodyMedium: { fontSize: 14, fontWeight: '600', letterSpacing: -0.15 },
    titleSm: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
    title: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
    headline: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
    metric: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  },

  // 7. Subtle Layering Elevation (Border-first, low shadow noise)
  shadows: {
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 4,
    },
    floating: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
