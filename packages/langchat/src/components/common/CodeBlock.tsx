import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { extractCodeLanguage, getMonospaceFont } from '../../lib/utils';
import { Theme } from '../../theme';
import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  theme: Theme;
  maxHeight?: number;
  showHeader?: boolean;
  onCopy?: (text: string) => void;
}

export function CodeBlock({
  code,
  language = 'text',
  theme,
  maxHeight = 300,
  showHeader = true,
  onCopy
}: CodeBlockProps) {
  const normalizedLanguage = extractCodeLanguage(language);
  const isDarkMode = theme.background === '#000000' ||
                     theme.background === '#121212' ||
                     theme.text === '#ffffff';

  const codeBackgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';

  return (
    <View style={{
      marginVertical: 6,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border + '40',
    }}>
      {showHeader && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.surface,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderBottomWidth: 1,
          borderBottomColor: theme.border + '30',
        }}>
          <Text style={{
            color: theme.text + '80',
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {normalizedLanguage.toUpperCase()}
          </Text>
          <CopyButton
            text={code}
            theme={theme}
            size="small"
            onCopy={onCopy}
          />
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        nestedScrollEnabled={true}
        style={{
          backgroundColor: codeBackgroundColor,
          maxHeight,
        }}
        contentContainerStyle={{
          padding: 12,
          minWidth: '100%',
        }}
      >
        <ScrollView
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          style={{ flex: 1 }}
        >
          <Text style={{
            fontSize: 13,
            lineHeight: 18,
            color: isDarkMode ? '#e0e0e0' : '#2d2d2d',
            fontFamily: getMonospaceFont(),
          }}>
            {code}
          </Text>
        </ScrollView>
      </ScrollView>
    </View>
  );
}