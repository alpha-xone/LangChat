import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, visible, onHide, duration = 2000 }: ToastProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, scaleAnim, onHide, duration]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: screenHeight / 2,
        left: screenWidth / 2,
        zIndex: 1000,
        opacity: fadeAnim,
        transform: [
          { translateX: -screenWidth / 3 },
          { translateY: -150 },
          { scale: scaleAnim }
        ],
      }}
    >
      <View
        style={{
          backgroundColor: theme.text + '90',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 3,
          shadowColor: theme.text,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          minWidth: screenWidth / 2,
        }}
      >
        <Ionicons
          name="checkmark-circle"
          size={16}
          color={theme.background}
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            color: theme.background,
            fontSize: 16,
            fontWeight: '500',
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}