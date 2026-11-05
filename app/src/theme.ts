// app/src/theme.ts
// Design tokens for BiLU ERP by Pravara Infotech matching the official brand identity.

export const colors = {
  primary: '#1D4ED8', // BiLU Vibrant Royal Blue
  primaryElectric: '#0284FE', // BiLU Electric Blue
  primaryDark: '#0B132B', // BiLU Deep Navy
  sidebar: '#0B132B', // BiLU Modern Dark Navy Sidebar
  sidebarActive: '#1D4ED8',
  secondary: '#7C3AED', // BiLU Royal Purple (from ERP badge & gradient)
  accent: '#8B5CF6', // BiLU Violet
  cyanSwoosh: '#0EA5E9', // BiLU Cyan Swoosh
  bg: '#F8FAFC',
  card: '#FFFFFF',
  white: '#FFFFFF',
  border: '#E2E8F0',
  inputBorder: '#CBD5E1',
  text: '#0F172A',
  muted: '#64748B',
  success: '#16A34A',
  danger: '#DC2626',
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
  card: 14,
  lg: 14,
  xl: 20,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const theme = { colors, spacing, radii, fontSizes, shadows, fonts };
export default theme;
