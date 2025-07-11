import React from 'react';
import { View, ViewStyle } from 'react-native';

interface MessageContainerProps {
  children: React.ReactNode;
  isUser?: boolean;
  style?: ViewStyle;
}

export function MessageContainer({
  children,
  isUser = false,
  style
}: MessageContainerProps) {
  return (
    <View style={[
      {
        padding: 4,
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginRight: isUser ? 5 : 0,
      },
      style
    ]}>
      {children}
    </View>
  );
}