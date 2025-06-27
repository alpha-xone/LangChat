import React from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import { Theme } from '../../theme';

interface MessageBubbleProps {
  children: React.ReactNode;
  theme: Theme;
  showBubble?: boolean;
  isUser?: boolean;
  maxWidth?: DimensionValue;
  style?: ViewStyle;
}

export function MessageBubble({
  children,
  theme,
  showBubble = true,
  isUser = false,
  maxWidth = '85%',
  style,
}: MessageBubbleProps) {
  const bubbleStyles: ViewStyle = {
    maxWidth: showBubble ? maxWidth : '95%',
    backgroundColor: showBubble
      ? (isUser ? theme.primary : theme.surface)
      : 'transparent',
    borderRadius: showBubble ? 12 : 0,
    paddingHorizontal: showBubble ? 15 : 8,
    paddingVertical: showBubble ? 3 : 0,
    elevation: showBubble ? 2 : 0,
    shadowColor: showBubble ? theme.surface : 'transparent',
    shadowOffset: showBubble ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: showBubble ? 0.2 : 0,
    shadowRadius: showBubble ? 4 : 0,
    ...style,
  };

  return <View style={bubbleStyles}>{children}</View>;
}