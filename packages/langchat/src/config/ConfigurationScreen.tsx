import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChatConfig } from '../hooks/useChatConfig';
import { Theme } from '../theme'; // Updated import

export interface ConfigurationScreenProps {
  config: ChatConfig;
  onSave: (config: ChatConfig) => void;
  onCancel?: () => void;
  theme: Theme; // Add theme prop
}

export default function ConfigurationScreen({
  config,
  onSave,
  onCancel,
  theme, // Receive theme prop
}: ConfigurationScreenProps) {
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [assistantId, setAssistantId] = useState(config.assistantId);
  const [apiKey, setApiKey] = useState(config.apiKey);

  const handleSave = () => {
    if (!apiUrl.trim() || !assistantId.trim()) {
      Alert.alert('Error', 'API URL and Assistant ID are required');
      return;
    }

    onSave({
      apiUrl: apiUrl.trim(),
      assistantId: assistantId.trim(),
      apiKey: apiKey?.trim() || '',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
          }}>
            Configuration
          </Text>
          {onCancel && (
            <TouchableOpacity onPress={onCancel}>
              <Text style={{
                color: theme.primary,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* API URL */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 8,
            }}>
              API URL *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 12,
                backgroundColor: theme.surface,
                color: theme.text,
                fontSize: 16,
              }}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="https://your-langgraph-api.com"
              placeholderTextColor={theme.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Assistant ID */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 8,
            }}>
              Assistant ID *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 12,
                backgroundColor: theme.surface,
                color: theme.text,
                fontSize: 16,
              }}
              value={assistantId}
              onChangeText={setAssistantId}
              placeholder="your-assistant-id"
              placeholderTextColor={theme.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* API Key */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 8,
            }}>
              API Key (Optional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 12,
                backgroundColor: theme.surface,
                color: theme.text,
                fontSize: 16,
              }}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="your-api-key"
              placeholderTextColor={theme.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>

          <Text style={{
            fontSize: 14,
            color: theme.text,
            opacity: 0.7,
            marginBottom: 32,
          }}>
            * Required fields
          </Text>
        </ScrollView>

        {/* Save Button */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={handleSave}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Save Configuration
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
