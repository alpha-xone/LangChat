import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { AuthProvider, AuthNavigator, useAuthContext, ThemeProvider, useAppTheme, themes } from 'langchat';
import { Appearance } from 'react-native';
import { DemoScreen } from './DemoScreen';
import { LangGraphExample } from './LangGraphExample';

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
  const [showLangGraph, setShowLangGraph] = useState(true); // Start with LangGraph example
  const { signOut } = useAuthContext();
  const { theme } = useAppTheme();

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show LangGraph example by default after login
  if (showLangGraph) {
    return (
      <LangGraphExample
        onBack={() => setShowLangGraph(false)}
      />
    );
  }

  // Show demo screen
  if (showDemo) {
    return <DemoScreen onBack={() => setShowDemo(false)} />;
  }

  // Original main app (now as fallback/menu)
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>Welcome to LangChat!</Text>
        <Text style={[styles.userInfo, { color: theme.colors.primary }]}>Hello, {user.name || 'User'}!</Text>
        <Text style={[styles.emailText, { color: theme.colors.textSecondary }]}>{user.email}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.features, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>Available Examples:</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ User Authentication</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ Theme System</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ LangGraph AI Integration</Text>
          <Text style={[styles.featureItem, { color: theme.colors.text }]}>✓ Streaming Chat Interface</Text>
        </View>

        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowLangGraph(true)}
        >
          <Text style={[styles.demoButtonText, { color: theme.colors.background }]}>
            🤖 LangGraph AI Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => setShowDemo(true)}
        >
          <Text style={[styles.demoButtonText, { color: theme.colors.background }]}>
            🔐 Auth Features Demo
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