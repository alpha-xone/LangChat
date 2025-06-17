import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { Theme } from '../../theme';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
  theme: Theme; // Add theme prop
}

export function Toast({ message, visible, onHide, duration = 2000, theme }: ToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible, duration, fadeAnim, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: theme.surface,
        borderRadius: 8,
        padding: 16,
        opacity: fadeAnim,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: theme.border,
        zIndex: 1000,
      }}
    >
      <Text style={{
        color: theme.text,
        fontSize: 14,
        textAlign: 'center',
      }}>
        {message}
      </Text>
    </Animated.View>
  );
}