import ConfigurationError from '@/components/ConfigurationError';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LucideIcon from '@react-native-vector-icons/lucide';
import { Link } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomePage() {
  const { currentTheme, mode, setMode } = useAppTheme();
  const { user, isAuthenticated, isLoading, configurationError, signOut } = useAuth();

  const themeOptions = [
    { key: 'light', icon: 'sun', label: 'Light' },
    { key: 'dark', icon: 'moon', label: 'Dark' },
    { key: 'system', icon: 'monitor', label: 'Auto' },
  ] as const;

  // Show configuration error if Supabase is not configured
  if (configurationError) {
    return <ConfigurationError />;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.text }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Modern Theme Toggle */}
      <View style={[styles.themeToggleContainer, {
        backgroundColor: currentTheme.surface,
        borderColor: currentTheme.border,
      }]}>
        {themeOptions.map((option, index) => {
          const isSelected = mode === option.key;
          const isFirst = index === 0;
          const isLast = index === themeOptions.length - 1;

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.themeOption,
                {
                  backgroundColor: isSelected ? currentTheme.primary : 'transparent',
                  borderTopLeftRadius: isFirst ? 6 : 0,
                  borderBottomLeftRadius: isFirst ? 6 : 0,
                  borderTopRightRadius: isLast ? 6 : 0,
                  borderBottomRightRadius: isLast ? 6 : 0,
                },
              ]}
              onPress={() => setMode(option.key)}
              activeOpacity={0.7}
            >
              <LucideIcon
                name={option.icon}
                size={16}
                color={isSelected ? '#ffffff' : currentTheme.text}
                style={{ opacity: isSelected ? 1 : 0.6 }}
              />
              <Text style={[
                styles.themeOptionLabel,
                {
                  color: isSelected ? '#ffffff' : currentTheme.text,
                  opacity: isSelected ? 1 : 0.7,
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.title, { color: currentTheme.text }]}>
        LangChat Demo
      </Text>

      {/* Authentication Status */}
      {isAuthenticated && user ? (
        <View style={[styles.authSection, { borderColor: currentTheme.border }]}>
          <Text style={[styles.welcomeText, { color: currentTheme.text }]}>
            Welcome back, {user.profile?.name || user.user_metadata?.name || 'User'}!
          </Text>
          <TouchableOpacity style={[styles.profileLink, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]} onPress={signOut}>
            <Text style={[styles.profileLinkText, { color: currentTheme.primary }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.authSection, { borderColor: currentTheme.border }]}>
          <Text style={[styles.authPrompt, { color: currentTheme.placeholder }]}>
            Sign in to save your chat history and preferences
          </Text>
          <Link href="/auth" style={[styles.profileLink, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, marginTop: 12 }]}>
            <Text style={[styles.profileLinkText, { color: currentTheme.primary }]}>Sign In</Text>
          </Link>
        </View>
      )}

      <Link href="/chat" style={[styles.link, { backgroundColor: currentTheme.primary }]}>
        <Text style={styles.linkText}>Chat with App Theme Context</Text>
      </Link>

      <Link href="/standalone-chat" style={[styles.link, { backgroundColor: currentTheme.primary }]}>
        <Text style={styles.linkText}>Standalone Chat (No App Context)</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    gap: 4,
  },
  themeOptionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  authSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    minWidth: 250,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  authPrompt: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileLink: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  profileLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  link: {
    padding: 15,
    borderRadius: 8,
    minWidth: 250,
    alignItems: 'center',
  },
  linkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
