import React from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';

export interface SimpleIconProps {
  name: 'send' | 'message' | 'alert' | 'stop' | 'retry' | 'settings';
  size?: number;
  color?: string;
  style?: TextStyle;
}

/**
 * Simple icon component using Unicode symbols
 * Alternative to lucide-react-native for basic icons
 */
export const SimpleIcon: React.FC<SimpleIconProps> = ({
  name,
  size = 20,
  color = '#000000',
  style
}) => {
  const getIconSymbol = (iconName: string): string => {
    const icons: Record<string, string> = {
      'send': '▶',
      'message': '💬',
      'alert': '⚠',
      'stop': '⏹',
      'retry': '🔄',
      'settings': '⚙',
    };
    return icons[iconName] || '?';
  };

  return (
    <Text
      style={[
        {
          fontSize: size,
          color,
          fontWeight: 'bold',
        },
        style,
      ]}
    >
      {getIconSymbol(name)}
    </Text>
  );
};
