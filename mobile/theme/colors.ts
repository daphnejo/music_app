export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primarySoft: string;
  text: string;
  muted: string;
  border: string;
  input: string;
  tabInactive: string;
  success: string;
  successSurface: string;
  danger: string;
  dangerSurface: string;
  warning: string;
  warningSurface: string;
};

export const lightColors: ThemeColors = {
  background: '#FFF9F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F1FF',
  primary: '#6C5CE7',
  primarySoft: '#EEE9FF',
  text: '#28233B',
  muted: '#77718E',
  border: '#EAE3F4',
  input: '#FCFAFF',
  tabInactive: '#9B95AD',
  success: '#24A06B',
  successSurface: '#EAF8F1',
  danger: '#D45169',
  dangerSurface: '#FFF0F3',
  warning: '#C98716',
  warningSurface: '#FFF5D9',
};

export const darkColors: ThemeColors = {
  background: '#12101A',
  surface: '#1C1927',
  surfaceAlt: '#262139',
  primary: '#A99BFF',
  primarySoft: '#302A4A',
  text: '#FAF8FF',
  muted: '#B5AEC8',
  border: '#342F45',
  input: '#181520',
  tabInactive: '#89839B',
  success: '#56D89F',
  successSurface: '#163126',
  danger: '#FF8297',
  dangerSurface: '#351B22',
  warning: '#F4C36A',
  warningSurface: '#352C18',
};

// Temporary light fallback for code that has not mounted inside ThemeProvider yet.
// UI components should use useTheme().colors so they react to theme changes.
export const colors = lightColors;
