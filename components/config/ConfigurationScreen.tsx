import { ChatConfig } from '@/hooks/useChatConfig';
import { useTheme } from '@/theme/ThemeContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ConfigurationScreenProps {
  config: ChatConfig;
  onSave: (config: ChatConfig) => Promise<boolean>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ConfigurationScreen({
  config,
  onSave,
  onCancel,
  isLoading = false,
}: ConfigurationScreenProps) {
  const { theme } = useTheme();

  // Get environment variables for placeholders
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const envAssistantId = process.env.EXPO_PUBLIC_ASSISTANT_ID || '';
  const envApiKey = process.env.EXPO_PUBLIC_API_KEY || '';

  // Initialize with config values or env values as fallback
  const [apiUrl, setApiUrl] = useState(config.apiUrl || envApiUrl);
  const [assistantId, setAssistantId] = useState(config.assistantId || envAssistantId);
  const [apiKey, setApiKey] = useState(config.apiKey || envApiKey);
  const [saving, setSaving] = useState(false);

  // Update form when config changes
  useEffect(() => {
    setApiUrl(config.apiUrl || envApiUrl);
    setAssistantId(config.assistantId || envAssistantId);
    setApiKey(config.apiKey || envApiKey);
  }, [config, envApiUrl, envAssistantId, envApiKey]);

  const handleSave = async () => {
    const finalApiUrl = apiUrl.trim() || envApiUrl;
    const finalAssistantId = assistantId.trim() || envAssistantId;
    const finalApiKey = apiKey.trim() || envApiKey;

    // Validate required fields
    if (!finalApiUrl) {
      Alert.alert('Error', 'API URL is required');
      return;
    }

    if (!finalAssistantId) {
      Alert.alert('Error', 'Assistant ID is required');
      return;
    }

    // Validate URL format
    try {
      new URL(finalApiUrl);
    } catch {
      Alert.alert('Error', 'Please enter a valid API URL');
      return;
    }

    setSaving(true);

    const newConfig: ChatConfig = {
      apiUrl: finalApiUrl,
      assistantId: finalAssistantId,
      apiKey: finalApiKey || undefined,
    };

    const success = await onSave(newConfig);

    if (!success) {
      Alert.alert('Error', 'Failed to save configuration. Please try again.');
    }

    setSaving(false);
  };

  const disabled = isLoading || saving;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    contentContainer: {
      padding: 24,
    },
    headerContainer: {
      marginBottom: 32,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.text + '99',
      textAlign: 'center',
      lineHeight: 24,
    },
    formContainer: {
      gap: 24,
      marginBottom: 32,
    },
    fieldContainer: {
      gap: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    requiredStar: {
      color: '#EF4444',
    },
    envLabel: {
      fontSize: 12,
      color: '#3B82F6',
      fontWeight: '500',
    },
    description: {
      fontSize: 14,
      color: theme.text + '99',
      lineHeight: 20,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.border || theme.text + '33',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: theme.background,
      color: theme.text,
    },
    textInputDisabled: {
      backgroundColor: theme.text + '10',
      color: theme.text + '80',
    },
    envText: {
      fontSize: 12,
      color: '#3B82F6',
      marginTop: 4,
      fontStyle: 'italic',
    },
    buttonContainer: {
      gap: 12,
    },
    saveButton: {
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    saveButtonEnabled: {
      backgroundColor: '#3B82F6',
    },
    saveButtonDisabled: {
      backgroundColor: theme.text + '40',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 1,
    },
    cancelButtonEnabled: {
      borderColor: '#3B82F6',
    },
    cancelButtonDisabled: {
      borderColor: theme.text + '40',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonTextEnabled: {
      color: '#3B82F6',
    },
    cancelButtonTextDisabled: {
      color: theme.text + '40',
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          LangGraph Configuration
        </Text>
        <Text style={styles.subtitle}>
          Connect to your LangGraph server to start chatting
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            API URL <Text style={styles.requiredStar}>*</Text>
            {envApiUrl && (
              <Text style={styles.envLabel}> (from .env)</Text>
            )}
          </Text>
          <Text style={styles.description}>
            The URL of your LangGraph deployment (local or production)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              disabled && styles.textInputDisabled,
            ]}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder={envApiUrl || "http://localhost:2024"}
            placeholderTextColor={theme.text + '60'}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!disabled}
          />
          {envApiUrl && !apiUrl && (
            <Text style={styles.envText}>Using: {envApiUrl}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Assistant / Graph ID <Text style={styles.requiredStar}>*</Text>
            {envAssistantId && (
              <Text style={styles.envLabel}> (from .env)</Text>
            )}
          </Text>
          <Text style={styles.description}>
            The ID of the graph or assistant to use for conversations
          </Text>
          <TextInput
            style={[
              styles.textInput,
              disabled && styles.textInputDisabled,
            ]}
            value={assistantId}
            onChangeText={setAssistantId}
            placeholder={envAssistantId || "agent"}
            placeholderTextColor={theme.text + '60'}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
          />
          {envAssistantId && !assistantId && (
            <Text style={styles.envText}>Using: {envAssistantId}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            LangSmith API Key
            {envApiKey && (
              <Text style={styles.envLabel}> (from .env)</Text>
            )}
          </Text>
          <Text style={styles.description}>
            Required for deployed LangGraph servers. Not needed for local development.
          </Text>
          <TextInput
            style={[
              styles.textInput,
              disabled && styles.textInputDisabled,
            ]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={envApiKey ? "••••••••••••" : "lsv2_pt_..."}
            placeholderTextColor={theme.text + '60'}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
            editable={!disabled}
          />
          {envApiKey && !apiKey && (
            <Text style={styles.envText}>Using environment variable</Text>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            disabled ? styles.saveButtonDisabled : styles.saveButtonEnabled,
          ]}
          onPress={handleSave}
          disabled={disabled}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          )}
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            style={[
              styles.cancelButton,
              disabled ? styles.cancelButtonDisabled : styles.cancelButtonEnabled,
            ]}
            onPress={onCancel}
            disabled={disabled}
          >
            <Text style={[
              styles.cancelButtonText,
              disabled ? styles.cancelButtonTextDisabled : styles.cancelButtonTextEnabled,
            ]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
