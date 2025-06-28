// Chat Components
export { default as ChatScreen } from './components/ChatScreen';
export { MessageList } from './components/MessageList';
export { ToolMessage } from './components/messages/ToolMessage';

// Auth Components
export { default as ProtectedRoute } from './components/auth/ProtectedRoute';
export { default as SignInScreen } from './components/auth/SignInScreen';

// Profile Components
export { default as UserProfileScreen } from './components/profile/UserProfileScreen';

// Config Components
export { default as ConfigurationError } from './components/config/ConfigurationError';
export * from './config/ConfigurationScreen';

// Context Providers
export { ThemeProvider, useOptionalTheme, useTheme } from './context/ThemeProvider';
export { AppThemeProvider, useAppTheme } from './contexts/AppThemeContext';
export { ChatProvider, useChat } from './contexts/ChatContext';
export { AuthProvider, useAuth } from './contexts/SupabaseAuthContext';

// Supabase Utilities
export { createDefaultSupabaseClient, createLangChatSupabaseClient } from './lib/supabase/client';
export { getOAuthProviderConfig, isOAuthProviderAvailable, OAUTH_CONFIG } from './lib/supabase/oauth-config';
export { isOAuthSupported, signInWithOAuth } from './lib/supabase/oauth-utils';
export type { OAuthProvider, OAuthResult } from './lib/supabase/oauth-utils';
export type { AuthContext, Database, LangChatUser, Tables } from './lib/supabase/types';

// Hooks and Utils
export type { ChatConfig } from './hooks/useChatConfig';
export { filterRenderableMessages, generateMessageId } from './lib/message-utils';

// Theme
export { darkTheme, getThemeByMode, lightTheme, mergeTheme } from './theme';
export type { Theme, ThemeMode } from './theme';

