// Authentication system
export * from './components/auth';
export * from './hooks/useAuth';
export * from './data/AuthService';
export * from './data/supabase';
export * from './types';

// AI Integration system - explicit exports to avoid naming conflicts
export {
  LangGraphClient,
  createLangGraphClient,
  StreamParser,
  createStreamParser,
  createLoggingStreamParser,
  useLangGraph,
  useLangGraphSimple,
  SimpleChat,
  SimpleIcon,
  LangGraphDemo,
  type LangGraphConfig,
  type StreamingResponse,
  type ThreadCreationResult,
  type ParsedMessage,
  type StreamParserEvents,
  type LangGraphHookConfig,
  type LangGraphState,
  type LangGraphActions,
  type UseLangGraphReturn,
  type SimpleChatProps,
  type SimpleIconProps,
  type LangGraphDemoProps,
} from './ai';
// Note: ChatMessage from AI is aliased to avoid conflict with types/ChatMessage
export { type ChatMessage as LangGraphChatMessage } from './ai';

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
