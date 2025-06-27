import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../theme';

interface HeaderProps {
  title?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  theme: Theme;
  showBorder?: boolean;
}

export function Header({
  title = 'Chat',
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  theme,
  showBorder = true,
}: HeaderProps) {
  return (
    <SafeAreaView style={{ backgroundColor: theme.background }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.background,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: theme.border,
        ...Platform.select({
          ios: {
            shadowColor: theme.shadow || '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          },
          android: {
            elevation: 2,
          },
        }),
      }}>
        {/* Left Button */}
        <View style={{ width: 40, alignItems: 'flex-start' }}>
          {leftIcon && onLeftPress && (
            <TouchableOpacity
              onPress={onLeftPress}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: theme.surface,
              }}
            >
              <Ionicons
                name={leftIcon}
                size={20}
                color={theme.text}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.text,
          textAlign: 'center',
          flex: 1,
        }}>
          {title}
        </Text>

        {/* Right Button */}
        <View style={{ width: 40, alignItems: 'flex-end' }}>
          {rightIcon && onRightPress && (
            <TouchableOpacity
              onPress={onRightPress}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: theme.surface,
              }}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={theme.text}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}