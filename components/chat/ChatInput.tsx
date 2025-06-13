import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopStreaming?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onStopStreaming,
  disabled = false,
  isStreaming = false,
  placeholder = "Type a message..."
}: ChatInputProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim().length === 0 || disabled) return;

    onSendMessage(input.trim());
    setInput('');
  };

  const handleStop = () => {
    if (onStopStreaming) {
      onStopStreaming();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: theme.border || theme.text + '20',
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        gap: 12,
      }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border || theme.text + '30',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 16,
            maxHeight: 100,
            backgroundColor: theme.surface || theme.background,
            color: theme.text,
            ...(disabled && {
              backgroundColor: theme.text + '10',
              color: theme.text + '60',
            }),
          }}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={theme.text + '60'}
          multiline
          maxLength={1000}
          editable={!disabled && !isStreaming}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        {isStreaming ? (
          <TouchableOpacity
            style={{
              backgroundColor: theme.error || '#FF3B30',
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
            onPress={handleStop}
          >
            <Ionicons name="stop" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: (!input.trim() || disabled)
                ? theme.text + '30'
                : theme.primary,
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSend}
            disabled={!input.trim() || disabled}
          >
            <Text style={{
              color: (!input.trim() || disabled)
                ? theme.text + '60'
                : '#FFFFFF',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Send
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
