import { useTheme } from '@/theme/ThemeContext';
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
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message..."
}: ChatInputProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim().length === 0 || disabled) return;

    onSendMessage(input.trim());
    setInput('');
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
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
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
      </View>
    </KeyboardAvoidingView>
  );
}
