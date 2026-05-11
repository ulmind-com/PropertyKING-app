export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#DBEAFE',
  primarySoft: 'rgba(37,99,235,0.08)',

  accent: '#F59E0B',
  accentLight: '#FEF3C7',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  bg: '#FFFFFF',
  bgAlt: '#F8FAFC',
  bgDark: '#F1F5F9',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  overlay: 'rgba(15,23,42,0.5)',
  shadow: 'rgba(0,0,0,0.08)',
};

export const FONTS = {
  h1: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  h4: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 14, fontWeight: '400', color: COLORS.textSecondary, lineHeight: 22 },
  bodyBold: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  caption: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  tiny: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  price: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  priceSmall: { fontSize: 18, fontWeight: '700', color: COLORS.text },
};

export const SHADOWS = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 8 },
  primary: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
};

export const SIZES = {
  radius: { sm: 8, md: 12, lg: 16, xl: 20, full: 999 },
  padding: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
};
