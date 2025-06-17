import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export interface ChatConfig {
  apiUrl: string;
  apiKey?: string;
  assistantId: string;
}

// Default configuration values
const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:2024',
  assistantId: 'agent',
  apiKey: '',
} as const;

// Function to get environment variables with defaults
const getEnvConfig = (): ChatConfig => {
  return {
    apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || DEFAULT_CONFIG.apiUrl,
    apiKey: process.env.EXPO_PUBLIC_LANGGRAPH_API_KEY || DEFAULT_CONFIG.apiKey,
    assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || DEFAULT_CONFIG.assistantId,
  };
};

export const useChatConfig = () => {
  const [config, setConfig] = useState<ChatConfig>({
    apiUrl: DEFAULT_CONFIG.apiUrl,
    apiKey: DEFAULT_CONFIG.apiKey,
    assistantId: DEFAULT_CONFIG.assistantId,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get environment variables with defaults
      const envConfig = getEnvConfig();
      console.log('Environment config loaded:', envConfig);

      // Load stored configuration
      const storedConfigString = await AsyncStorage.getItem('chatConfig');
      const storedConfig: Partial<ChatConfig> = storedConfigString
        ? JSON.parse(storedConfigString)
        : {};

      console.log('Stored config loaded:', storedConfig);

      // Merge: stored config overrides env config, env config overrides defaults
      const mergedConfig: ChatConfig = {
        apiUrl: storedConfig.apiUrl || envConfig.apiUrl,
        apiKey: storedConfig.apiKey || envConfig.apiKey,
        assistantId: storedConfig.assistantId || envConfig.assistantId,
      };

      console.log('Final merged config:', mergedConfig);
      setConfig(mergedConfig);

    } catch (error) {
      console.error('Error loading configuration:', error);
      // Fall back to environment variables with defaults
      const envConfig = getEnvConfig();
      setConfig(envConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback(async (newConfig: ChatConfig): Promise<boolean> => {
    try {
      await AsyncStorage.setItem('chatConfig', JSON.stringify(newConfig));
      setConfig(newConfig);
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      return false;
    }
  }, []);

  // Configuration is always considered valid now with defaults
  const isConfigured = !!(config.apiUrl && config.assistantId);

  return {
    config,
    isLoading,
    isConfigured,
    updateConfig,
    loadConfig, // Expose this for manual refresh
  };
};
