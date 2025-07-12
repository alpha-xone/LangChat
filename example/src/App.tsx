import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { AuthProvider, AuthNavigator, useAuthContext, ThemeProvider, useAppTheme, themes, ChatScreen, type LangGraphConfig, AuthService, LangGraphClient } from 'langchat';
import { Appearance } from 'react-native';
import { DemoScreen } from './DemoScreen';

// Main App Component
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

// App Content with Authentication Check
function AppContent() {
  const { user, loading } = useAuthContext();
  const { theme } = useAppTheme();

  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      {loading ? <LoadingScreen /> : user ? <MainApp user={user} /> : <AuthenticationFlow />}
    </>
  );
}

// Loading Screen Component
function LoadingScreen() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
    </View>
  );
}

// Authentication Flow Component
function AuthenticationFlow() {
  return (
    <AuthNavigator
      initialScreen="signin"
      onAuthSuccess={() => {
        console.log('User authenticated successfully');
      }}
    />
  );
}

// Main App Component (for authenticated users)
function MainApp({ user }: { user: any }) {
  const [showDemo, setShowDemo] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [systemAppearance, setSystemAppearance] = useState(Appearance.getColorScheme());
  const { signOut } = useAuthContext();
  const {
    theme,
    mode,
    isUsingCustomTheme,
    activeCustomTheme,
    setMode,
    setCustomTheme,
    useCustomTheme,
    resetToDefault
  } = useAppTheme();

  // Monitor system appearance changes for debugging
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('[MainApp] System appearance changed to:', colorScheme);
      setSystemAppearance(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  if (showDemo) {
    return <DemoScreen onBack={() => setShowDemo(false)} />;
  }

  if (showChat) {
    return <LangGraphChatDemo onBack={() => setShowChat(false)} />;
  }

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Demo: Create a vibrant custom theme
  const handleToggleVibrantTheme = () => {
    const isVibrantActive = isUsingCustomTheme && activeCustomTheme === 'vibrant';

    if (isVibrantActive) {
      // Reset to default theme
      resetToDefault();
    } else {
      // Apply vibrant theme
      const vibrantTheme = themes.vibrant;
      setCustomTheme('vibrant', vibrantTheme);
      useCustomTheme('vibrant');
    }
  };

  // Cycle through theme modes: light -> dark -> system -> light
  const handleCycleThemeMode = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  };

  const getThemeModeLabel = (mode: string) => {
    switch (mode) {
      case 'light': return '☀️ Light';
      case 'dark': return '🌙 Dark';
      case 'system': return '📱 System';
      default: return mode;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>Welcome to LangChat!</Text>
        <Text style={[styles.userInfo, { color: theme.colors.primary }]}>Hello, {user.name || 'User'}!</Text>
        <Text style={[styles.emailText, { color: theme.colors.textSecondary }]}>{user.email}</Text>

        {/* Theme Controls */}
        <View style={[styles.themeSettings, { backgroundColor: theme.colors.surface }]}>
          {/* Base Theme Setting */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleCycleThemeMode}
          >
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Theme</Text>
            <View style={[styles.modeToggle, {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border
            }]}>
              <Text style={[styles.modeToggleText, { color: theme.colors.primary }]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Vibrant Theme Setting */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleToggleVibrantTheme}
          >
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Vibrant</Text>
            <View style={[styles.toggleSwitch, {
              backgroundColor: (isUsingCustomTheme && activeCustomTheme === 'vibrant') ? theme.colors.primary : theme.colors.border,
            }]}>
              <View style={[styles.toggleKnob, {
                backgroundColor: theme.colors.background,
                transform: [{ translateX: (isUsingCustomTheme && activeCustomTheme === 'vibrant') ? 22 : 2 }]
              }]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.features, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>Available Features:</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ User Registration</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ User Login</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ Password Reset</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ Light/Dark/System Theme Support</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ Automatic System Theme Detection</Text>
        </View>

        <Text style={[styles.nextSteps, { color: theme.colors.textSecondary }]}>
          Next steps: Integrate chat functionality, file uploads, and AI interactions.
        </Text>

        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowDemo(true)}
        >
          <Text style={[styles.demoButtonText, { color: theme.colors.background }]}>
            Explore Auth Features
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: theme.colors.secondary || theme.colors.primary, marginTop: 12 }]}
          onPress={() => setShowChat(true)}
        >
          <Text style={[styles.demoButtonText, { color: theme.colors.background }]}>
            Test LangGraph Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.signOutButtonContainer, { borderColor: theme.colors.error }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutButton, { color: theme.colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 18,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    marginBottom: 16,
  },
  themeSettings: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '400',
    textAlign: 'left',
  },
  modeToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  modeToggleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  features: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  nextSteps: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  demoButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  signOutButtonContainer: {
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
  },
  signOutButton: {
    fontSize: 16,
    fontWeight: '500',
    padding: 12,
    textAlign: 'center',
  },
});

