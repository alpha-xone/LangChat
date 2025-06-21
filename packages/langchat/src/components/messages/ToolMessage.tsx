import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useState } from 'react';
import { Animated, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getContentString } from '../../lib/message-utils';
import { Theme } from '../../theme';

interface ToolMessageProps {
  message: Message;
  onCopy?: (text: string) => void;
  theme: Theme;
  showBubble?: boolean;
  compact?: boolean;
}

export function ToolMessage({ message, onCopy, theme, showBubble = false, compact = false }: ToolMessageProps) {
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
    }
  };

  if (!message) return null;
  // Custom renderer for code blocks to make them horizontally scrollable
  const renderCodeBlock = (node: any, children: any, parent: any, styles: any) => {
    return (
      <View style={{
        marginVertical: 6,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        }}>
          <View style={{
            backgroundColor: theme.text + '20',
            borderRadius: 3,
            paddingHorizontal: 4,
            paddingVertical: 1,
          }}>
            <Text style={{
              color: theme.text + '80',
              fontSize: 9,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Output
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={{
            backgroundColor: theme.background,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: theme.border + '60',
            maxHeight: 150,
          }}
          contentContainerStyle={{
            padding: 8,
          }}
        >
          <Text style={{
            fontSize: 11,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            color: theme.text + 'E0',
            lineHeight: 16,
          }}>
            {node.content}
          </Text>
        </ScrollView>
      </View>
    );
  };  // Extract tool call ID from message if available
  const toolCallId = (message as any)?.tool_call_id;

  // Try to find associated tool call information in previous messages
  // This would typically come from the AI message that made the tool call
  const findToolName = () => {
    // In a real implementation, you might search through previous messages
    // For now, we'll try to extract from common patterns in the content
    if (displayContent.toLowerCase().includes('weather')) return 'get_weather';
    if (displayContent.toLowerCase().includes('search')) return 'search';
    if (displayContent.toLowerCase().includes('calculator')) return 'calculate';
    return null;
  };

  const toolName = findToolName();

  // Compact version for minimal display
  if (compact) {
    return (
      <View style={{
        padding: 2,
        alignItems: 'flex-start',
        marginVertical: 2,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface + '80',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderLeftWidth: 2,
          borderLeftColor: theme.primary + '60',
        }}>
          <Ionicons
            name="construct"
            size={10}
            color={theme.primary + 'A0'}
          />
          <Text style={{
            color: theme.text + '80',
            fontSize: 10,
            marginLeft: 4,
            fontWeight: '500',
          }}>
            Tool: {toolName || 'Response'}
          </Text>
          {displayContent && displayContent.length > 50 && (
            <Text style={{
              color: theme.text + '60',
              fontSize: 9,
              marginLeft: 4,
              fontStyle: 'italic',
            }}>
              • {displayContent.slice(0, 30)}...
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{
      padding: 4,
      alignItems: 'flex-start',
    }}>
      <View style={{
        maxWidth: showBubble ? '80%' : '90%',
        backgroundColor: showBubble ? theme.background : 'transparent',
        borderRadius: showBubble ? 12 : 0,
        paddingHorizontal: showBubble ? 10 : 0,
        paddingVertical: showBubble ? 8 : 0,
        borderWidth: showBubble ? 1 : 0,
        borderColor: showBubble ? theme.border + '60' : 'transparent',
        borderLeftWidth: showBubble ? 3 : 0,
        borderLeftColor: showBubble ? theme.primary + '60' : 'transparent',
      }}>
        {/* Enhanced tool message header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: displayContent ? 8 : 0,
          paddingBottom: displayContent ? 6 : 0,
          borderBottomWidth: displayContent ? 1 : 0,
          borderBottomColor: theme.border + '40',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
          }}>
            <View style={{
              backgroundColor: theme.primary + '20',
              borderRadius: 12,
              width: 24,
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}>
              <Ionicons
                name="construct"
                size={12}
                color={theme.primary}
              />
            </View>            <View style={{ flex: 1 }}>
              <Text style={{
                color: theme.primary,
                fontSize: 11,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}>
                {toolName ? `Tool: ${toolName.replace('_', ' ')}` : 'Tool Response'}
              </Text>
              {toolCallId && (
                <Text style={{
                  color: theme.text + '60',
                  fontSize: 10,
                  marginTop: 1,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                }}>
                  ID: {toolCallId.slice(-8)}
                </Text>
              )}
            </View>
          </View>

          {/* Success indicator */}
          <View style={{
            backgroundColor: theme.success + '20',
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}>
            <Text style={{
              color: theme.success,
              fontSize: 9,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              ✓ Complete
            </Text>
          </View>
        </View>
        {displayContent && (
          <View style={{
            backgroundColor: showBubble ? theme.surface + '40' : 'transparent',
            borderRadius: 8,
            padding: showBubble ? 8 : 0,
          }}>
            <Markdown
              style={{
                body: {
                  color: theme.text + 'D0',
                  fontSize: 13,
                  margin: 0,
                  lineHeight: 18,
                },
                paragraph: {
                  color: theme.text + 'D0',
                  fontSize: 13,
                  lineHeight: 18,
                  marginBottom: 4,
                },
                strong: {
                  fontWeight: '600',
                  color: theme.text + 'E0',
                },
                em: {
                  fontStyle: 'italic',
                  color: theme.text + 'C0',
                },
                code_inline: {
                  backgroundColor: theme.primary + '15',
                  color: theme.primary,
                  borderRadius: 3,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  fontSize: 11,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  fontWeight: '500',
                },
                code_block: {
                  backgroundColor: theme.background,
                  color: theme.text + 'E0',
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 11,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  borderWidth: 1,
                  borderColor: theme.border + '60',
                },
                blockquote: {
                  backgroundColor: theme.surface + '60',
                  borderLeftWidth: 3,
                  borderLeftColor: theme.primary + '80',
                  paddingLeft: 8,
                  paddingVertical: 4,
                  marginVertical: 4,
                  fontStyle: 'italic',
                  borderRadius: 4,
                },
                list_item: {
                  fontSize: 13,
                  lineHeight: 18,
                  color: theme.text + 'D0',
                  marginBottom: 2,
                },
                link: {
                  color: theme.primary,
                  textDecorationLine: 'underline',
                  fontSize: 13,
                },
                heading1: {
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: theme.text + 'E0',
                  marginBottom: 6,
                },
                heading2: {
                  fontSize: 15,
                  fontWeight: '600',
                  color: theme.text + 'E0',
                  marginBottom: 4,
                },
                heading3: {
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.text + 'D0',
                  marginBottom: 3,
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
        )}      </View>
      {onCopy && displayContent && (
        <TouchableOpacity
          style={{
            marginTop: 6,
            marginLeft: 8,
            alignSelf: 'flex-start',
            backgroundColor: theme.surface,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: theme.border + '60',
          }}
          onPress={handleCopy}
        >
          <Animated.View style={{
            transform: [{ scale: scaleAnim }],
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons
              name={isCopied ? "checkmark" : "copy-outline"}
              size={12}
              color={isCopied ? theme.success : theme.text + '80'}
            />
            <Text style={{
              fontSize: 10,
              color: isCopied ? theme.success : theme.text + '80',
              marginLeft: 4,
              fontWeight: '500',
            }}>
              {isCopied ? 'Copied' : 'Copy'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}
