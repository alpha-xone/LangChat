import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuthContext } from './AuthProvider';

export interface ProfileScreenProps {
  onNavigateBack?: () => void;
  theme?: {
    colors: {
      primary: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      error: string;
      success: string;
    };
    fonts: {
      regular: string;
      medium: string;
      bold: string;
    };
  };
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateBack,
  theme = defaultTheme,
}) => {
  const { user, updateProfile, signOut, loading: authLoading } = useAuthContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }

    setError('');
    return true;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsUpdating(true);
      setError('');

      const result = await updateProfile({
        name: formData.name.trim(),
      });

      if (result.success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setError('');
  };

  const styles = createStyles(theme);

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onNavigateBack}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* Profile Form */}
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        {/* Name Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[
              styles.input,
              !isEditing && styles.inputReadonly,
              error && styles.inputError,
            ]}
            value={formData.name}
            onChangeText={(value) => {
              setFormData(prev => ({ ...prev, name: value }));
              setError('');
            }}
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.textSecondary}
            editable={isEditing && !isUpdating}
          />
        </View>

        {/* Email Field (readonly) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            value={formData.email}
            editable={false}
            placeholder="Email"
            placeholderTextColor={theme.colors.textSecondary}
          />
          <Text style={styles.helperText}>Email cannot be changed</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, isUpdating && styles.buttonDisabled]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={theme.colors.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleCancel}
                disabled={isUpdating}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleSignOut}
          disabled={isUpdating}
        >
          <Text style={styles.dangerButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const defaultTheme = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    error: '#FF3B30',
    success: '#34C759',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
};

const createStyles = (theme: ProfileScreenProps['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme!.colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme!.colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme!.fonts.regular,
    color: theme!.colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme!.colors.background,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme!.colors.surface,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme!.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: theme!.fonts.bold,
    color: theme!.colors.background,
  },
  userName: {
    fontSize: 24,
    fontFamily: theme!.fonts.bold,
    color: theme!.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: theme!.fonts.regular,
    color: theme!.colors.textSecondary,
  },
  form: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme!.fonts.bold,
    color: theme!.colors.text,
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: theme!.fonts.medium,
    color: theme!.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme!.colors.surface,
    borderWidth: 1,
    borderColor: theme!.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: theme!.fonts.regular,
    color: theme!.colors.text,
  },
  inputReadonly: {
    backgroundColor: theme!.colors.background,
    color: theme!.colors.textSecondary,
  },
  inputError: {
    borderColor: theme!.colors.error,
  },
  helperText: {
    fontSize: 14,
    fontFamily: theme!.fonts.regular,
    color: theme!.colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    fontFamily: theme!.fonts.regular,
    color: theme!.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme!.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme!.colors.border,
  },
  dangerButton: {
    backgroundColor: theme!.colors.error,
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: theme!.fonts.medium,
    color: theme!.colors.background,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: theme!.fonts.medium,
    color: theme!.colors.text,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: theme!.fonts.medium,
    color: theme!.colors.background,
  },
  retryButton: {
    backgroundColor: theme!.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: theme!.fonts.medium,
    color: theme!.colors.background,
  },
});
