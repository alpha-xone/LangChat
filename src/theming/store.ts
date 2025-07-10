import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import React from 'react';

// Theme types
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
  borderLight: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  shadow: string;
  overlay: string;
}

export interface ThemeFonts {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  light: string;
}

export interface ThemeSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface Theme {
  colors: ThemeColors;
  fonts: ThemeFonts;
  fontSizes: ThemeSizes;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  isDark: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

// Default themes
export const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    primaryDark: '#0056CC',
    primaryLight: '#4DA3FF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    surfaceVariant: '#E5E5EA',
    text: '#000000',
    textSecondary: '#8E8E93',
    textDisabled: '#C7C7CC',
    border: '#C6C6C8',
    borderLight: '#E5E5EA',
    error: '#FF3B30',
    errorLight: '#FF6B60',
    success: '#34C759',
    successLight: '#4CD964',
    warning: '#FF9500',
    warningLight: '#FFB340',
    info: '#5AC8FA',
    infoLight: '#7ED4FC',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    light: 'System',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  isDark: false,
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#0A84FF',
    primaryDark: '#0056CC',
    primaryLight: '#4DA3FF',
    secondary: '#5856D6',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textDisabled: '#48484A',
    border: '#38383A',
    borderLight: '#48484A',
    error: '#FF453A',
    errorLight: '#FF6B60',
    success: '#30D158',
    successLight: '#4CD964',
    warning: '#FF9F0A',
    warningLight: '#FFB340',
    info: '#64D2FF',
    infoLight: '#7ED4FC',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  isDark: true,
};

// Theme store interface
interface ThemeStore {
  mode: ThemeMode;
  theme: Theme;
  customThemes: Record<string, Theme>;
  setMode: (mode: ThemeMode) => void;
  setCustomTheme: (name: string, theme: Theme) => void;
  useCustomTheme: (name: string) => void;
  resetToDefault: () => void;
}

// Create theme store
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      theme: resolveTheme('system', {}), // Resolve initial system theme
      customThemes: {},

      setMode: (mode: ThemeMode) => {
        const resolvedTheme = resolveTheme(mode, get().customThemes);
        console.log('Setting theme mode:', mode, 'resolved to:', resolvedTheme.isDark ? 'dark' : 'light');
        set({ mode, theme: resolvedTheme });
      },

      setCustomTheme: (name: string, theme: Theme) => {
        set((state) => ({
          customThemes: {
            ...state.customThemes,
            [name]: theme,
          },
        }));
      },

      useCustomTheme: (name: string) => {
        const customTheme = get().customThemes[name];
        if (customTheme) {
          set({ theme: customTheme });
        }
      },

      resetToDefault: () => {
        const mode = get().mode;
        const resolvedTheme = resolveTheme(mode, {});
        set({ theme: resolvedTheme, customThemes: {} });
      },
    }),
    {
      name: 'langchat-theme-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
        customThemes: state.customThemes,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, ensure system theme is properly resolved
        if (state?.mode === 'system') {
          const resolvedTheme = resolveTheme('system', state.customThemes);
          console.log('Rehydrating system theme:', resolvedTheme.isDark ? 'dark' : 'light');
          state.theme = resolvedTheme;
        }
      },
    }
  )
);

// Helper function to resolve theme based on mode
export function resolveTheme(mode: ThemeMode, _customThemes: Record<string, Theme>): Theme {
  if (mode === 'system') {
    const colorScheme = Appearance.getColorScheme();
    const resolvedTheme = colorScheme === 'dark' ? darkTheme : lightTheme;
    console.log(`[Theme] System mode resolved: colorScheme=${colorScheme}, isDark=${resolvedTheme.isDark}`);
    return resolvedTheme;
  }
  const resolvedTheme = mode === 'dark' ? darkTheme : lightTheme;
  console.log(`[Theme] Mode resolved: mode=${mode}, isDark=${resolvedTheme.isDark}`);
  return resolvedTheme;
}

// Create a simple ThemeProvider that doesn't need React Context
// The Zustand store handles all state management
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};
