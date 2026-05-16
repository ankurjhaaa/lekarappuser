// Theme constants — Lekar Red + White premium UI (matching Figma design)
export const COLORS = {
  primary: '#D32F2F',        // Lekar Deep Red
  primaryDark: '#B71C1C',
  primaryLight: '#FFCDD2',
  secondary: '#1D3557',
  accent: '#F7C937',
  accentYellow: '#F7C937',
  
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  darkGray: '#4FC1E1',
  gray: '#4F6F8A',
  
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  textMuted: '#CED4DA',
  
  success: '#06B847',
  successGreen: '#06B847',
  warning: '#FFD166',
  error: '#EF476F',
  info: '#118AB2',
  
  border: '#E9ECEF',
  divider: '#DEE2E6',
  overlay: 'rgba(0,0,0,0.5)',
  
  card: '#FFFFFF',
  inputBg: '#F1F3F5',
  
  mapOverlay: 'rgba(211, 47, 47, 0.1)',
  
  // Lekar brand specific
  headerRed: '#D32F2F',
  lightGray: '#F0F0FA',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Spacing
  paddingSm: 8,
  padding: 16,
  paddingLg: 24,
  paddingXl: 32,
  
  // Border radius (rounded corners 18px from style guide)
  radiusSm: 8,
  radius: 12,
  radiusLg: 16,
  radiusXl: 18,   // Lekar standard
  radiusFull: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};
