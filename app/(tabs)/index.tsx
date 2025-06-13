import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const { theme } = useTheme();
  const router = useRouter();

  const navigateToChat = () => {
    router.push('/(screens)/ChatScreen');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 32 }}>
        <Text style={{ fontSize: 40, color: theme.primary, fontWeight: 'bold' }}>
          Welcome!
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: theme.primary,
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 12,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
          onPress={navigateToChat}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Open Chat
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
