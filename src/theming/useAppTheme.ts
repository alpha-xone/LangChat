import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore, type Theme, type ThemeMode } from './store';

export interface UseAppThemeReturn {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setCustomTheme: (name: string, theme: Theme) => void;
  useCustomTheme: (name: string) => void;
  resetToDefault: () => void;
  colors: Theme['colors'];
  fonts: Theme['fonts'];
  fontSizes: Theme['fontSizes'];
  spacing: Theme['spacing'];
  borderRadius: Theme['borderRadius'];
}

/**
 * Custom hook for accessing and managing theme state
 * This hook provides the complete theming API without using React Context
 */
export const useAppTheme = (): UseAppThemeReturn => {
  const {
    mode,
    theme,
    setMode,
    setCustomTheme,
    useCustomTheme,
    resetToDefault,
  } = useThemeStore();

  // Ensure theme is properly initialized on app start
  useEffect(() => {
    if (mode === 'system') {
      // Re-resolve the system theme on initialization
      setMode('system');
    }
  }, []); // Run only once on mount

  // Update theme when system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('[useAppTheme] Appearance changed to:', colorScheme, 'current mode:', mode);
      if (mode === 'system') {
        // Small delay to ensure the system has updated
        setTimeout(() => {
          console.log('[useAppTheme] Triggering system theme re-resolution');
          setMode('system');
        }, 100);
      }
    });

    return () => subscription?.remove();
  }, [mode, setMode]);

  // Toggle function for convenient light/dark switching
  const toggleTheme = () => {
    const newMode = theme.isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  return {
    theme,
    mode,
    isDark: theme.isDark,
    setMode,
    toggleTheme,
    setCustomTheme,
    useCustomTheme,
    resetToDefault,
    // Convenience accessors for common theme properties
    colors: theme.colors,
    fonts: theme.fonts,
    fontSizes: theme.fontSizes,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
  };
};

/**
 * Hook for components that only need theme colors
 */
export const useThemeColors = () => {
  const theme = useThemeStore((state: any) => state.theme);
  return theme.colors;
};

/**
 * Hook for components that only need theme fonts
 */
export const useThemeFonts = () => {
  const theme = useThemeStore((state: any) => state.theme);
  return theme.fonts;
};

/**
 * Hook for components that only need theme spacing
 */
export const useThemeSpacing = () => {
  const theme = useThemeStore((state: any) => state.theme);
  return theme.spacing;
};

/**
 * Hook for checking if current theme is dark
 */
export const useIsDarkTheme = () => {
  const theme = useThemeStore((state: any) => state.theme);
  return theme.isDark;
};
