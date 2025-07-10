import { StyleSheet } from 'react-native';
import { type Theme } from './store';

/**
 * Utility function to create styles with theme support
 * This replaces the need for ThemeContext in component styling
 */
export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (theme: Theme) => T
) => {
  return (theme: Theme) => StyleSheet.create(styleFactory(theme));
};

/**
 * Helper to get contrasting text color based on background
 */
export const getContrastingTextColor = (backgroundColor: string, theme: Theme): string => {
  // Simple implementation - you might want to use a proper contrast ratio calculation
  const isDarkBackground = backgroundColor.toLowerCase().includes('#000') ||
    backgroundColor.toLowerCase().includes('dark') ||
    backgroundColor === theme.colors.surface && theme.isDark;

  return isDarkBackground ? theme.colors.text : theme.colors.text;
};

/**
 * Helper to add alpha to a color
 */
export const addAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('rgba')) {
    // If already rgba, replace alpha
    return color.replace(/[\d\.]+\)$/g, `${alpha})`);
  }

  if (color.startsWith('rgb')) {
    // Convert rgb to rgba
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }

  if (color.startsWith('#')) {
    // Convert hex to rgba
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
};

/**
 * Helper to get shadow style based on theme
 */
export const getShadowStyle = (theme: Theme, elevation: number = 1) => {
  const shadowOpacity = theme.isDark ? 0.3 : 0.1;
  const shadowRadius = elevation * 2;
  const shadowOffset = { width: 0, height: elevation };

  return {
    shadowColor: theme.colors.shadow,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation: elevation * 2, // Android elevation
  };
};

/**
 * Helper to get border style based on theme
 */
export const getBorderStyle = (
  theme: Theme,
  width: number = 1,
  variant: 'default' | 'light' = 'default'
) => {
  return {
    borderWidth: width,
    borderColor: variant === 'light' ? theme.colors.borderLight : theme.colors.border,
  };
};

/**
 * Helper to get spacing value
 */
export const getSpacing = (theme: Theme, size: keyof Theme['spacing']): number => {
  return theme.spacing[size];
};

/**
 * Helper to get font size value
 */
export const getFontSize = (theme: Theme, size: keyof Theme['fontSizes']): number => {
  return theme.fontSizes[size];
};

/**
 * Helper to get border radius value
 */
export const getBorderRadius = (theme: Theme, size: keyof Theme['borderRadius']): number => {
  return theme.borderRadius[size];
};

/**
 * Helper to create responsive styles based on screen size
 * This is a placeholder implementation - extend based on your needs
 */
export const createResponsiveStyle = (
  baseStyle: any,
  _largeScreenStyle?: any,
  _tabletStyle?: any
) => {
  // This is a simplified implementation
  // In a real app, you might want to use Dimensions API or a responsive library
  return {
    ...baseStyle,
    // Add responsive logic here based on your needs
  };
};

/**
 * Helper to interpolate between two colors based on a factor (0-1)
 */
export const interpolateColor = (color1: string, color2: string, factor: number): string => {
  // Simple interpolation - in production, use a proper color library
  if (factor <= 0) return color1;
  if (factor >= 1) return color2;

  // This is a simplified implementation
  return factor < 0.5 ? color1 : color2;
};

/**
 * Pre-built style utilities for common patterns
 */
export const createStyleUtilities = (theme: Theme) => ({
  // Common flex layouts
  flex: {
    row: { flexDirection: 'row' as const },
    column: { flexDirection: 'column' as const },
    center: { justifyContent: 'center' as const, alignItems: 'center' as const },
    spaceBetween: { justifyContent: 'space-between' as const },
    spaceAround: { justifyContent: 'space-around' as const },
    spaceEvenly: { justifyContent: 'space-evenly' as const },
  },

  // Common positioning
  position: {
    absolute: { position: 'absolute' as const },
    relative: { position: 'relative' as const },
  },

  // Common text styles
  text: {
    center: { textAlign: 'center' as const },
    left: { textAlign: 'left' as const },
    right: { textAlign: 'right' as const },
    primary: { color: theme.colors.primary },
    secondary: { color: theme.colors.textSecondary },
    disabled: { color: theme.colors.textDisabled },
    error: { color: theme.colors.error },
    success: { color: theme.colors.success },
  },

  // Common background styles
  background: {
    primary: { backgroundColor: theme.colors.primary },
    surface: { backgroundColor: theme.colors.surface },
    transparent: { backgroundColor: 'transparent' },
  },

  // Common spacing
  margin: {
    xs: { margin: theme.spacing.xs },
    sm: { margin: theme.spacing.sm },
    md: { margin: theme.spacing.md },
    lg: { margin: theme.spacing.lg },
    xl: { margin: theme.spacing.xl },
  },

  padding: {
    xs: { padding: theme.spacing.xs },
    sm: { padding: theme.spacing.sm },
    md: { padding: theme.spacing.md },
    lg: { padding: theme.spacing.lg },
    xl: { padding: theme.spacing.xl },
  },

  // Common border radius
  rounded: {
    xs: { borderRadius: theme.borderRadius.xs },
    sm: { borderRadius: theme.borderRadius.sm },
    md: { borderRadius: theme.borderRadius.md },
    lg: { borderRadius: theme.borderRadius.lg },
    xl: { borderRadius: theme.borderRadius.xl },
    full: { borderRadius: theme.borderRadius.full },
  },
});
