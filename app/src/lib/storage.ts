// app/src/lib/storage.ts
import { Platform, NativeModules } from 'react-native';

const memoryStore: Record<string, string> = {};

function hasNativeAsyncStorage(): boolean {
  if (Platform.OS === 'web') return false;
  return Boolean(
    NativeModules?.RNCAsyncStorage ||
    NativeModules?.PlatformLocalStorage ||
    NativeModules?.RNC_AsyncSQLiteDBStorage
  );
}

export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      if (!hasNativeAsyncStorage()) {
        return memoryStore[key] ?? null;
      }
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const val = await AsyncStorage.getItem(key);
      return val ?? memoryStore[key] ?? null;
    } catch {
      return memoryStore[key] ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStore[key] = value;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (!hasNativeAsyncStorage()) {
        return;
      }
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    } catch {
      // safely preserved in memoryStore
    }
  },

  async removeItem(key: string): Promise<void> {
    delete memoryStore[key];
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      if (!hasNativeAsyncStorage()) {
        return;
      }
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
    } catch {
      // safely deleted from memoryStore
    }
  },
};

export default safeStorage;
