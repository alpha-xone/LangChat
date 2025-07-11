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