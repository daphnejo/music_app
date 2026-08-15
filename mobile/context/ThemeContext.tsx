import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from '@/theme/colors';
import { getThemePreference, setThemePreference, type ThemePreference } from '@/services/app/preferences';

type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  colors: ThemeColors;
  setPreference: (value: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let mounted = true;
    void getThemePreference().then((value) => {
      if (mounted) setPreferenceState(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const resolvedTheme: ResolvedTheme = preference === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : preference;

  const setPreference = useCallback(async (value: ThemePreference) => {
    setPreferenceState(value);
    await setThemePreference(value);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    colors: resolvedTheme === 'dark' ? darkColors : lightColors,
    setPreference,
  }), [preference, resolvedTheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
