import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';
import { defaultThemes, type ThemeMode } from './themes';

interface ThemeStore {
  currentTheme: Theme;
  themeMode: ThemeMode;
  customThemes: Record<string, Theme>;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomTheme: (name: string, theme: Theme) => void;
  setActiveTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: defaultThemes.light,
      themeMode: 'system',
      customThemes: {},

      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });

        // Update current theme based on mode
        const { customThemes } = get();
        let newTheme: Theme;

        if (mode === 'system') {
          // In a real app, you'd check system preference here
          // For now, default to light
          newTheme = defaultThemes.light;
        } else {
          newTheme = customThemes[mode] || defaultThemes[mode];
        }

        set({ currentTheme: newTheme });
      },

      setCustomTheme: (name: string, theme: Theme) => {
        set((state) => ({
          customThemes: {
            ...state.customThemes,
            [name]: theme,
          },
        }));
      },

      setActiveTheme: (theme: Theme) => {
        set({ currentTheme: theme });
      },
    }),
    {
      name: 'chat-theme-storage',
    }
  )
);
