import { useThemeStore } from './store';
import type { Theme } from '../types';
import type { ThemeMode } from './themes';

export const useAppTheme = () => {
  const {
    currentTheme,
    themeMode,
    customThemes,
    setThemeMode,
    setCustomTheme,
    setActiveTheme
  } = useThemeStore();

  return {
    theme: currentTheme,
    themeMode,
    customThemes,
    setThemeMode,
    setCustomTheme,
    setActiveTheme,

    // Utility functions
    getThemeColor: (colorKey: keyof Theme['colors']) => currentTheme.colors[colorKey],
    getThemeSpacing: (spacingKey: keyof Theme['spacing']) => currentTheme.spacing[spacingKey],
    getThemeFontSize: (sizeKey: keyof Theme['typography']['fontSize']) => currentTheme.typography.fontSize[sizeKey],
    getThemeBorderRadius: (radiusKey: keyof Theme['borderRadius']) => currentTheme.borderRadius[radiusKey],
  };
};
