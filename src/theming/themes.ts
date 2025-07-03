import type { Theme } from '../types';

export const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#6D6D70',
    border: '#E5E5EA',
    error: '#FF3B30',
    success: '#30D158',
    warning: '#FF9500',
  },
  typography: {
    fontFamily: 'System',
    fontSize: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24,
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

export const darkTheme: Theme = {
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
  },
  typography: {
    fontFamily: 'System',
    fontSize: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24,
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

// High contrast theme for accessibility
export const highContrastTheme: Theme = {
  colors: {
    primary: '#0000FF',
    secondary: '#800080',
    background: '#FFFFFF',
    surface: '#F0F0F0',
    text: '#000000',
    textSecondary: '#333333',
    border: '#000000',
    error: '#CC0000',
    success: '#008000',
    warning: '#FF8C00',
  },
  typography: {
    fontFamily: 'System',
    fontSize: {
      small: 14,
      medium: 18,
      large: 22,
      xlarge: 26,
    },
    fontWeight: {
      light: '400',
      regular: '500',
      medium: '600',
      bold: '800',
    },
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 28,
    xl: 36,
  },
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 8,
  },
};

// Colorful theme
export const colorfulTheme: Theme = {
  colors: {
    primary: '#FF6B35',
    secondary: '#F7931E',
    background: '#FFEAA7',
    surface: '#FFFFFF',
    text: '#2D3436',
    textSecondary: '#636E72',
    border: '#DDD',
    error: '#E17055',
    success: '#00B894',
    warning: '#FDCB6E',
  },
  typography: {
    fontFamily: 'System',
    fontSize: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24,
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
  },
};

// Minimal theme
export const minimalTheme: Theme = {
  colors: {
    primary: '#333333',
    secondary: '#666666',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    text: '#222222',
    textSecondary: '#777777',
    border: '#EEEEEE',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
  },
  typography: {
    fontFamily: 'System',
    fontSize: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24,
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      bold: '600',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 8,
  },
};

export const defaultThemes = {
  light: lightTheme,
  dark: darkTheme,
  highContrast: highContrastTheme,
  colorful: colorfulTheme,
  minimal: minimalTheme,
};

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeName = keyof typeof defaultThemes;

// Theme utilities
export const getThemeForMode = (mode: ThemeMode): Theme => {
  switch (mode) {
    case 'light':
      return lightTheme;
    case 'dark':
      return darkTheme;
    case 'system':
      // In a real app, this would check the system preference
      return lightTheme;
    default:
      return lightTheme;
  }
};

export const createCustomTheme = (baseTheme: Theme, overrides: Partial<Theme>): Theme => {
  return {
    colors: { ...baseTheme.colors, ...overrides.colors },
    typography: { ...baseTheme.typography, ...overrides.typography },
    spacing: { ...baseTheme.spacing, ...overrides.spacing },
    borderRadius: { ...baseTheme.borderRadius, ...overrides.borderRadius },
  };
};

export const getContrastRatio = (color1: string, color2: string): number => {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color library
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);

  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);

  const luminance1 = (0.299 * r1 + 0.587 * g1 + 0.114 * b1) / 255;
  const luminance2 = (0.299 * r2 + 0.587 * g2 + 0.114 * b2) / 255;

  const brightest = Math.max(luminance1, luminance2);
  const darkest = Math.min(luminance1, luminance2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const isColorAccessible = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const contrast = getContrastRatio(foreground, background);
  return level === 'AA' ? contrast >= 4.5 : contrast >= 7;
};

export const validateTheme = (theme: Theme): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check accessibility
  if (!isColorAccessible(theme.colors.text, theme.colors.background)) {
    errors.push('Text color does not meet accessibility standards with background');
  }

  if (!isColorAccessible(theme.colors.textSecondary, theme.colors.background)) {
    errors.push('Secondary text color does not meet accessibility standards with background');
  }

  if (!isColorAccessible(theme.colors.primary, theme.colors.background)) {
    errors.push('Primary color does not meet accessibility standards with background');
  }

  // Check required properties
  const requiredColors = ['primary', 'secondary', 'background', 'surface', 'text', 'textSecondary', 'border', 'error', 'success', 'warning'];
  const missingColors = requiredColors.filter(color => !theme.colors[color as keyof typeof theme.colors]);

  if (missingColors.length > 0) {
    errors.push(`Missing required colors: ${missingColors.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const generateThemeVariations = (baseTheme: Theme): Record<string, Theme> => {
  return {
    light: createCustomTheme(baseTheme, {
      colors: {
        ...baseTheme.colors,
        background: '#FFFFFF',
        surface: '#F8F9FA',
        text: '#212529',
        textSecondary: '#6C757D',
      },
    }),
    dark: createCustomTheme(baseTheme, {
      colors: {
        ...baseTheme.colors,
        background: '#121212',
        surface: '#1E1E1E',
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
      },
    }),
    sepia: createCustomTheme(baseTheme, {
      colors: {
        ...baseTheme.colors,
        background: '#F4F1EA',
        surface: '#EFEBE0',
        text: '#5C4B37',
        textSecondary: '#8B7355',
      },
    }),
  };
};

// Export theme constants for styling
export const THEME_CONSTANTS = {
  ANIMATION_DURATION: 200,
  SHADOW_OPACITY: 0.1,
  DISABLED_OPACITY: 0.6,
  ACTIVE_OPACITY: 0.8,
  OVERLAY_OPACITY: 0.5,
} as const;
