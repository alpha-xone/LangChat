import { useRef } from 'react';
import { Animated } from 'react-native';

export const createScaleAnimation = (
  scaleValue: Animated.Value,
  toValue: number = 1.2,
  duration: number = 150
) => {
  return Animated.sequence([
    Animated.timing(scaleValue, {
      toValue,
      duration,
      useNativeDriver: true,
    }),
    Animated.timing(scaleValue, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    })
  ]);
};

export const useFeedbackAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const triggerFeedback = (scale = 1.2, duration = 150) => {
    createScaleAnimation(scaleAnim, scale, duration).start();
  };

  return { scaleAnim, triggerFeedback };
};
