import { ChatConfig } from '@/hooks/useChatConfig';
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>LangGraph Configuration</Text>
        <Text style={styles.subtitle}>
          Connect to your LangGraph server to start chatting
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>
            API URL <Text style={styles.required}>*</Text>
            {envApiUrl && (
              <Text style={styles.envIndicator}> (from .env)</Text>
            )}
          </Text>
          <Text style={styles.description}>
            The URL of your LangGraph deployment (local or production)
          </Text>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder={envApiUrl || "http://localhost:2024"}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!disabled}
          />
          {envApiUrl && !apiUrl && (
            <Text style={styles.envValue}>Using: {envApiUrl}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Assistant / Graph ID <Text style={styles.required}>*</Text>
            {envAssistantId && (
              <Text style={styles.envIndicator}> (from .env)</Text>
            )}
          </Text>
          <Text style={styles.description}>
            The ID of the graph or assistant to use for conversations
          </Text>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            value={assistantId}
            onChangeText={setAssistantId}
            placeholder={envAssistantId || "agent"}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
          />
          {envAssistantId && !assistantId && (
            <Text style={styles.envValue}>Using: {envAssistantId}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            LangSmith API Key
            {envApiKey && (
              <Text style={styles.envIndicator}> (from .env)</Text>
            )}
          </Text>
          <Text style={styles.description}>
            Required for deployed LangGraph servers. Not needed for local development.
          </Text>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={envApiKey ? "••••••••••••" : "lsv2_pt_..."}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
            editable={!disabled}
          />
          {envApiKey && !apiKey && (
            <Text style={styles.envValue}>Using environment variable</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.saveButton, disabled && styles.saveButtonDisabled]}
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
            style={[styles.cancelButton, disabled && styles.cancelButtonDisabled]}
            onPress={onCancel}
            disabled={disabled}
          >
            <Text style={[styles.cancelButtonText, disabled && styles.cancelButtonTextDisabled]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 24,
    marginBottom: 32,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  required: {
    color: '#FF3B30',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F8F8F8',
    color: '#999999',
  },
  actions: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    borderColor: '#CCCCCC',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonTextDisabled: {
    color: '#CCCCCC',
  },
  envIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  envValue: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
