import React, { useCallback, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore, useCurrentTheme, useThemeMode, useThemeActions, useThemeSelectors } from './store';
import { createCustomTheme, validateTheme, isColorAccessible, THEME_CONSTANTS } from './themes';
import type { Theme } from '../types';
import type { ThemeMode, ThemeName } from './themes';

export interface ThemedStyle {
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
}

export interface ThemeUtils {
  // Theme accessors
  getColor: (colorKey: keyof Theme['colors']) => string;
  getSpacing: (spacingKey: keyof Theme['spacing']) => number;
  getFontSize: (sizeKey: keyof Theme['typography']['fontSize']) => number;
  getBorderRadius: (radiusKey: keyof Theme['borderRadius']) => number;
  getFontWeight: (weightKey: keyof Theme['typography']['fontWeight']) => string;
  getFontFamily: () => string;

  // Style generators
  createThemedStyle: (styleConfig: {
    backgroundColor?: keyof Theme['colors'];
    color?: keyof Theme['colors'];
    borderColor?: keyof Theme['colors'];
    borderRadius?: keyof Theme['borderRadius'];
    padding?: keyof Theme['spacing'];
    margin?: keyof Theme['spacing'];
    fontSize?: keyof Theme['typography']['fontSize'];
    fontWeight?: keyof Theme['typography']['fontWeight'];
  }) => ThemedStyle;

  // Color utilities
  isLightTheme: () => boolean;
  isDarkTheme: () => boolean;
  getContrastColor: (backgroundColor: keyof Theme['colors']) => string;

  // Responsive utilities
  scaleSize: (size: number, factor?: number) => number;
  scaleFontSize: (size: keyof Theme['typography']['fontSize'], factor?: number) => number;

  // Animation utilities
  getAnimationDuration: (type?: 'fast' | 'normal' | 'slow') => number;

  // Accessibility utilities
  isAccessible: (foreground: keyof Theme['colors'], background: keyof Theme['colors']) => boolean;

  // Shadow utilities
  getShadowStyle: (elevation: number) => object;
}

