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
  background: '#F7F7FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F2F8',
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  text: '#17172A',
  muted: '#74748A',
  border: '#E5E7F2',
  input: '#FAFAFE',
  tabInactive: '#9595AA',
  success: '#2DAA74',
  successSurface: '#EAF8F2',
  danger: '#C2415D',
  dangerSurface: '#FFF0F4',
  warning: '#B7791F',
  warningSurface: '#FFF8E8',
};

export const darkColors: ThemeColors = {
  background: '#0E0F17',
  surface: '#171925',
  surfaceAlt: '#1E2130',
  primary: '#818CF8',
  primarySoft: '#23263A',
  text: '#F5F5FA',
  muted: '#A3A6B8',
  border: '#2B2E40',
  input: '#13151F',
  tabInactive: '#7D8196',
  success: '#4DD6A0',
  successSurface: '#153027',
  danger: '#FF7792',
  dangerSurface: '#301820',
  warning: '#F3BE62',
  warningSurface: '#302817',
};

// Temporary light fallback for code that has not mounted inside ThemeProvider yet.
// UI components should use useTheme().colors so they react to theme changes.
export const colors = lightColors;