// LangGraph Chat Demo Component
function LangGraphChatDemo({ onBack }: { onBack: () => void }) {
  const { theme } = useAppTheme();
  const [sessionInfo, setSessionInfo] = useState<{
    hasToken: boolean;
    tokenPreview?: string;
    userId?: string;
  } | null>(null);

  // LangGraph configuration - replace with your actual values
  const langGraphConfig: LangGraphConfig = {
    apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || "https://your-deployment-url",
    assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || "agent",
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
  };

  const handleThreadCreated = (threadId: string) => {
    console.log('New LangGraph thread created:', threadId);
  };

  const handleError = (error: string) => {
    console.error('LangGraph chat error:', error);
    // You can add user-friendly error handling here
  };

  // Check if configuration is placeholder values
  const isConfigured = langGraphConfig.apiUrl !== "https://your-deployment-url";

  // Get session info for debugging
  useEffect(() => {
    const getSessionInfo = async () => {
      try {
        // This is just for demonstration - in real usage you don't need to show this
        const authService = new AuthService();
        const client = new LangGraphClient(langGraphConfig, authService);
        const info = await client.getSessionInfo();
        setSessionInfo(info);
      } catch (error) {
        console.log('Could not get session info:', error);
      }
    };
    getSessionInfo();
  }, []);

  return (
    <View style={[chatStyles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[chatStyles.chatHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[chatStyles.backButton, { backgroundColor: theme.colors.background }]}
        >
          <Text style={[chatStyles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[chatStyles.chatTitle, { color: theme.colors.text }]}>LangGraph Chat Demo</Text>
      </View>

      {/* Configuration Warning or Chat Interface */}
      <View style={chatStyles.chatContainer}>
        {!isConfigured ? (
          <View style={[chatStyles.configWarning, { backgroundColor: theme.colors.surface }]}>
            <Text style={[chatStyles.configWarningTitle, { color: theme.colors.text }]}>⚠️ Configuration Required</Text>
            <Text style={[chatStyles.configWarningText, { color: theme.colors.textSecondary }]}>
              To use LangGraph chat, please configure your environment variables:
            </Text>
            <Text style={[chatStyles.configCode, { color: theme.colors.primary, backgroundColor: theme.colors.background }]}>
              EXPO_PUBLIC_LANGGRAPH_API_URL=your_api_url{'\n'}
              EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID=your_assistant_id
            </Text>
            <Text style={[chatStyles.configWarningText, { color: theme.colors.textSecondary }]}>
              For testing purposes, the chat will attempt to connect but may show errors.
            </Text>
          </View>
        ) : null}

        <ChatScreen
          config={langGraphConfig}
          placeholder="Ask me anything about the LangGraph integration..."
          reconnectOnMount={true}
          onThreadCreated={handleThreadCreated}
          onError={handleError}
          renderHeader={() => (
            <View style={[chatStyles.chatInfo, { backgroundColor: theme.colors.surface }]}>
              <Text style={[chatStyles.chatInfoText, { color: theme.colors.textSecondary }]}>
                This is a demo of the LangGraph integration. The chat will attempt to connect to your configured LangGraph backend.
              </Text>
              <Text style={[chatStyles.chatInfoText, { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }]}>
                API URL: {langGraphConfig.apiUrl}
              </Text>
              {sessionInfo && (
                <View style={{ marginTop: 8, padding: 8, backgroundColor: theme.colors.background, borderRadius: 6 }}>
                  <Text style={[chatStyles.chatInfoText, { color: theme.colors.textSecondary, fontSize: 12 }]}>
                    🔐 Auth Status: {sessionInfo.hasToken ? '✅ Authenticated' : '❌ No Token'}
                  </Text>
                  {sessionInfo.tokenPreview && (
                    <Text style={[chatStyles.chatInfoText, { color: theme.colors.textSecondary, fontSize: 10, fontFamily: 'monospace' }]}>
                      Token: {sessionInfo.tokenPreview}
                    </Text>
                  )}
                  {sessionInfo.userId && (
                    <Text style={[chatStyles.chatInfoText, { color: theme.colors.textSecondary, fontSize: 10 }]}>
                      User ID: {sessionInfo.userId}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
          style={{
            container: chatStyles.chatScreenContainer,
            input: [chatStyles.chatInput, {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }],
            sendButton: [chatStyles.sendButton, { backgroundColor: theme.colors.primary }],
            sendButtonText: [chatStyles.sendButtonText, { color: theme.colors.background }],
          }}
        />
      </View>
    </View>
  );
}

// Chat-specific styles
const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  configWarning: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffa500',
  },
  configWarningTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  configWarningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  configCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  chatInfo: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  chatInfoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatScreenContainer: {
    flex: 1,
  },
  chatInput: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});