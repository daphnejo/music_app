import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'solfedjio.refreshToken.v1';

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function webStorage(): WebStorage | undefined {
  return (globalThis as unknown as { localStorage?: WebStorage }).localStorage;
}

export async function getStoredRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return webStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setStoredRefreshToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const storage = webStorage();
      if (!storage) return;
      if (token) storage.setItem(REFRESH_TOKEN_KEY, token);
      else storage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Web storage can be unavailable in private/restricted contexts.
    }
    return;
  }

  if (token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
