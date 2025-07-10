import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { AuthProvider, AuthNavigator, useAuthContext, ThemeProvider, useAppTheme, themes } from 'langchat';
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
  const [systemAppearance, setSystemAppearance] = useState(Appearance.getColorScheme());
  const { theme, mode, setMode, setCustomTheme, useCustomTheme } = useAppTheme();

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

  const handleSignOut = async () => {
    // This will be handled by the auth context
    console.log('Signing out...');
  };

  // Demo: Create a vibrant custom theme
  const handleUseVibrantTheme = () => {
    const vibrantTheme = themes.vibrant;
    setCustomTheme('vibrant', vibrantTheme);
    useCustomTheme('vibrant');
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

        {/* Theme Selector */}
        <View style={styles.themeSelector}>
          <Text style={[styles.themeSelectorLabel, { color: theme.colors.text }]}>Theme:</Text>
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as const).map((themeMode) => (
              <TouchableOpacity
                key={themeMode}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: mode === themeMode ? theme.colors.primary : 'transparent',
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={() => setMode(themeMode)}
              >
                <Text style={[
                  styles.themeOptionText,
                  {
                    color: mode === themeMode ? theme.colors.background : theme.colors.text,
                    fontSize: 12
                  }
                ]}>
                  {getThemeModeLabel(themeMode)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Theme Status */}
        <View style={styles.themeStatus}>
          <Text style={[styles.themeStatusText, { color: theme.colors.textSecondary }]}>
            Active: {getThemeModeLabel(mode)} {mode === 'system' ? `(${theme.isDark ? 'Dark' : 'Light'})` : ''}
          </Text>
          <Text style={[styles.themeStatusText, { color: theme.colors.textSecondary, fontSize: 10 }]}>
            System: {systemAppearance || 'unknown'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.description, { color: theme.colors.text }]}>
          You have successfully authenticated with the LangChat package.
          This example demonstrates the authentication system integration with theming support.
        </Text>

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
          style={[styles.customThemeButton, { backgroundColor: theme.colors.secondary || theme.colors.primary, opacity: 0.8 }]}
          onPress={handleUseVibrantTheme}
        >
          <Text style={[styles.customThemeButtonText, { color: theme.colors.background }]}>
            Try Vibrant Theme 🎨
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
  themeSelector: {
    marginBottom: 12,
    alignItems: 'center',
  },
  themeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  themeStatus: {
    marginTop: 8,
  },
  themeStatusText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeLabel: {
    fontSize: 16,
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
  customThemeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  customThemeButtonText: {
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
