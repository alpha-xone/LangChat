import { ChatScreen, useAppTheme } from "@/packages/langchat/src";

export default function StandaloneChatPage() {
  const { currentTheme, mode, setMode } = useAppTheme();

  // Custom theme overrides (optional)
  const customTheme = {
    ...currentTheme,
    primary: '#FF6B6B', // Override primary color for standalone
    accent: '#4ECDC4',  // Override accent color
  };

  return (
    <ChatScreen
      themeMode={mode}
      theme={customTheme}
      showDemo={true}
      onThemeChange={setMode} // Sync theme changes back to app
      config={{
        apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || 'http://localhost:2024',
        assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || 'agent',
        apiKey: process.env.EXPO_PUBLIC_LANGGRAPH_API_KEY || '',
      }}
    />
  );
}