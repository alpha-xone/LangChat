import { Theme } from '../../theme';
import { getMonospaceFont } from './platform-utils';

export const createMarkdownStyles = (theme: Theme, showBubble: boolean = false, isUser: boolean = false) => {
  const textColor = isUser && showBubble ? '#FFFFFF' : theme.text;

  return {
    body: {
      color: textColor,
      fontSize: 16,
      margin: 0,
    },
    paragraph: {
      color: textColor,
      fontSize: 16,
      lineHeight: 24,
      marginTop: showBubble ? 3 : 0,
      marginBottom: showBubble ? 5 : 0,
    },
    heading1: {
      color: textColor,
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    heading2: {
      color: textColor,
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 6,
    },
    heading3: {
      color: textColor,
      fontSize: 18,
      fontWeight: 'bold',
      marginVertical: 4,
    },
    strong: {
      fontWeight: 'bold',
      color: textColor,
    },
    em: {
      fontStyle: 'italic',
      color: textColor,
    },
    code_inline: {
      backgroundColor: isUser && showBubble ? 'rgba(255,255,255,0.2)' : theme.surface,
      color: isUser && showBubble ? '#FFFFFF' : theme.primary,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      fontSize: 14,
      fontFamily: getMonospaceFont(),
      borderWidth: 1,
      borderColor: isUser && showBubble ? 'rgba(255,255,255,0.3)' : theme.border + '40',
    },
    blockquote: {
      backgroundColor: isUser && showBubble ? 'rgba(255,255,255,0.1)' : theme.surface,
      borderLeftWidth: 4,
      borderLeftColor: isUser && showBubble ? '#FFFFFF' : theme.primary,
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
      fontStyle: 'italic',
    },
    list_item: {
      fontSize: 16,
      lineHeight: 24,
      color: textColor,
      marginBottom: 4,
    },
    link: {
      color: isUser && showBubble ? '#FFFFFF' : theme.primary,
      textDecorationLine: 'underline',
    },
    table: {
      borderWidth: 1,
      borderColor: theme.border,
      marginVertical: 8,
    },
    thead: {
      backgroundColor: theme.surface,
    },
    th: {
      color: textColor,
      fontWeight: 'bold',
      padding: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    td: {
      color: textColor,
      padding: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tr: {
      backgroundColor: 'transparent',
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
  };
};