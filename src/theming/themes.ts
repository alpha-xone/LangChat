import {
  type Theme,
  type ThemeColors,
  type ThemeFonts,
  type ThemeSizes,
  type ThemeSpacing,
  type ThemeBorderRadius
} from './store';

// Extended theme configurations for different use cases
export const themes = {
  // Default light theme (iOS inspired)
  light: {
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
  } as Theme,

  // Default dark theme (iOS inspired)
  dark: {
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
    isDark: true,
  } as Theme,

  // Material Design inspired theme
  material: {
    colors: {
      primary: '#1976D2',
      primaryDark: '#0D47A1',
      primaryLight: '#42A5F5',
      secondary: '#FFC107',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      surfaceVariant: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      textDisabled: '#BDBDBD',
      border: '#E0E0E0',
      borderLight: '#F5F5F5',
      error: '#D32F2F',
      errorLight: '#F44336',
      success: '#388E3C',
      successLight: '#4CAF50',
      warning: '#F57C00',
      warningLight: '#FF9800',
      info: '#1976D2',
      infoLight: '#2196F3',
      shadow: 'rgba(0, 0, 0, 0.12)',
      overlay: 'rgba(0, 0, 0, 0.6)',
    },
    fonts: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      semiBold: 'Roboto-Medium',
      bold: 'Roboto-Bold',
      light: 'Roboto-Light',
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
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    isDark: false,
  } as Theme,

  // Material Design Dark theme
  materialDark: {
    colors: {
      primary: '#90CAF9',
      primaryDark: '#42A5F5',
      primaryLight: '#BBDEFB',
      secondary: '#FFD54F',
      background: '#121212',
      surface: '#1E1E1E',
      surfaceVariant: '#2D2D2D',
      text: '#FFFFFF',
      textSecondary: '#B3B3B3',
      textDisabled: '#666666',
      border: '#333333',
      borderLight: '#404040',
      error: '#CF6679',
      errorLight: '#EF5350',
      success: '#81C784',
      successLight: '#A5D6A7',
      warning: '#FFB74D',
      warningLight: '#FFCC02',
      info: '#64B5F6',
      infoLight: '#90CAF9',
      shadow: 'rgba(0, 0, 0, 0.24)',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    fonts: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      semiBold: 'Roboto-Medium',
      bold: 'Roboto-Bold',
      light: 'Roboto-Light',
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
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    isDark: true,
  } as Theme,

  // Minimal theme
  minimal: {
    colors: {
      primary: '#000000',
      primaryDark: '#333333',
      primaryLight: '#666666',
      secondary: '#888888',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      surfaceVariant: '#F0F0F0',
      text: '#000000',
      textSecondary: '#666666',
      textDisabled: '#CCCCCC',
      border: '#E0E0E0',
      borderLight: '#F0F0F0',
      error: '#CC0000',
      errorLight: '#FF3333',
      success: '#006600',
      successLight: '#339933',
      warning: '#CC6600',
      warningLight: '#FF9933',
      info: '#0066CC',
      infoLight: '#3399FF',
      shadow: 'rgba(0, 0, 0, 0.08)',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
    fonts: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
      light: 'System',
    },
    fontSizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 19,
      xxl: 22,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 20,
      xl: 28,
      xxl: 40,
    },
    borderRadius: {
      xs: 2,
      sm: 4,
      md: 6,
      lg: 8,
      xl: 12,
      full: 9999,
    },
    isDark: false,
  } as Theme,

  // Vibrant theme
  vibrant: {
    colors: {
      primary: '#FF6B35',
      primaryDark: '#E55A2B',
      primaryLight: '#FF8A65',
      secondary: '#4ECDC4',
      background: '#FFFFFF',
      surface: '#FAFFFE',
      surfaceVariant: '#F0FFF4',
      text: '#2D3748',
      textSecondary: '#718096',
      textDisabled: '#CBD5E0',
      border: '#E2E8F0',
      borderLight: '#F7FAFC',
      error: '#E53E3E',
      errorLight: '#FC8181',
      success: '#38A169',
      successLight: '#68D391',
      warning: '#D69E2E',
      warningLight: '#F6E05E',
      info: '#3182CE',
      infoLight: '#63B3ED',
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
      xs: 6,
      sm: 10,
      md: 14,
      lg: 18,
      xl: 26,
      full: 9999,
    },
    isDark: false,
  } as Theme,
};

// Helper function to create a custom theme based on a base theme
export const createCustomTheme = (
  baseTheme: Theme,
  overrides: {
    colors?: Partial<ThemeColors>;
    fonts?: Partial<ThemeFonts>;
    fontSizes?: Partial<ThemeSizes>;
    spacing?: Partial<ThemeSpacing>;
    borderRadius?: Partial<ThemeBorderRadius>;
    isDark?: boolean;
  }
): Theme => {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
    },
    fonts: {
      ...baseTheme.fonts,
      ...overrides.fonts,
    },
    fontSizes: {
      ...baseTheme.fontSizes,
      ...overrides.fontSizes,
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrides.spacing,
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...overrides.borderRadius,
    },
    isDark: overrides.isDark ?? baseTheme.isDark,
  };
};

// Helper function to generate a theme with custom primary color
export const createThemeWithPrimaryColor = (
  baseTheme: Theme,
  primaryColor: string
): Theme => {
  // Generate variations of the primary color
  const primaryDark = adjustColorBrightness(primaryColor, -20);
  const primaryLight = adjustColorBrightness(primaryColor, 20);

  return createCustomTheme(baseTheme, {
    colors: {
      primary: primaryColor,
      primaryDark,
      primaryLight,
    },
  });
};

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
  // Simple brightness adjustment - in a real app, you might want to use a color library
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;

  return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255))
    .toString(16).slice(1);
}
