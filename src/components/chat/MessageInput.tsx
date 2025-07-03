import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import type { MessageInputProps, Attachment } from '../../types';
import { useAppTheme } from '../../theming/useAppTheme';
import { FileUpload } from './FileUpload';

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onFileUpload,
  placeholder = 'Type your message...',
  disabled = false,
  maxLength = 4000,
  autoFocus = false,
  allowFileUpload = true,
  allowVoiceInput = true,
  showTypingIndicator = true,
  onTyping,
  onStopTyping,
  threadId,
  replyToMessage,
  onCancelReply,
  draftMessage,
  onDraftChange,
  multiline = true,
  sendOnEnter = false,
  enableMentions = false,
  mentionableUsers = [],
  onMentionSelect,
  enableCommands = false,
  commands = [],
  onCommandSelect,
  enableAI = false,
  aiSuggestions = [],
}) => {
  const { theme } = useAppTheme();
  const [message, setMessage] = useState(draftMessage || '');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [commandQuery, setCommandQuery] = useState('');

  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keyboardHeightRef = useRef(0);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Handle draft changes
  useEffect(() => {
    if (onDraftChange) {
      onDraftChange(message);
    }
  }, [message, onDraftChange]);

  // Handle typing indicator
  useEffect(() => {
    if (showTypingIndicator && message.trim() && !isTyping) {
      setIsTyping(true);
      onTyping?.(threadId);
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
      onStopTyping?.(threadId);
    }

    // Clear typing after 3 seconds of no activity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onStopTyping?.(threadId);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping, onStopTyping, threadId, showTypingIndicator]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardHeightRef.current = event.endCoordinates.height;
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle mentions and commands
  const handleTextChange = useCallback((text: string) => {
    setMessage(text);

    // Check for mentions
    if (enableMentions && text.includes('@')) {
      const lastAtIndex = text.lastIndexOf('@');
      const query = text.substring(lastAtIndex + 1);
      if (query.length > 0 && !query.includes(' ')) {
        setMentionQuery(query);
        const filteredUsers = mentionableUsers.filter(user =>
          user.displayName?.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filteredUsers.map(u => u.displayName || u.email));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }

    // Check for commands
    if (enableCommands && text.startsWith('/')) {
      const queryParts = text.substring(1).split(' ');
      const query = queryParts[0];
      if (query) {
        setCommandQuery(query);
        const filteredCommands = commands.filter(cmd =>
          cmd.name.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filteredCommands.map(c => c.name));
        setShowSuggestions(true);
      }
    }

    // Hide suggestions if no special character
    if (!text.includes('@') && !text.startsWith('/')) {
      setShowSuggestions(false);
    }
  }, [enableMentions, enableCommands, mentionableUsers, commands]);

  const handleSend = useCallback(async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled || isSending) return;

    setIsSending(true);

    try {
      await onSendMessage(message.trim(), attachments, {
        replyToId: replyToMessage?.id,
        threadId,
        mentions: enableMentions ? extractMentions(message) : undefined,
      });

      setMessage('');
      setAttachments([]);
      setIsTyping(false);
      onStopTyping?.(threadId);

      if (replyToMessage) {
        onCancelReply?.();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [
    message,
    attachments,
    disabled,
    isSending,
    onSendMessage,
    replyToMessage,
    threadId,
    enableMentions,
    onStopTyping,
    onCancelReply
  ]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!onFileUpload) return;

    try {
      const uploadedAttachments = await onFileUpload(files);
      setAttachments(prev => [...prev, ...uploadedAttachments]);
    } catch (error) {
      console.error('Error uploading files:', error);
      Alert.alert('Error', 'Failed to upload files. Please try again.');
    } finally {
      setShowFileUpload(false);
    }
  }, [onFileUpload]);

  const handleKeyPress = useCallback((event: any) => {
    if (sendOnEnter && event.nativeEvent.key === 'Enter' && !event.nativeEvent.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [sendOnEnter, handleSend]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    if (mentionQuery) {
      const lastAtIndex = message.lastIndexOf('@');
      const newMessage = message.substring(0, lastAtIndex + 1) + suggestion + ' ' +
                         message.substring(lastAtIndex + 1 + mentionQuery.length);
      setMessage(newMessage);
      onMentionSelect?.(suggestion);
    } else if (commandQuery) {
      setMessage('/' + suggestion + ' ');
      onCommandSelect?.(suggestion);
    }
    setShowSuggestions(false);
  }, [message, mentionQuery, commandQuery, onMentionSelect, onCommandSelect]);

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  }, []);

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      if (match[1]) {
        mentions.push(match[1]);
      }
    }
    return mentions;
  };

  const canSend = !disabled && !isSending && (message.trim() || attachments.length > 0);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    replyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    replyContent: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    replyText: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
    },
    cancelReplyButton: {
      padding: theme.spacing.xs,
    },
    cancelReplyText: {
      color: theme.colors.error,
      fontSize: theme.typography.fontSize.small,
    },
    attachmentsContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    attachmentItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.xs,
      marginRight: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    attachmentText: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.text,
      marginRight: theme.spacing.xs,
    },
    removeAttachmentButton: {
      padding: theme.spacing.xs,
    },
    removeAttachmentText: {
      color: theme.colors.error,
      fontSize: theme.typography.fontSize.small,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      alignItems: 'flex-end',
    },
    inputWrapper: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.fontSize.medium,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: 120,
      textAlignVertical: 'top',
    },
    inputFocused: {
      borderColor: theme.colors.primary,
    },
    charCounter: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: theme.spacing.xs,
    },
    charCounterWarning: {
      color: theme.colors.warning,
    },
    charCounterError: {
      color: theme.colors.error,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    fileButton: {
      backgroundColor: theme.colors.surface,
    },
    voiceButton: {
      backgroundColor: theme.colors.secondary,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.border,
      opacity: 0.6,
    },
    buttonText: {
      color: theme.colors.surface,
      fontSize: theme.typography.fontSize.medium,
      fontWeight: '600',
    },
    suggestionsContainer: {
      position: 'absolute',
      bottom: '100%',
      left: 0,
      right: 0,
      maxHeight: 200,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      margin: theme.spacing.md,
    },
    suggestionItem: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    suggestionText: {
      fontSize: theme.typography.fontSize.medium,
      color: theme.colors.text,
    },
    aiSuggestionsContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    aiSuggestionItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    aiSuggestionText: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.text,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Reply indicator */}
      {replyToMessage && (
        <View style={styles.replyContainer}>
          <View style={styles.replyContent}>
            <Text style={styles.replyText}>
              Replying to {replyToMessage.senderName}: {replyToMessage.content.substring(0, 50)}...
            </Text>
          </View>
          <TouchableOpacity style={styles.cancelReplyButton} onPress={onCancelReply}>
            <Text style={styles.cancelReplyText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <ScrollView horizontal style={styles.attachmentsContainer} showsHorizontalScrollIndicator={false}>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentItem}>
              <Text style={styles.attachmentText}>{attachment.fileName}</Text>
              <TouchableOpacity
                style={styles.removeAttachmentButton}
                onPress={() => removeAttachment(attachment.id)}
              >
                <Text style={styles.removeAttachmentText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* AI Suggestions */}
      {enableAI && aiSuggestions.length > 0 && (
        <View style={styles.aiSuggestionsContainer}>
          {aiSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.aiSuggestionItem}
              onPress={() => setMessage(suggestion)}
            >
              <Text style={styles.aiSuggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              inputRef.current?.isFocused() && styles.inputFocused,
            ]}
            value={message}
            onChangeText={handleTextChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            multiline={multiline}
            editable={!disabled}
            maxLength={maxLength}
            textAlignVertical="top"
            autoFocus={autoFocus}
            blurOnSubmit={false}
            returnKeyType={sendOnEnter ? 'send' : 'default'}
            autoCorrect={true}
            autoCapitalize="sentences"
            spellCheck={true}
          />
          {maxLength && (
            <Text style={[
              styles.charCounter,
              message.length > maxLength * 0.8 && styles.charCounterWarning,
              message.length > maxLength * 0.95 && styles.charCounterError,
            ]}>
              {message.length}/{maxLength}
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          {allowFileUpload && (
            <TouchableOpacity
              style={[styles.actionButton, styles.fileButton]}
              onPress={() => setShowFileUpload(true)}
              disabled={disabled}
            >
              <Text style={styles.buttonText}>📎</Text>
            </TouchableOpacity>
          )}

          {allowVoiceInput && (
            <TouchableOpacity
              style={[styles.actionButton, styles.voiceButton]}
              onPress={() => setIsRecording(!isRecording)}
              disabled={disabled}
            >
              <Text style={styles.buttonText}>{isRecording ? '⏹' : '🎙'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onFileSelect={handleFileUpload}
          maxFiles={5}
          maxSize={10 * 1024 * 1024} // 10MB
          acceptedTypes={['image/*', 'application/pdf', 'text/*']}
        />
      )}
    </KeyboardAvoidingView>
  );
};
