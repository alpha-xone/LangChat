import { ConfigurationScreen } from '@/components/config/ConfigurationScreen';
import { useChatConfig } from '@/hooks/useChatConfig';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { config, isLoading, isConfigured, updateConfig } = useChatConfig();
  const { mode, setMode, theme } = useTheme();
  const [showConfig, setShowConfig] = useState(false);

  const handleSaveConfig = useCallback(async (newConfig: typeof config) => {
    const success = await updateConfig(newConfig);
    if (success) {
      setShowConfig(false);
      Alert.alert('Success', 'Configuration saved successfully!');
    }
    return success;
  }, [updateConfig]);

  const handleShowConfig = useCallback(() => {
    setShowConfig(true);
  }, []);

  const handleCancelConfig = useCallback(() => {
    setShowConfig(false);
  }, []);

  const handleThemeChange = (selectedMode: 'light' | 'dark' | 'system') => {
    setMode(selectedMode);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: theme.text }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (showConfig) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ConfigurationScreen
          config={config}
          onSave={handleSaveConfig}
          onCancel={handleCancelConfig}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        {/* Header */}
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: 32,
          textAlign: 'center'
        }}>
          Profile & Settings
        </Text>

        {/* API Configuration Section */}
        <View style={{
          backgroundColor: theme.surface || theme.background,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          elevation: 2,
          shadowColor: theme.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderWidth: 1,
          borderColor: theme.border || '#E5E5E5'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="settings-outline" size={24} color={theme.primary} />
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: theme.text,
              marginLeft: 12
            }}>
              API Configuration
            </Text>
          </View>

          {/* Status Indicator */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isConfigured ? theme.success + '20' || '#E7F5E7' : theme.error + '20' || '#FFF2F2',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            marginBottom: 16
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isConfigured ? theme.success || '#4CAF50' : theme.error || '#F44336',
              marginRight: 8
            }} />
            <Text style={{
              fontSize: 14,
              color: isConfigured ? theme.success || '#2E7D32' : theme.error || '#C62828',
              fontWeight: '500'
            }}>
              {isConfigured ? 'Ready to chat' : 'Configuration required'}
            </Text>
          </View>

          {/* Configuration Details */}
          <View style={{ marginBottom: 20 }}>
            <ConfigItem
              label="API URL"
              value={config.apiUrl || 'Not configured'}
              theme={theme}
              isFromEnv={!!process.env.EXPO_PUBLIC_API_URL && !config.apiUrl}
            />
            <ConfigItem
              label="Assistant ID"
              value={config.assistantId || 'Not configured'}
              theme={theme}
              isFromEnv={!!process.env.EXPO_PUBLIC_ASSISTANT_ID && !config.assistantId}
            />
            <ConfigItem
              label="API Key"
              value={config.apiKey ? '••••••••••••' : 'Not configured'}
              theme={theme}
              isLast={true}
              isFromEnv={!!process.env.EXPO_PUBLIC_API_KEY && !config.apiKey}
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 1,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
            }}
            onPress={handleShowConfig}
          >
            <Ionicons name="cog" size={20} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8
            }}>
              {isConfigured ? 'Update Configuration' : 'Configure API'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Theme Settings Section */}
        <View style={{
          backgroundColor: theme.surface || theme.background,
          borderRadius: 16,
          padding: 20,
          elevation: 2,
          shadowColor: theme.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderWidth: 1,
          borderColor: theme.border || '#E5E5E5'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="color-palette-outline" size={24} color={theme.primary} />
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: theme.text,
              marginLeft: 12
            }}>
              Theme Settings
            </Text>
          </View>

          {/* Single Line Theme Toggle */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.text + '10',
            borderRadius: 12,
            padding: 4,
          }}>
            <ThemeButton
              label="Light"
              icon="sunny"
              isActive={mode === 'light'}
              onPress={() => handleThemeChange('light')}
              theme={theme}
            />
            <ThemeButton
              label="Dark"
              icon="moon"
              isActive={mode === 'dark'}
              onPress={() => handleThemeChange('dark')}
              theme={theme}
            />
            <ThemeButton
              label="System"
              icon="phone-portrait"
              isActive={mode === 'system'}
              onPress={() => handleThemeChange('system')}
              theme={theme}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper component for configuration items
const ConfigItem = ({ label, value, theme, isLast = false, isFromEnv = false }: {
  label: string;
  value: string;
  theme: any;
  isLast?: boolean;
  isFromEnv?: boolean;
}) => (
  <View style={{
    marginBottom: isLast ? 0 : 12,
    paddingBottom: isLast ? 0 : 12,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: theme.border || theme.text + '20'
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Text style={{
        fontSize: 12,
        fontWeight: '500',
        color: theme.text,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5
      }}>
        {label}
      </Text>
      {isFromEnv && (
        <View style={{
          backgroundColor: theme.primary + '20',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          marginLeft: 8
        }}>
          <Text style={{
            fontSize: 10,
            color: theme.primary,
            fontWeight: '600'
          }}>
            ENV
          </Text>
        </View>
      )}
    </View>
    <Text style={{
      fontSize: 16,
      color: theme.text,
      fontFamily: value.includes('••••') ? 'monospace' : 'default'
    }}>
      {value}
    </Text>
  </View>
);

// Helper component for theme buttons
const ThemeButton = ({
  label,
  icon,
  isActive,
  onPress,
  theme,
}: {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  theme: any;
}) => (
  <TouchableOpacity
    style={{
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: isActive ? theme.primary : 'transparent',
      marginHorizontal: 2,
    }}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon as any}
      size={16}
      color={isActive ? 'white' : theme.text + '80'}
      style={{ marginRight: 6 }}
    />
    <Text style={{
      fontSize: 14,
      fontWeight: '500',
      color: isActive ? 'white' : theme.text + '80',
    }}>
      {label}
    </Text>
  </TouchableOpacity>
);
