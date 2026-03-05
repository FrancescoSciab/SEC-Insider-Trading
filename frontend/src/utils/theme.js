// SEC Insider Tracker — Design System
// Dark financial terminal aesthetic: deep navy + electric green + amber alerts

export const Colors = {
  // Backgrounds
  bg: '#0A0E1A',           // Deep navy — main background
  bgCard: '#111827',       // Card background
  bgElevated: '#1A2235',   // Elevated surface
  bgInput: '#0F1929',      // Input field background
  border: '#1E2D45',       // Subtle border

  // Brand
  primary: '#00E5A0',      // Electric mint — primary action
  primaryDim: '#00C882',   // Slightly dimmer primary
  primaryFaint: 'rgba(0, 229, 160, 0.1)', // Very faint primary tint

  // Semantic
  buy: '#00E5A0',          // Buy / acquire = green
  sell: '#FF4D6A',         // Sell / dispose = red
  sellDim: '#CC3D55',
  sellFaint: 'rgba(255, 77, 106, 0.1)',
  neutral: '#F59E0B',      // Neutral / award = amber
  neutralFaint: 'rgba(245, 158, 11, 0.1)',

  // Text
  text: '#F0F4FF',         // Primary text
  textSub: '#8A9BBF',      // Secondary/subtle text
  textMuted: '#4A5A7A',    // Very muted
  textOnPrimary: '#0A0E1A',

  // Status
  warning: '#F59E0B',
  error: '#FF4D6A',
  success: '#00E5A0',
  info: '#3B82F6',
};

export const Typography = {
  // Font families (uses system fonts — Expo loads these natively)
  mono: 'SpaceMono', // for numbers/tickers
  sans: 'System',

  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  hero: 38,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: {
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Transaction code → display info
export const TX_CODE_META = {
  P: { label: 'Purchase', color: '#00E5A0', bg: 'rgba(0,229,160,0.1)', icon: 'trending-up' },
  S: { label: 'Sale', color: '#FF4D6A', bg: 'rgba(255,77,106,0.1)', icon: 'trending-down' },
  A: { label: 'Award', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: 'gift' },
  M: { label: 'Option Exercise', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: 'layers' },
  F: { label: 'Tax Withholding', color: '#8A9BBF', bg: 'rgba(138,155,191,0.1)', icon: 'minus' },
  G: { label: 'Gift', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', icon: 'heart' },
  D: { label: 'Returned to Company', color: '#FF4D6A', bg: 'rgba(255,77,106,0.1)', icon: 'corner-down-left' },
  X: { label: 'Option Exercise', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: 'layers' },
};

export function getTxMeta(code) {
  return TX_CODE_META[code] || { label: code || 'Other', color: '#8A9BBF', bg: 'rgba(138,155,191,0.1)', icon: 'activity' };
}
