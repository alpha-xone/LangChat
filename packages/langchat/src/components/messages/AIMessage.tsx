import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useState } from 'react';
import { Animated, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getContentString } from '../../lib/message-utils';
import { Theme } from '../../theme';

interface AIMessageProps {
  message: Message;
  isLoading?: boolean;
  onCopy?: (text: string) => void;
  theme: Theme;
  showBubble?: boolean;
}

export function AIMessage({ message, isLoading = false, onCopy, theme, showBubble = false }: AIMessageProps) {
  const displayContent = getContentString(message?.content);
  const [isCopied, setIsCopied] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCopy = async () => {
    if (!displayContent) return;

    try {
      await Clipboard.setStringAsync(displayContent);
      onCopy?.(displayContent);

      // Show copied state with animation
      setIsCopied(true);

      // Scale animation for feedback
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();

      // Reset back to copy icon after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }  };  if (isLoading) {
    return (
      <View style={{
        padding: 4,
        alignItems: 'flex-start',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: showBubble ? theme.surface : 'transparent',
          borderRadius: showBubble ? 18 : 0,
          padding: showBubble ? 12 : 0,
          elevation: showBubble ? 2 : 0,
          shadowColor: showBubble ? theme.surface : 'transparent',
          shadowOffset: showBubble ? { width: 0, height: 2 } : { width: 0, height: 0 },
          shadowOpacity: showBubble ? 0.2 : 0,
          shadowRadius: showBubble ? 4 : 0,
        }}>
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color={theme.text + '60'}
          />
          <Text style={{
            color: theme.text + '60',
            fontSize: 14,
            marginLeft: 8,
            fontStyle: 'italic',
          }}>
            AI is typing...
          </Text>
        </View>
      </View>
    );
  }
  if (!message) return null;
  // Syntax highlighting function that returns React elements
  const renderSyntaxHighlighted = (code: string, language: string, isDarkMode: boolean) => {
    if (!code) return null;

    const lines = code.split('\n');
    const keywordColor = isDarkMode ? '#569cd6' : '#0000ff';
    const stringColor = isDarkMode ? '#ce9178' : '#a31515';
    const commentColor = isDarkMode ? '#6a9955' : '#008000';
    const numberColor = isDarkMode ? '#b5cea8' : '#098658';
    const defaultColor = isDarkMode ? '#e0e0e0' : '#2d2d2d';

    interface MatchType {
      start: number;
      end: number;
      text: string;
      color: string;
      type: string;
    }

    interface TokenType {
      text: string;
      color: string;
      key: string;
    }

    const getLanguageKeywords = (lang: string) => {
      switch (lang.toLowerCase()) {
        case 'sql':
          return /\b(create|table|select|from|where|insert|update|delete|drop|alter|grant|primary|key|references|on|cascade|function|returns|trigger|language|security|definer|set|begin|end|into|values|coalesce|uuid|text|as|public|varchar|int|boolean|timestamp|null|not|unique|index|constraint)\b/gi;
        case 'javascript':
        case 'js':
        case 'typescript':
        case 'ts':
          return /\b(const|let|var|function|if|else|for|while|return|import|export|class|interface|type|async|await|try|catch|finally|typeof|instanceof|new|this|super|extends|implements|public|private|protected|static)\b/g;
        case 'python':
        case 'py':
          return /\b(def|class|if|elif|else|for|while|return|import|from|try|except|finally|with|as|lambda|yield|and|or|not|in|is|None|True|False|self|super|__init__)\b/g;
        case 'java':
          return /\b(public|private|protected|static|final|class|interface|extends|implements|import|package|if|else|for|while|do|switch|case|default|try|catch|finally|throw|throws|new|this|super|return|void|int|String|boolean|double|float|long|char)\b/g;
        case 'c':
        case 'c++':
          return /\b(include|define|if|else|for|while|do|switch|case|default|return|void|int|char|float|double|struct|typedef|enum|const|static|extern|auto|register|volatile|sizeof|break|continue|goto)\b/g;
        default:
          return null;
      }
    };

    const highlightLine = (line: string, lineIndex: number): TokenType[] => {
      const tokens: TokenType[] = [];
      let currentIndex = 0;

      // Patterns for different syntax elements
      const patterns = [
        { regex: getLanguageKeywords(language), color: keywordColor, type: 'keyword' },
        { regex: /"([^"\\]*(\\.[^"\\]*)*)"/g, color: stringColor, type: 'string' },
        { regex: /'([^'\\]*(\\.[^'\\]*)*)'/g, color: stringColor, type: 'string' },
        { regex: /\/\/.*$/g, color: commentColor, type: 'comment' },
        { regex: /#.*$/g, color: commentColor, type: 'comment' },
        { regex: /--.*$/g, color: commentColor, type: 'comment' },
        { regex: /\/\*[\s\S]*?\*\//g, color: commentColor, type: 'comment' },
        { regex: /\b\d+\.?\d*\b/g, color: numberColor, type: 'number' },
      ].filter(p => p.regex);

      // Find all matches
      const matches: MatchType[] = [];
      patterns.forEach(pattern => {
        if (pattern.regex) {
          let match;
          const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0],
              color: pattern.color,
              type: pattern.type
            });
          }
        }
      });

      // Sort matches by start position
      matches.sort((a, b) => a.start - b.start);

      // Remove overlapping matches (keep the first one)
      const filteredMatches: MatchType[] = [];
      let lastEnd = 0;
      matches.forEach(match => {
        if (match.start >= lastEnd) {
          filteredMatches.push(match);
          lastEnd = match.end;
        }
      });

      // Build tokens
      filteredMatches.forEach((match, index) => {
        // Add text before match
        if (match.start > currentIndex) {
          tokens.push({
            text: line.substring(currentIndex, match.start),
            color: defaultColor,
            key: `${lineIndex}-${index}-before`
          });
        }

        // Add highlighted match
        tokens.push({
          text: match.text,
          color: match.color,
          key: `${lineIndex}-${index}-match`
        });

        currentIndex = match.end;
      });

      // Add remaining text
      if (currentIndex < line.length) {
        tokens.push({
          text: line.substring(currentIndex),
          color: defaultColor,
          key: `${lineIndex}-end`
        });
      }

      // If no matches, return the whole line
      if (tokens.length === 0) {
        tokens.push({
          text: line,
          color: defaultColor,
          key: `${lineIndex}-plain`
        });
      }

      return tokens;
    };    return (
      <View>
        {lines.map((line, lineIndex) => {
          const tokens = highlightLine(line, lineIndex);
          return (
            <View key={lineIndex} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {tokens.map(token => (
                <Text
                  key={token.key}
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    color: token.color,
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }}
                  selectable={true}
                >
                  {token.text}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  // Custom renderer for code blocks to make them horizontally scrollable
  const renderCodeBlock = (node: any, children: any, parent: any, styles: any) => {
    // Extract language from node attributes with better detection
    let language = node.sourceInfo || node.lang || node.language || 'text';

    // Handle common language aliases
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'sh': 'shell',
      'bash': 'shell',
      'yml': 'yaml',
      'json': 'json',
      'md': 'markdown',
      'html': 'html',
      'css': 'css',
      'sql': 'sql',
      'c': 'c',
      'cpp': 'c++',
      'java': 'java',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rust': 'rust',
      'swift': 'swift',
      'kotlin': 'kotlin',
    };

    language = languageMap[language.toLowerCase()] || language;

    const codeContent = node.content || '';

    // Better dark mode detection
    const isDarkMode = theme.background === '#000000' ||
                      theme.background === '#121212' ||
                      theme.background.toLowerCase().includes('dark') ||
                      (theme.text === '#ffffff' || theme.text === '#FFFFFF');

    const codeBackgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';

    return (
      <View style={{
        marginVertical: 6,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border + '40',
      }}>
        {/* Header with language and copy button */}
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
            {language.toUpperCase()}
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.background + '80',
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 3,
            }}
            onPress={() => {
              Clipboard.setStringAsync(codeContent);
            }}
          >
            <Ionicons
              name="copy-outline"
              size={12}
              color={theme.text + '80'}
            />
            <Text style={{
              color: theme.text + '80',
              fontSize: 10,
              marginLeft: 3,
              fontWeight: '500',
            }}>
              Copy
            </Text>
          </TouchableOpacity>
        </View>
          {/* Code content */}        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          nestedScrollEnabled={true}
          style={{
            backgroundColor: codeBackgroundColor,
            maxHeight: 300,
          }}
          contentContainerStyle={{
            padding: 12,
            minWidth: '100%',
          }}
        >          <ScrollView
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            style={{ flex: 1 }}
          >
            {renderSyntaxHighlighted(codeContent, language, isDarkMode)}
          </ScrollView>
        </ScrollView>
      </View>
    );
  };return (
    <View style={{
      padding: 4,
      alignItems: 'flex-start',
    }}>
      <View style={{
        maxWidth: showBubble ? '85%' : '95%',
        backgroundColor: showBubble ? theme.surface : 'transparent',
        borderRadius: showBubble ? 18 : 0,
        paddingHorizontal: showBubble ? 15 : 8,
        paddingVertical: showBubble ? 5 : 0,
        elevation: showBubble ? 2 : 0,
        shadowColor: showBubble ? theme.surface : 'transparent',
        shadowOffset: showBubble ? { width: 0, height: 2 } : { width: 0, height: 0 },
        shadowOpacity: showBubble ? 0.2 : 0,
        shadowRadius: showBubble ? 4 : 0,
      }}>
        <Markdown
          style={{
            body: {
              color: theme.text,
              fontSize: 16,
              margin: 0,
            },
            paragraph: {
              color: theme.text,
              fontSize: 16,
              lineHeight: 24,
              marginTop: showBubble ? 3 : 0,
              marginBottom: showBubble ? 5 : 0,
            },
            strong: {
              fontWeight: 'bold',
              color: theme.text,
            },
            em: {
              fontStyle: 'italic',
              color: theme.text,
            },            code_inline: {
              backgroundColor: (theme.background === '#000000' ||
                              theme.background === '#121212' ||
                              theme.background.toLowerCase().includes('dark') ||
                              (theme.text === '#ffffff' || theme.text === '#FFFFFF')) ? '#2a2a2a' : '#f0f0f0',
              color: (theme.background === '#000000' ||
                     theme.background === '#121212' ||
                     theme.background.toLowerCase().includes('dark') ||
                     (theme.text === '#ffffff' || theme.text === '#FFFFFF')) ? '#e0e0e0' : '#2d2d2d',
              borderRadius: 4,
              paddingHorizontal: 4,
              paddingVertical: 2,
              fontSize: 14,
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              borderWidth: 1,
              borderColor: theme.border + '40',
            },
            code_block: {
              backgroundColor: 'transparent', // We handle this in custom renderer
              color: 'transparent', // We handle this in custom renderer
              borderRadius: 0,
              padding: 0,
              fontSize: 13,
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              margin: 0,
            },
            blockquote: {
              backgroundColor: theme.surface,
              borderLeftWidth: 4,
              borderLeftColor: theme.primary,
              paddingLeft: 12,
              paddingVertical: 8,
              marginVertical: 8,
              fontStyle: 'italic',
            },
            list_item: {
              fontSize: 16,
              lineHeight: 24,
              color: theme.text,
              marginBottom: 4,
            },
            link: {
              color: theme.primary,
              textDecorationLine: 'underline',
            },
          }}
          rules={{
            code_block: renderCodeBlock,
            fence: renderCodeBlock,
          }}
        >
          {displayContent}
        </Markdown>
      </View>
      {onCopy && (
        <TouchableOpacity
          style={{
            marginTop: 5,
            marginLeft: showBubble ? 10 : 8,
            alignSelf: 'flex-start',
          }}
          onPress={handleCopy}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={isCopied ? "checkmark" : "copy-outline"}
              size={16}
              color={theme.text + '60'}
            />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}
