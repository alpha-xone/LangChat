import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Theme } from '../../theme';

interface LoadingDotsProps {
  theme: Theme;
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export function LoadingDots({ theme, size = 'medium', text = 'AI is typing...' }: LoadingDotsProps) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  const sizeMap = {
    small: { fontSize: 12, iconSize: 14, dotSize: 4 },
    medium: { fontSize: 14, iconSize: 16, dotSize: 6 },
    large: { fontSize: 16, iconSize: 18, dotSize: 8 },
  };

  const currentSize = sizeMap[size];

  useEffect(() => {
    const animateDots = () => {
      const sequence = Animated.sequence([
        Animated.timing(dot1Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]);

      Animated.loop(sequence).start();
    };

    animateDots();
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
      }}>
        {[dot1Anim, dot2Anim, dot3Anim].map((anim, index) => (
          <Animated.View
            key={index}
            style={{
              width: currentSize.dotSize,
              height: currentSize.dotSize,
              borderRadius: currentSize.dotSize / 2,
              backgroundColor: theme.text + '60',
              marginHorizontal: 1,
              opacity: anim,
            }}
          />
        ))}
      </View>
      <Text style={{
        color: theme.text + '60',
        fontSize: currentSize.fontSize,
        fontStyle: 'italic',
      }}>
        {text}
      </Text>
    </View>
  );
}