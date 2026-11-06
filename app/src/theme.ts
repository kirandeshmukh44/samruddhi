// app/src/theme.ts
// Design tokens for BiLU ERP by Pravara Infotech matching the official brand identity.
// Enhanced with premium translucent Glassmorphism styling and dark mode tokens.

export const colors = {
  primary: '#1D4ED8', // BiLU Vibrant Royal Blue
  primaryElectric: '#0284FE', // BiLU Electric Blue
  primaryDark: '#0B132B', // BiLU Deep Navy
  sidebar: '#0B132B', // BiLU Modern Dark Navy Sidebar
  sidebarActive: '#1D4ED8',
  secondary: '#7C3AED', // BiLU Royal Purple (from ERP badge & gradient)
  accent: '#8B5CF6', // BiLU Violet
  accentAmber: '#F59E0B', // BiLU Accent Amber (Action Buttons / FAB)
  cyanSwoosh: '#0EA5E9', // BiLU Cyan Swoosh
  bg: '#F4F6FA',
  card: '#FFFFFF',
  white: '#FFFFFF',
  border: '#E2E8F0',
  inputBorder: '#CBD5E1',
  text: '#0F172A',
  muted: '#64748B',
  success: '#16A34A',
  danger: '#DC2626',
};

export const darkColors = {
  primary: '#3B82F6',
  primaryElectric: '#60A5FA',
  primaryDark: '#050B1A',
  sidebar: '#070D1F',
  sidebarActive: '#2563EB',
  secondary: '#8B5CF6',
  accent: '#A78BFA',
  accentAmber: '#F59E0B',
  cyanSwoosh: '#38BDF8',
  bg: '#0B132B',
  card: '#1E293B',
  white: '#F8FAFC',
  border: '#334155',
  inputBorder: '#475569',
  text: '#F8FAFC',
  muted: '#94A3B8',
  success: '#22C55E',
  danger: '#EF4444',
};

export const glass = {
  // Translucent acrylic surfaces
  cardBg: 'rgba(255, 255, 255, 0.85)',
  cardBgSubtle: 'rgba(255, 255, 255, 0.65)',
  cardBorder: 'rgba(255, 255, 255, 0.70)',
  cardBorderSubtle: 'rgba(226, 232, 240, 0.65)',

  // Header & Brand
  headerGradientStart: '#1D4ED8',
  headerGradientEnd: '#2563EB',
  headerChipBg: 'rgba(255, 255, 255, 0.18)',
  headerChipBorder: 'rgba(255, 255, 255, 0.32)',
  headerPillBg: 'rgba(255, 255, 255, 0.95)',

  // Bottom Navigation Bar
  tabBarBg: 'rgba(255, 255, 255, 0.88)',
  tabBarBorder: 'rgba(255, 255, 255, 0.75)',
  tabBarActivePill: 'rgba(29, 78, 216, 0.09)',

  // Floating Action Button
  fabGradientStart: '#F59E0B',
  fabGradientEnd: '#EA580C',
  fabBorder: 'rgba(255, 255, 255, 0.40)',

  // Brand Accents & Glows
  purpleGlow: 'rgba(124, 58, 237, 0.20)',
  blueGlow: 'rgba(29, 78, 216, 0.18)',
  amberGlow: 'rgba(245, 158, 11, 0.25)',

  // Dark Mode Glass
  darkCardBg: 'rgba(30, 41, 59, 0.78)',
  darkCardBorder: 'rgba(255, 255, 255, 0.12)',
  darkTabBarBg: 'rgba(15, 23, 42, 0.88)',
  darkTabBarBorder: 'rgba(51, 65, 85, 0.60)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 6,
  input: 10,
  md: 10,
  card: 16,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const fontSizes = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 24,
  header: 28,
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  glassCard: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  glassFloating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 22,
    elevation: 6,
  },
  button: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  fabGlow: {
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  royalGlow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const theme = { colors, darkColors, glass, spacing, radii, fontSizes, shadows, fonts };
export default theme;
