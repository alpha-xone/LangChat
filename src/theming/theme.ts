import { StyleSheet } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    // Chat specific colors
    userMessage: string;
    assistantMessage: string;
    systemMessage: string;
    messageText: string;
    messageTextSecondary: string;
    inputBackground: string;
    inputBorder: string;
    inputText: string;
    inputPlaceholder: string;
    sendButton: string;
    sendButtonDisabled: string;
    timestamp: string;
    avatar: string;
    attachmentBackground: string;
    attachmentBorder: string;
    loadingIndicator: string;
    errorMessage: string;
    retryButton: string;
    typingIndicator: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    lineHeight: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
  animation: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      in: string;
      out: string;
      inOut: string;
    };
  };
}

export const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#1C1C1E',
    textSecondary: '#6C6C70',
    border: '#E5E5EA',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
    // Chat specific colors
    userMessage: '#007AFF',
    assistantMessage: '#F2F2F7',
    systemMessage: '#FF9500',
    messageText: '#1C1C1E',
    messageTextSecondary: '#6C6C70',
    inputBackground: '#F8F9FA',
    inputBorder: '#E5E5EA',
    inputText: '#1C1C1E',
    inputPlaceholder: '#6C6C70',
    sendButton: '#007AFF',
    sendButtonDisabled: '#C7C7CC',
    timestamp: '#8E8E93',
    avatar: '#C7C7CC',
    attachmentBackground: '#F2F2F7',
    attachmentBorder: '#E5E5EA',
    loadingIndicator: '#C7C7CC',
    errorMessage: '#FF3B30',
    retryButton: '#007AFF',
    typingIndicator: '#8E8E93',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
    },
    lineHeight: {
      xs: 14,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
      xxl: 32,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      in: 'ease-in',
      out: 'ease-out',
      inOut: 'ease-in-out',
    },
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#99999D',
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    info: '#0A84FF',
    // Chat specific colors
    userMessage: '#0A84FF',
    assistantMessage: '#2C2C2E',
    systemMessage: '#FF9F0A',
    messageText: '#FFFFFF',
    messageTextSecondary: '#99999D',
    inputBackground: '#1C1C1E',
    inputBorder: '#38383A',
    inputText: '#FFFFFF',
    inputPlaceholder: '#99999D',
    sendButton: '#0A84FF',
    sendButtonDisabled: '#48484A',
    timestamp: '#8E8E93',
    avatar: '#48484A',
    attachmentBackground: '#2C2C2E',
    attachmentBorder: '#38383A',
    loadingIndicator: '#48484A',
    errorMessage: '#FF453A',
    retryButton: '#0A84FF',
    typingIndicator: '#8E8E93',
  },
};

export const createStyles = (theme: Theme) => StyleSheet.create({
  // Base styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  surface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontFamily: theme.typography.fontFamily.regular,
  },
  textSecondary: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.inputBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.inputText,
    fontFamily: theme.typography.fontFamily.regular,
  },
  // Chat specific styles
  chatContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  messageContainer: {
    marginVertical: theme.spacing.xs,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.userMessage,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    maxWidth: '80%',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.assistantMessage,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    maxWidth: '80%',
  },
  messageText: {
    color: theme.colors.messageText,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontFamily: theme.typography.fontFamily.regular,
  },
  messageTimestamp: {
    color: theme.colors.timestamp,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.inputBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.inputText,
    fontFamily: theme.typography.fontFamily.regular,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: theme.colors.sendButton,
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.sendButtonDisabled,
  },
  loadingIndicator: {
    color: theme.colors.loadingIndicator,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorMessage,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  retryButton: {
    backgroundColor: theme.colors.retryButton,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  retryButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  typingIndicator: {
    color: theme.colors.typingIndicator,
    fontSize: theme.typography.fontSize.sm,
    fontStyle: 'italic',
    padding: theme.spacing.sm,
  },
});

export default lightTheme;
