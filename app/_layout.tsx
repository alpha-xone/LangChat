import { AppThemeProvider } from '@/contexts/AppThemeContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
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
