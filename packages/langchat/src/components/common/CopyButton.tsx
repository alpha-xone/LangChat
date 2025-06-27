import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';
import { useFeedbackAnimation } from '../../lib/utils/animation-utils';
import { copyToClipboard } from '../../lib/utils/clipboard-utils';
import { Theme } from '../../theme';

interface CopyButtonProps {
  text: string;
  theme: Theme;
  size?: 'small' | 'medium' | 'large';
  onCopy?: (text: string) => void;
  style?: any;
}

export function CopyButton({
  text,
  theme,
  size = 'medium',
  onCopy,
  style
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { scaleAnim, triggerFeedback } = useFeedbackAnimation();

  const sizeMap = {
    small: { icon: 12, text: 10, padding: 6 },
    medium: { icon: 16, text: 12, padding: 8 },
    large: { icon: 20, text: 14, padding: 10 },
  };

  const currentSize = sizeMap[size];

  const handleCopy = async () => {
    if (!text) return;

    const success = await copyToClipboard(text);
    if (success) {
      onCopy?.(text);
      setIsCopied(true);
      triggerFeedback();

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderRadius: currentSize.padding,
          paddingHorizontal: currentSize.padding,
          paddingVertical: currentSize.padding / 2,
          borderWidth: 1,
          borderColor: theme.border + '60',
        },
        style
      ]}
      onPress={handleCopy}
    >
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Ionicons
          name={isCopied ? "checkmark" : "copy-outline"}
          size={currentSize.icon}
          color={isCopied ? theme.success : theme.text + '80'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}