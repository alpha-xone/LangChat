import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Theme } from '../types';
import { defaultThemes, type ThemeMode, type ThemeName, getThemeForMode, createCustomTheme, validateTheme } from './themes';

interface ThemeStore {
  currentTheme: Theme;
  themeMode: ThemeMode;
  customThemes: Record<string, Theme>;
  activeThemeName: ThemeName | string;
  systemTheme: 'light' | 'dark';

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setCustomTheme: (name: string, theme: Theme) => void;
  setActiveTheme: (theme: Theme) => void;
  setActiveThemeByName: (name: ThemeName | string) => void;
  deleteCustomTheme: (name: string) => void;
  resetToDefault: () => void;
  importTheme: (themeData: string) => Promise<boolean>;
  exportTheme: (name: string) => string | null;

  // Getters
  getTheme: (name: string) => Theme | null;
  getAllThemes: () => Record<string, Theme>;
  isCustomTheme: (name: string) => boolean;

  // System theme detection
  updateSystemTheme: (systemTheme: 'light' | 'dark') => void;
}

// Create async storage adapter for React Native
const asyncStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to AsyncStorage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
  },
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: defaultThemes.light,
      themeMode: 'system',
      customThemes: {},
      activeThemeName: 'light',
      systemTheme: 'light',

      setThemeMode: (mode: ThemeMode) => {
        const state = get();
        set({ themeMode: mode });

        // Update current theme based on mode
        let newTheme: Theme;
        let newThemeName: string;

        if (mode === 'system') {
          newTheme = defaultThemes[state.systemTheme];
          newThemeName = state.systemTheme;
        } else {
          newTheme = state.customThemes[mode] || defaultThemes[mode as ThemeName];
          newThemeName = mode;
        }

        set({
          currentTheme: newTheme,
          activeThemeName: newThemeName,
        });
      },

      setCustomTheme: (name: string, theme: Theme) => {
        const validation = validateTheme(theme);
        if (!validation.isValid) {
          console.warn('Theme validation failed:', validation.errors);
          return;
        }

        set((state) => ({
          customThemes: {
            ...state.customThemes,
            [name]: theme,
          },
        }));
      },

      setActiveTheme: (theme: Theme) => {
        const validation = validateTheme(theme);
        if (!validation.isValid) {
          console.warn('Theme validation failed:', validation.errors);
          return;
        }

        set({
          currentTheme: theme,
          activeThemeName: 'custom',
        });
      },

      setActiveThemeByName: (name: ThemeName | string) => {
        const state = get();
        const theme = state.customThemes[name] || defaultThemes[name as ThemeName];

        if (theme) {
          set({
            currentTheme: theme,
            activeThemeName: name,
          });
        }
      },

      deleteCustomTheme: (name: string) => {
        const state = get();
        if (state.customThemes[name]) {
          const { [name]: deleted, ...remainingThemes } = state.customThemes;
          set({ customThemes: remainingThemes });

          // If deleted theme was active, switch to default
          if (state.activeThemeName === name) {
            set({
              currentTheme: defaultThemes.light,
              activeThemeName: 'light',
            });
          }
        }
      },

      resetToDefault: () => {
        set({
          currentTheme: defaultThemes.light,
          themeMode: 'system',
          customThemes: {},
          activeThemeName: 'light',
        });
      },

      importTheme: async (themeData: string): Promise<boolean> => {
        try {
          const parsed = JSON.parse(themeData);

          if (parsed.theme && parsed.name) {
            const validation = validateTheme(parsed.theme);
            if (validation.isValid) {
              get().setCustomTheme(parsed.name, parsed.theme);
              return true;
            }
          }

          return false;
        } catch (error) {
          console.error('Failed to import theme:', error);
          return false;
        }
      },

      exportTheme: (name: string): string | null => {
        const state = get();
        const theme = state.customThemes[name] || defaultThemes[name as ThemeName];

        if (theme) {
          return JSON.stringify({
            name,
            theme,
            version: '1.0.0',
            exported: new Date().toISOString(),
          });
        }

        return null;
      },

      getTheme: (name: string): Theme | null => {
        const state = get();
        return state.customThemes[name] || defaultThemes[name as ThemeName] || null;
      },

      getAllThemes: (): Record<string, Theme> => {
        const state = get();
        return {
          ...defaultThemes,
          ...state.customThemes,
        };
      },

      isCustomTheme: (name: string): boolean => {
        const state = get();
        return !!state.customThemes[name];
      },

      updateSystemTheme: (systemTheme: 'light' | 'dark') => {
        const state = get();
        set({ systemTheme });

        // Update current theme if in system mode
        if (state.themeMode === 'system') {
          set({
            currentTheme: defaultThemes[systemTheme],
            activeThemeName: systemTheme,
          });
        }
      },
    }),
    {
      name: 'chat-theme-storage',
      storage: asyncStorageAdapter,
      partialize: (state) => ({
        themeMode: state.themeMode,
        customThemes: state.customThemes,
        activeThemeName: state.activeThemeName,
        systemTheme: state.systemTheme,
      }),
    }
  )
);

// Theme utility hooks
export const useCurrentTheme = () => useThemeStore((state) => state.currentTheme);
export const useThemeMode = () => useThemeStore((state) => state.themeMode);
export const useCustomThemes = () => useThemeStore((state) => state.customThemes);
export const useActiveThemeName = () => useThemeStore((state) => state.activeThemeName);

// Theme actions
export const useThemeActions = () => useThemeStore((state) => ({
  setThemeMode: state.setThemeMode,
  setCustomTheme: state.setCustomTheme,
  setActiveTheme: state.setActiveTheme,
  setActiveThemeByName: state.setActiveThemeByName,
  deleteCustomTheme: state.deleteCustomTheme,
  resetToDefault: state.resetToDefault,
  importTheme: state.importTheme,
  exportTheme: state.exportTheme,
  updateSystemTheme: state.updateSystemTheme,
}));

// Theme selectors
export const useThemeSelectors = () => useThemeStore((state) => ({
  getTheme: state.getTheme,
  getAllThemes: state.getAllThemes,
  isCustomTheme: state.isCustomTheme,
}));

// Initialize theme based on system preference
export const initializeTheme = (systemTheme: 'light' | 'dark' = 'light') => {
  const store = useThemeStore.getState();
  store.updateSystemTheme(systemTheme);

  if (store.themeMode === 'system') {
    store.setActiveThemeByName(systemTheme);
  }
};

// Theme presets for quick setup
export const THEME_PRESETS = {
  business: createCustomTheme(defaultThemes.light, {
    colors: {
      primary: '#2563EB',
      secondary: '#7C3AED',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      error: '#DC2626',
      success: '#059669',
      warning: '#D97706',
    },
  }),

  gaming: createCustomTheme(defaultThemes.dark, {
    colors: {
      primary: '#00D9FF',
      secondary: '#FF6B00',
      background: '#0D1117',
      surface: '#161B22',
      text: '#F0F6FC',
      textSecondary: '#8B949E',
      border: '#30363D',
      error: '#F85149',
      success: '#3FB950',
      warning: '#D29922',
    },
  }),

  pastel: createCustomTheme(defaultThemes.light, {
    colors: {
      primary: '#FFB6C1',
      secondary: '#DDA0DD',
      background: '#FFF8DC',
      surface: '#F0F8FF',
      text: '#2F4F4F',
      textSecondary: '#708090',
      border: '#E6E6FA',
      error: '#F08080',
      success: '#98FB98',
      warning: '#FFE4B5',
    },
  }),
} as const;
