import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export interface ChatConfig {
  apiUrl: string;
  apiKey?: string;
  assistantId: string;
}

// Function to get environment variables
const getEnvConfig = (): Partial<ChatConfig> => {
  return {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
    apiKey: process.env.EXPO_PUBLIC_API_KEY || '',
    assistantId: process.env.EXPO_PUBLIC_ASSISTANT_ID || '',
  };
};

export const useChatConfig = () => {
  const [config, setConfig] = useState<ChatConfig>({
    apiUrl: '',
    apiKey: '',
    assistantId: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get environment variables
      const envConfig = getEnvConfig();
      console.log('Environment config loaded:', envConfig);

      // Load stored configuration
      const storedConfigString = await AsyncStorage.getItem('chatConfig');
      const storedConfig: Partial<ChatConfig> = storedConfigString
        ? JSON.parse(storedConfigString)
        : {};

      console.log('Stored config loaded:', storedConfig);

      // Merge: stored config overrides env config
      const mergedConfig: ChatConfig = {
        apiUrl: storedConfig.apiUrl || envConfig.apiUrl || '',
        apiKey: storedConfig.apiKey || envConfig.apiKey || '',
        assistantId: storedConfig.assistantId || envConfig.assistantId || '',
      };

      console.log('Final merged config:', mergedConfig);
      setConfig(mergedConfig);

    } catch (error) {
      console.error('Error loading configuration:', error);
      // Fall back to environment variables only
      const envConfig = getEnvConfig();
      setConfig({
        apiUrl: envConfig.apiUrl || '',
        apiKey: envConfig.apiKey || '',
        assistantId: envConfig.assistantId || '',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const isConfigured = !!(config.apiUrl && config.assistantId);

  return {
    config,
    isLoading,
    isConfigured,
    updateConfig,
    loadConfig, // Expose this for manual refresh
  };
};
