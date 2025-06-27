import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LucideIcon from '@react-native-vector-icons/lucide';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface UserProfileScreenProps {
  onClose: () => void;
}

export default function UserProfileScreen({ onClose }: UserProfileScreenProps) {
  const { currentTheme: theme } = useAppTheme();
  const { user, updateProfile, signOut, isLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.profile?.name || user?.user_metadata?.name || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    if (!editedName.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }

    const result = await updateProfile({ name: editedName.trim() });

    if (result.success) {
      setIsEditing(false);
      setErrors({});
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            onClose();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
          }}>
            Profile
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: theme.surface,
            }}
          >
            <LucideIcon
              name="x"
              size={20}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
          {/* Profile Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: theme.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
            {user?.profile?.avatar_url ? (
              // In a real app, you'd use an Image component here
              <Text style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: theme.primary,
              }}>
                {(user.profile?.name || user.user_metadata?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Text style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: theme.primary,
              }}>
                {(user?.profile?.name || user?.user_metadata?.name || 'U').charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
            </View>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: theme.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              onPress={() => {
                Alert.alert('Coming Soon', 'Avatar upload will be available in a future update');
              }}
            >
              <LucideIcon
                name="camera"
                size={16}
                color={theme.placeholder}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                fontSize: 14,
                color: theme.placeholder,
              }}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Information */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 16,
            }}>
              Account Information
            </Text>

            {/* Name Field */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: theme.text,
                marginBottom: 8,
              }}>
                Name
              </Text>
              {isEditing ? (
                <View>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: errors.name ? theme.error : theme.border,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      color: theme.text,
                      backgroundColor: theme.surface,
                    }}
                    value={editedName}
                    onChangeText={(text) => {
                      setEditedName(text);
                      if (errors.name) {
                        setErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor={theme.placeholder}
                  />
                  {errors.name && (
                    <Text style={{
                      color: theme.error,
                      fontSize: 14,
                      marginTop: 4,
                    }}>
                      {errors.name}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: theme.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}>
                <Text style={{
                  fontSize: 16,
                  color: theme.text,
                }}>
                  {user?.profile?.name || user?.user_metadata?.name || 'User'}
                </Text>
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={{ padding: 4 }}
                  >
                    <LucideIcon
                      name="pen"
                      size={16}
                      color={theme.placeholder}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Email Field */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: theme.text,
                marginBottom: 8,
              }}>
                Email
              </Text>
              <View style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <Text style={{
                  fontSize: 16,
                  color: theme.text,
                }}>
                  {user?.email}
                </Text>
              </View>
            </View>

            {/* Member Since */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: theme.text,
                marginBottom: 8,
              }}>
                Member Since
              </Text>
              <View style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <Text style={{
                  fontSize: 16,
                  color: theme.text,
                }}>
                  {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {isEditing ? (
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 24,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: theme.surface,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                onPress={() => {
                  setIsEditing(false);
                  setEditedName(user?.profile?.name || user?.user_metadata?.name || '');
                  setErrors({});
                }}
                disabled={isLoading}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.text,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: theme.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: isLoading ? 0.7 : 1,
                }}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.background} size="small" />
                ) : (
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.background,
                  }}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: theme.error,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 24,
              }}
              onPress={handleSignOut}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.background,
              }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          )}

          {/* App Information */}
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 8,
            }}>
              About LangChat
            </Text>
            <Text style={{
              fontSize: 14,
              color: theme.placeholder,
              lineHeight: 20,
            }}>
              A modern chat interface powered by LangGraph and React Native.
              Built for seamless conversations with AI assistants.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
