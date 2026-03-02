import { create } from 'zustand';
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'pulse_theme_mode';

const Storage =
  Platform.OS === 'web'
    ? {
        getItemAsync: async (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItemAsync: async (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch {}
        },
      }
    : require('expo-secure-store');

interface ThemeState {
  mode: ThemeMode;
  isLoaded: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  restore: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isLoaded: false,

  setMode: (mode) => {
    set({ mode });
    Storage.setItemAsync(THEME_KEY, mode);
  },

  toggle: () => {
    const current = get().mode;
    const next: ThemeMode =
      current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    get().setMode(next);
  },

  restore: async () => {
    const saved = await Storage.getItemAsync(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      set({ mode: saved, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  },
}));
