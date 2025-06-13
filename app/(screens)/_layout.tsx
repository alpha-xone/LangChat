import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ChatScreen"
        options={{
          headerShown: false,
          title: 'Chat'
        }}
      />
    </Stack>
  );
}
