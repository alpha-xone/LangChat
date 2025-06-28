import {
  ChatProvider,
  ChatScreen,
  createDefaultSupabaseClient,
  ProtectedRoute,
  useAppTheme,
  useAuth
} from '@/packages/langchat/src';
import { router } from 'expo-router';
import React from 'react';

const supabase = createDefaultSupabaseClient();

export default function ChatPage() {
  const { currentTheme, mode, setMode } = useAppTheme();
  const auth = useAuth();

  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <ProtectedRoute>
      <ChatProvider supabaseClient={supabase}>
        <ChatScreen
          themeMode={mode}
          theme={currentTheme}
          showDemo={false}
          showToolMessages={false}
          showThreadsPanel={true}
          showUserProfile={true}
          authContext={{
            user: auth.user ? {
              id: auth.user.id,
              email: auth.user.email || '',
              name: auth.user.profile?.name || auth.user.user_metadata?.name || 'User',
              avatar: auth.user.profile?.avatar_url,
            } : null,
            isAuthenticated: auth.isAuthenticated,
          }}
          onThemeChange={setMode}
          onProfilePress={handleProfilePress}
          config={{
            apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || 'http://localhost:2024',
            assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || 'agent',
            apiKey: process.env.EXPO_PUBLIC_LANGGRAPH_API_KEY || '',
          }}
        />
      </ChatProvider>
    </ProtectedRoute>
  );
}