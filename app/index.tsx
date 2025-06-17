import { useAppTheme } from '@/contexts/AppThemeContext';
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomePage() {
  const { currentTheme, mode, setMode } = useAppTheme();

  const themeOptions = [
    { key: 'light', icon: '☀️', label: 'Light' },
    { key: 'dark', icon: '🌙', label: 'Dark' },
    { key: 'system', icon: '📱', label: 'Auto' },
  ] as const;

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
              <Text style={[
                styles.themeOptionIcon,
                { opacity: isSelected ? 1 : 0.6 }
              ]}>
                {option.icon}
              </Text>
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
    gap: 2,
  },
  themeOptionIcon: {
    fontSize: 14,
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
});