export const useAppTheme = () => {
  const theme = useCurrentTheme();
  const themeMode = useThemeMode();
  const actions = useThemeActions();
  const selectors = useThemeSelectors();

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        actions.updateSystemTheme(colorScheme);
      }
    });

    // Initial system theme detection
    const initialTheme = Appearance.getColorScheme();
    if (initialTheme) {
      actions.updateSystemTheme(initialTheme);
    }

    return () => subscription.remove();
  }, [actions]);

  // Memoized theme utilities
  const utils: ThemeUtils = useMemo(() => ({
    getColor: (colorKey: keyof Theme['colors']) => theme.colors[colorKey],
    getSpacing: (spacingKey: keyof Theme['spacing']) => theme.spacing[spacingKey],
    getFontSize: (sizeKey: keyof Theme['typography']['fontSize']) => theme.typography.fontSize[sizeKey],
    getBorderRadius: (radiusKey: keyof Theme['borderRadius']) => theme.borderRadius[radiusKey],
    getFontWeight: (weightKey: keyof Theme['typography']['fontWeight']) => theme.typography.fontWeight[weightKey],
    getFontFamily: () => theme.typography.fontFamily,

    createThemedStyle: (styleConfig) => {
      const style: ThemedStyle = {};

      if (styleConfig.backgroundColor) {
        style.backgroundColor = theme.colors[styleConfig.backgroundColor];
      }
      if (styleConfig.color) {
        style.color = theme.colors[styleConfig.color];
      }
      if (styleConfig.borderColor) {
        style.borderColor = theme.colors[styleConfig.borderColor];
      }
      if (styleConfig.borderRadius) {
        style.borderRadius = theme.borderRadius[styleConfig.borderRadius];
      }
      if (styleConfig.padding) {
        style.padding = theme.spacing[styleConfig.padding];
      }
      if (styleConfig.margin) {
        style.margin = theme.spacing[styleConfig.margin];
      }
      if (styleConfig.fontSize) {
        style.fontSize = theme.typography.fontSize[styleConfig.fontSize];
      }
      if (styleConfig.fontWeight) {
        style.fontWeight = theme.typography.fontWeight[styleConfig.fontWeight];
      }

      return style;
    },

    isLightTheme: () => {
      const bgColor = theme.colors.background;
      // Simple check based on background color brightness
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128;
    },

    isDarkTheme: () => !utils.isLightTheme(),

    getContrastColor: (backgroundColor: keyof Theme['colors']) => {
      const bgColor = theme.colors[backgroundColor];
      const textColor = theme.colors.text;
      const textSecondary = theme.colors.textSecondary;

      return isColorAccessible(textColor, bgColor) ? textColor : textSecondary;
    },

    scaleSize: (size: number, factor: number = 1) => {
      return Math.round(size * factor);
    },

    scaleFontSize: (size: keyof Theme['typography']['fontSize'], factor: number = 1) => {
      return Math.round(theme.typography.fontSize[size] * factor);
    },

    getAnimationDuration: (type: 'fast' | 'normal' | 'slow' = 'normal') => {
      const base = THEME_CONSTANTS.ANIMATION_DURATION;
      switch (type) {
        case 'fast':
          return base * 0.5;
        case 'slow':
          return base * 2;
        default:
          return base;
      }
    },

    isAccessible: (foreground: keyof Theme['colors'], background: keyof Theme['colors']) => {
      return isColorAccessible(theme.colors[foreground], theme.colors[background]);
    },

    getShadowStyle: (elevation: number) => {
      const opacity = THEME_CONSTANTS.SHADOW_OPACITY;
      const shadowColor = utils.isDarkTheme() ? '#FFFFFF' : '#000000';

      return {
        shadowColor,
        shadowOffset: {
          width: 0,
          height: elevation * 0.5,
        },
        shadowOpacity: opacity,
        shadowRadius: elevation,
        elevation, // Android
      };
    },
  }), [theme]);

  // Theme management functions
  const createTheme = useCallback((baseTheme: Theme, overrides: Partial<Theme>) => {
    return createCustomTheme(baseTheme, overrides);
  }, []);

  const saveTheme = useCallback((name: string, theme: Theme) => {
    const validation = validateTheme(theme);
    if (validation.isValid) {
      actions.setCustomTheme(name, theme);
      return true;
    } else {
      console.warn('Theme validation failed:', validation.errors);
      return false;
    }
  }, [actions]);

  const switchTheme = useCallback((name: ThemeName | string) => {
    actions.setActiveThemeByName(name);
  }, [actions]);

  const toggleTheme = useCallback(() => {
    const currentMode = themeMode;
    if (currentMode === 'light') {
      actions.setThemeMode('dark');
    } else if (currentMode === 'dark') {
      actions.setThemeMode('light');
    } else {
      // System mode - toggle to opposite of current system theme
      const systemTheme = Appearance.getColorScheme();
      actions.setThemeMode(systemTheme === 'light' ? 'dark' : 'light');
    }
  }, [themeMode, actions]);

  // Theme presets
  const applyPreset = useCallback((presetName: string) => {
    const allThemes = selectors.getAllThemes();
    const preset = allThemes[presetName];
    if (preset) {
      actions.setActiveTheme(preset);
    }
  }, [selectors, actions]);

  return {
    // Current theme state
    theme,
    themeMode,

    // Theme utilities
    ...utils,

    // Theme management
    createTheme,
    saveTheme,
    switchTheme,
    toggleTheme,
    applyPreset,

    // Theme actions
    setThemeMode: actions.setThemeMode,
    setCustomTheme: actions.setCustomTheme,
    setActiveTheme: actions.setActiveTheme,
    deleteCustomTheme: actions.deleteCustomTheme,
    resetToDefault: actions.resetToDefault,
    importTheme: actions.importTheme,
    exportTheme: actions.exportTheme,

    // Theme selectors
    getTheme: selectors.getTheme,
    getAllThemes: selectors.getAllThemes,
    isCustomTheme: selectors.isCustomTheme,

    // Constants
    constants: THEME_CONSTANTS,
  };
};

// Specialized hooks for specific use cases
export const useThemeColors = () => {
  const theme = useCurrentTheme();
  return theme.colors;
};

export const useThemeSpacing = () => {
  const theme = useCurrentTheme();
  return theme.spacing;
};

export const useThemeTypography = () => {
  const theme = useCurrentTheme();
  return theme.typography;
};

export const useThemeBorderRadius = () => {
  const theme = useCurrentTheme();
  return theme.borderRadius;
};

// HOC for themed components
export const withTheme = <P extends object>(Component: React.ComponentType<P & { theme: Theme }>) => {
  const ThemedComponent = (props: P) => {
    const theme = useCurrentTheme();
    return React.createElement(Component, { ...props, theme } as P & { theme: Theme });
  };

  ThemedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  return ThemedComponent;
};

// Style generator hook
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: Theme) => T
) => {
  const theme = useCurrentTheme();
  return useMemo(() => createStyles(theme), [theme, createStyles]);
};
