import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ONBOARDING_SEEN_KEY = 'solfedjio.onboardingSeen.v1';

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function webStorage(): WebStorage | undefined {
  return (globalThis as unknown as { localStorage?: WebStorage }).localStorage;
}

export async function hasSeenOnboarding(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      return webStorage()?.getItem(ONBOARDING_SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }

  try {
    return (await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      webStorage()?.setItem(ONBOARDING_SEEN_KEY, '1');
    } catch {
      // Web storage can be unavailable in private/restricted contexts.
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, '1');
  } catch {
    // A storage failure should not block navigation to authentication.
  }
}
