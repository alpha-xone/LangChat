import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LangGraphDemo, SimpleChat, useLangGraphSimple, useAppTheme } from 'langchat';
import type { ParsedMessage } from 'langchat';
import { ConfigDebug } from './ConfigDebug';

export interface LangGraphExampleProps {
  onBack?: () => void;
}

/**
 * Example component showing different ways to use LangGraph integration
 */
export const LangGraphExample: React.FC<LangGraphExampleProps> = ({ onBack }) => {
  const { theme } = useAppTheme();
  const [view, setView] = useState<'demo' | 'simple' | 'custom' | 'debug'>('debug'); // Start with debug
  const [customMessages, setCustomMessages] = useState<string[]>([]);

  // Custom hook usage example
  const {
    isConnected,
    isStreaming,
    sendMessage,
    createThread,
    error
  } = useLangGraphSimple(
    (message: ParsedMessage) => {
      if (view === 'custom') {
        setCustomMessages(prev => [...prev, `AI: ${message.content}`]);
      }
    },
    (error: Error) => {
      Alert.alert('LangGraph Error', error.message);
    }
  );

  const handleCustomMessage = async () => {
    try {
      if (!isConnected) {
        Alert.alert('Not Connected', 'Please wait for connection to LangGraph');
        return;
      }

      const message = "Tell me a short joke";
      setCustomMessages(prev => [...prev, `User: ${message}`]);

      const threadId = await createThread();
      await sendMessage(message, threadId);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: theme.fontSizes.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    tab: {
      flex: 1,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      color: theme.colors.text,
      fontSize: theme.fontSizes.sm,
      fontWeight: '500',
    },
    activeTabText: {
      color: theme.colors.background,
    },
    backButton: {
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    backButtonText: {
      color: theme.colors.background,
      fontWeight: '500',
    },
    content: {
      flex: 1,
    },
    customContainer: {
      flex: 1,
      padding: theme.spacing.md,
    },
    statusText: {
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    connectionStatus: {
      fontWeight: 'bold',
      color: isConnected ? theme.colors.success : theme.colors.error,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    sendButtonText: {
      color: theme.colors.background,
      fontSize: theme.fontSizes.md,
      fontWeight: '500',
    },
    disabledButton: {
      opacity: 0.5,
    },
    messagesContainer: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    messageText: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      lineHeight: 18,
    },
    errorText: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.error,
      textAlign: 'center',
      margin: theme.spacing.md,
    },
  });

  const renderTabButton = (key: typeof view, label: string) => (
    <TouchableOpacity
      key={key}
      style={[styles.tab, view === key && styles.activeTab]}
      onPress={() => setView(key)}
    >
      <Text style={[styles.tabText, view === key && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (view) {
      case 'demo':
        return (
          <LangGraphDemo
            title="LangGraph Demo"
            subtitle="Full-featured demo with all LangGraph capabilities"
          />
        );

      case 'simple':
        return (
          <SimpleChat
            placeholder="Type your message to the AI..."
            maxLength={1000}
            onMessageSent={(message) => console.log('Sent:', message)}
            onMessageReceived={(message) => console.log('Received:', message)}
            onError={(error) => console.error('Chat error:', error)}
          />
        );

      case 'custom':
        return (
          <View style={styles.customContainer}>
            <Text style={styles.statusText}>
              Connection Status: <Text style={styles.connectionStatus}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </Text>

            <Text style={styles.statusText}>
              Streaming: {isStreaming ? 'Yes' : 'No'}
            </Text>

            {error && <Text style={styles.errorText}>Error: {error}</Text>}

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!isConnected || isStreaming) && styles.disabledButton
              ]}
              onPress={handleCustomMessage}
              disabled={!isConnected || isStreaming}
            >
              <Text style={styles.sendButtonText}>
                {isStreaming ? 'Sending...' : 'Send Test Message'}
              </Text>
            </TouchableOpacity>

            <View style={styles.messagesContainer}>
              {customMessages.length === 0 ? (
                <Text style={styles.messageText}>
                  No messages yet. Tap the button above to send a test message.
                </Text>
              ) : (
                customMessages.map((msg, index) => (
                  <Text key={index} style={styles.messageText}>
                    {msg}
                  </Text>
                ))
              )}
            </View>
          </View>
        );

      case 'debug':
        return (
          <View style={styles.customContainer}>
            <ConfigDebug />
            <Text style={styles.statusText}>
              Connection Status: <Text style={styles.connectionStatus}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </Text>
            {error && <Text style={styles.errorText}>Error: {error}</Text>}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LangGraph Integration Examples</Text>

        <View style={styles.tabContainer}>
          {renderTabButton('debug', 'Debug')}
          {renderTabButton('demo', 'Full Demo')}
          {renderTabButton('simple', 'Simple Chat')}
          {renderTabButton('custom', 'Custom Hook')}
        </View>

        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back to Examples</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};
