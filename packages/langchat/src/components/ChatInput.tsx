import React, { useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../theme';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopStreaming: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  theme: Theme; // Add theme prop
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  disabled = false,
  isStreaming = false,
  placeholder = "Type a message...",
  theme, // Receive theme prop
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={{
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      alignItems: 'flex-end',
      gap: 8,
    }}>
      <TextInput
        ref={inputRef}
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: theme.surface,
          color: theme.text,
          maxHeight: 100,
        }}
        value={message}
        onChangeText={setMessage}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        multiline
        textAlignVertical="center"
        editable={!disabled}
      />

      {isStreaming ? (
        <TouchableOpacity
          style={{
            backgroundColor: theme.error,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          onPress={onStopStreaming}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>
            Stop
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={{
            backgroundColor: message.trim() && !disabled ? theme.primary : theme.border,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          onPress={handleSend}
          disabled={!message.trim() || disabled}
        >
          <Text style={{
            color: message.trim() && !disabled ? '#ffffff' : theme.text,
            fontWeight: '600'
          }}>
            Send
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
