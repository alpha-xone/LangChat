// Authentication system
export * from './components/auth';
export * from './hooks/useAuth';
export * from './data/AuthService';
export { default as AuthService } from './data/AuthService';
export { ChatService, type CreateThreadData, type UpdateThreadData } from './data/ChatService';
export * from './data/supabase';
export * from './types';

// Chat components
export * from './components/chat';

// AI Integration Layer
export * from './ai';

// Theming system
export {
  ThemeProvider,
  useThemeStore,
  lightTheme,
  darkTheme,
  type ThemeMode,
  type Theme,
  type ThemeColors
} from './theming/store';
export {
  useAppTheme
} from './theming/useAppTheme';
export {
  themes
} from './theming/themes';
export {
  createThemedStyles,
  getContrastingTextColor,
  addAlpha,
  getShadowStyle,
  getBorderStyle,
  getSpacing,
  getFontSize,
  getBorderRadius,
  createStyleUtilities
} from './theming/utils';

// Legacy export (can be removed later)
export function multiply(a: number, b: number): number {
  return a * b;
}
