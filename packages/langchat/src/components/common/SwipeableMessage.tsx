import LucideIcon from '@react-native-vector-icons/lucide';
import React, { useRef } from 'react';
import {
    Animated
} from 'react-native';
import {
    PanGestureHandler,
    PanGestureHandlerGestureEvent,
    State,
} from 'react-native-gesture-handler';
import { Theme } from '../../theme';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onDelete: () => void;
  theme: Theme;
  disabled?: boolean;
}

export function SwipeableMessage({
  children,
  onDelete,
  theme,
  disabled = false
}: SwipeableMessageProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const gestureState = useRef({
    swiping: false,
    initialX: 0,
    initialY: 0,
    hasPassedThreshold: false
  });

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    {
      useNativeDriver: true,
      listener: (event: PanGestureHandlerGestureEvent) => {
        const { translationX, translationY } = event.nativeEvent;

        // Calculate if this is primarily a horizontal gesture
        const horizontalDistance = Math.abs(translationX);
        const verticalDistance = Math.abs(translationY);
        const minSwipeThreshold = 20; // Minimum horizontal distance to consider as swipe

        // Only start horizontal swiping if horizontal movement exceeds threshold
        // and is greater than vertical movement
        if (horizontalDistance > minSwipeThreshold && horizontalDistance > verticalDistance) {
          gestureState.current.swiping = true;
          gestureState.current.hasPassedThreshold = true;
        }
      }
    }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { state, translationX } = event.nativeEvent;

    if (disabled) return;

    if (state === State.BEGAN) {
      gestureState.current.hasPassedThreshold = false;
      gestureState.current.swiping = false;
    }

    if (state === State.END) {
      const deleteThreshold = -60; // Reduced threshold for easier deletion

      console.log('Swipe ended:', {
        translationX,
        hasPassedThreshold: gestureState.current.hasPassedThreshold,
        deleteThreshold,
        willDelete: gestureState.current.hasPassedThreshold && translationX < deleteThreshold
      });

      // Only process delete if we've passed the minimum swipe threshold
      if (gestureState.current.hasPassedThreshold && translationX < deleteThreshold) {
        // Delete action
        Animated.timing(translateX, {
          toValue: -300,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDelete();
        });
      } else {
        // Snap back to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }

      // Reset state
      gestureState.current.swiping = false;
      gestureState.current.hasPassedThreshold = false;
    }
  };

  const deleteIconOpacity = translateX.interpolate({
    inputRange: [-100, -50, 0],
    outputRange: [1, 0.7, 0],
    extrapolate: 'clamp',
  });

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      enabled={!disabled}
      activeOffsetX={[-10, 10]} // Reduce threshold to 10px for more responsive activation
      failOffsetY={[-15, 15]} // Allow more vertical movement before failing
    >
      <Animated.View style={{ flex: 1 }}>
        {/* Delete background - only visible when swiping */}
        <Animated.View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            backgroundColor: theme.error || '#ff4444',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: deleteIconOpacity,
          }}
        >
          <LucideIcon
            name="trash"
            size={20}
            color="#fff"
          />
        </Animated.View>

        {/* Message content */}
        <Animated.View
          style={{
            transform: [{ translateX }],
            backgroundColor: theme.background,
          }}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
}
