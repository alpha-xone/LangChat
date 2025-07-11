import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore, type Theme, type ThemeMode } from './store';

export interface UseAppThemeReturn {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  isUsingCustomTheme: boolean;
  activeCustomTheme: string | null;
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
    isUsingCustomTheme,
    activeCustomTheme,
    setMode,
    setCustomTheme,
    useCustomTheme,
    resetToDefault,
    forceSystemThemeUpdate,
  } = useThemeStore();

  // Ensure theme is properly initialized on app start
  useEffect(() => {
    // Always do an initial system theme check when the hook first mounts
    const currentSystemScheme = Appearance.getColorScheme();
    console.log('[useAppTheme] Initial system appearance:', currentSystemScheme, 'mode:', mode);

    if (mode === 'system') {
      // Force an update to ensure we have the correct system theme
      forceSystemThemeUpdate();
    }
  }, []); // Run only once on mount

  // Update theme when system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('[useAppTheme] System appearance changed to:', colorScheme, 'current mode:', mode);
      if (mode === 'system') {
        // Use the new force update function to properly handle system theme changes
        console.log('[useAppTheme] Triggering system theme update');
        forceSystemThemeUpdate();
      }
    });

    return () => subscription?.remove();
  }, [mode, forceSystemThemeUpdate]);

  // Toggle function for convenient light/dark switching
  const toggleTheme = () => {
    const newMode = theme.isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  return {
    theme,
    mode,
    isDark: theme.isDark,
    isUsingCustomTheme,
    activeCustomTheme,
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
