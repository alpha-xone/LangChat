import { AppThemeProvider, AuthProvider, createDefaultSupabaseClient } from '@/packages/langchat/src';
import { Stack } from "expo-router";

const supabase = createDefaultSupabaseClient();

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider supabaseClient={supabase}>
        <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            title: "Chat with App Theme",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="standalone-chat"
          options={{
            title: "Standalone Chat",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
      </AuthProvider>
    </AppThemeProvider>
  );
}
