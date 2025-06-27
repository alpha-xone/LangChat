import LucideIcon from '@react-native-vector-icons/lucide';
import React, { useRef, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../theme';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopStreaming: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  theme: Theme;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  disabled = false,
  isStreaming = false,
  placeholder = "Type a message...",
  theme,
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const canSend = message.trim() && !disabled;

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
          fontSize: 16,
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
            padding: 12,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={onStopStreaming}
        >
          <LucideIcon
            name="circle-stop"
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={{
            backgroundColor: canSend ? theme.primary : theme.border,
            borderRadius: 20,
            padding: 12,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={handleSend}
          disabled={!canSend}
        >
          <LucideIcon
            name="send"
            size={20}
            color={canSend ? '#ffffff' : theme.text}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};
