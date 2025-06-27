import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  background: string;
  surface: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  border: string;
  placeholder: string;
  shadow?: string; // Added shadow property
}

export const lightTheme: Theme = {
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#000000',
  primary: '#007AFF',
  secondary: '#5856d6',
  accent: '#ff9500',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#ffcc00',
  border: '#e5e5e5',
  placeholder: '#8e8e93',
  shadow: 'rgba(0, 0, 0, 0.1)', // Example shadow value
};

export const darkTheme: Theme = {
  background: '#000000',
  surface: '#1c1c1e',
  text: '#ffffff',
  primary: '#0A84FF',
  secondary: '#5e5ce6',
  accent: '#ff9f0a',
  error: '#ff453a',
  success: '#32d74b',
  warning: '#ffd60a',
  border: '#38383a',
  placeholder: '#8e8e93',
  shadow: 'rgba(255, 255, 255, 0.1)', // Example shadow value
};

// Utility function to get theme based on mode
export const getThemeByMode = (mode: ThemeMode, systemColorScheme?: 'light' | 'dark' | null): Theme => {
  if (mode === 'system') {
    const currentScheme = systemColorScheme || Appearance.getColorScheme();
    return currentScheme === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Utility function to merge themes
export const mergeTheme = (baseTheme: Theme, overrides: Partial<Theme>): Theme => {
  return { ...baseTheme, ...overrides };
};