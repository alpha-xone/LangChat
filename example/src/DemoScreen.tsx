import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ProfileScreen, useAuthContext } from 'langchat';

interface DemoScreenProps {
  onBack: () => void;
}

export const DemoScreen: React.FC<DemoScreenProps> = ({ onBack }) => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const { user, updateProfile, resetPassword } = useAuthContext();

  const handleUpdateProfile = async () => {
    Alert.prompt(
      'Update Name',
      'Enter your new name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              const result = await updateProfile({ name: newName.trim() });
              if (result.success) {
                Alert.alert('Success', 'Profile updated successfully!');
              } else {
                Alert.alert('Error', result.error || 'Failed to update profile');
              }
            }
          },
        },
      ],
      'plain-text',
      user?.name
    );
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    Alert.alert(
      'Reset Password',
      `Send password reset email to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            const result = await resetPassword(user.email);
            if (result.success) {
              Alert.alert('Success', 'Password reset email sent!');
            } else {
              Alert.alert('Error', result.error || 'Failed to send reset email');
            }
          },
        },
      ]
    );
  };

  if (activeDemo === 'profile') {
    return (
      <ProfileScreen
        onNavigateBack={() => setActiveDemo(null)}
        theme={{
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
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Auth Features Demo</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Available Features</Text>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => setActiveDemo('profile')}
        >
          <Text style={styles.demoButtonText}>Profile Management</Text>
          <Text style={styles.demoDescription}>
            View and edit user profile, manage settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleUpdateProfile}
        >
          <Text style={styles.demoButtonText}>Quick Name Update</Text>
          <Text style={styles.demoDescription}>
            Update your name directly with a prompt
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleResetPassword}
        >
          <Text style={styles.demoButtonText}>Password Reset</Text>
          <Text style={styles.demoDescription}>
            Send password reset email to your account
          </Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>User Information</Text>
          <Text style={styles.infoText}>Name: {user?.name}</Text>
          <Text style={styles.infoText}>Email: {user?.email}</Text>
          <Text style={styles.infoText}>ID: {user?.id}</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Package Features</Text>
          <Text style={styles.featureItem}>✓ Secure Authentication</Text>
          <Text style={styles.featureItem}>✓ Session Management</Text>
          <Text style={styles.featureItem}>✓ Token Refresh</Text>
          <Text style={styles.featureItem}>✓ Profile Management</Text>
          <Text style={styles.featureItem}>✓ Password Reset</Text>
          <Text style={styles.featureItem}>✓ Form Validation</Text>
          <Text style={styles.featureItem}>✓ Error Handling</Text>
          <Text style={styles.featureItem}>✓ Theme Customization</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  demoButton: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C6C6C8',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  demoDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoSection: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  featuresSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 6,
  },
});
