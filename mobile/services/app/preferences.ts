import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ONBOARDING_SEEN_KEY = 'solfedjio.onboardingSeen.v1';
const THEME_PREFERENCE_KEY = 'solfedjio.themePreference.v1';

export type ThemePreference = 'system' | 'light' | 'dark';

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function webStorage(): WebStorage | undefined {
  return (globalThis as unknown as { localStorage?: WebStorage }).localStorage;
}

async function readPreference(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return webStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writePreference(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      webStorage()?.setItem(key, value);
    } catch {
      // Web storage can be unavailable in private/restricted contexts.
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Preferences are non-critical; keep the in-memory selection working.
  }
}

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await readPreference(ONBOARDING_SEEN_KEY)) === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  await writePreference(ONBOARDING_SEEN_KEY, '1');
}

export async function getThemePreference(): Promise<ThemePreference> {
  const value = await readPreference(THEME_PREFERENCE_KEY);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export async function setThemePreference(value: ThemePreference): Promise<void> {
  await writePreference(THEME_PREFERENCE_KEY, value);
}
