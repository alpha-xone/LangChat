import { ChatConfig } from '@/hooks/useChatConfig';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24 }}>
      <View className="mb-8 items-center">
        <Text className="text-3xl font-bold text-black mb-2 text-center">
          LangGraph Configuration
        </Text>
        <Text className="text-base text-gray-600 text-center leading-6">
          Connect to your LangGraph server to start chatting
        </Text>
      </View>

      <View className="gap-6 mb-8">
        <View className="gap-2">
          <Text className="text-base font-semibold text-black">
            API URL <Text className="text-red-500">*</Text>
            {envApiUrl && (
              <Text className="text-xs text-blue-500 font-medium"> (from .env)</Text>
            )}
          </Text>
          <Text className="text-sm text-gray-600 leading-5">
            The URL of your LangGraph deployment (local or production)
          </Text>
          <TextInput
            className={`border border-gray-300 rounded-lg px-4 py-3 text-base bg-white ${
              disabled ? 'bg-gray-100 text-gray-500' : ''
            }`}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder={envApiUrl || "http://localhost:2024"}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!disabled}
          />
          {envApiUrl && !apiUrl && (
            <Text className="text-xs text-blue-500 mt-1 italic">Using: {envApiUrl}</Text>
          )}
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-black">
            Assistant / Graph ID <Text className="text-red-500">*</Text>
            {envAssistantId && (
              <Text className="text-xs text-blue-500 font-medium"> (from .env)</Text>
            )}
          </Text>
          <Text className="text-sm text-gray-600 leading-5">
            The ID of the graph or assistant to use for conversations
          </Text>
          <TextInput
            className={`border border-gray-300 rounded-lg px-4 py-3 text-base bg-white ${
              disabled ? 'bg-gray-100 text-gray-500' : ''
            }`}
            value={assistantId}
            onChangeText={setAssistantId}
            placeholder={envAssistantId || "agent"}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
          />
          {envAssistantId && !assistantId && (
            <Text className="text-xs text-blue-500 mt-1 italic">Using: {envAssistantId}</Text>
          )}
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-black">
            LangSmith API Key
            {envApiKey && (
              <Text className="text-xs text-blue-500 font-medium"> (from .env)</Text>
            )}
          </Text>
          <Text className="text-sm text-gray-600 leading-5">
            Required for deployed LangGraph servers. Not needed for local development.
          </Text>
          <TextInput
            className={`border border-gray-300 rounded-lg px-4 py-3 text-base bg-white ${
              disabled ? 'bg-gray-100 text-gray-500' : ''
            }`}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={envApiKey ? "••••••••••••" : "lsv2_pt_..."}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
            editable={!disabled}
          />
          {envApiKey && !apiKey && (
            <Text className="text-xs text-blue-500 mt-1 italic">Using environment variable</Text>
          )}
        </View>
      </View>

      <View className="gap-3">
        <TouchableOpacity
          className={`${
            disabled ? 'bg-gray-400' : 'bg-blue-500'
          } rounded-lg py-4 items-center`}
          onPress={handleSave}
          disabled={disabled}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-semibold">Save Configuration</Text>
          )}
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            className={`border ${
              disabled ? 'border-gray-400' : 'border-blue-500'
            } rounded-lg py-4 items-center`}
            onPress={onCancel}
            disabled={disabled}
          >
            <Text className={`text-base font-semibold ${
              disabled ? 'text-gray-400' : 'text-blue-500'
            }`}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
