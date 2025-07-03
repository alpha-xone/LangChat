import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppTheme } from '../../theming/useAppTheme';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes = ['image/*', 'application/pdf', 'text/*'],
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
}) => {
  const { theme } = useAppTheme();

  const handleFilePress = () => {
    // In a real implementation, you'd use react-native-document-picker or similar
    Alert.alert(
      'File Upload',
      'File upload functionality would be implemented here using react-native-document-picker or similar library.'
    );
  };

  const styles = StyleSheet.create({
    container: {
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xl,
      margin: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    text: {
      fontSize: theme.typography.fontSize.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    buttonText: {
      color: theme.colors.background,
      fontSize: theme.typography.fontSize.medium,
      fontWeight: theme.typography.fontWeight.medium,
    },
    hint: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Drop files here or click to browse
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleFilePress}>
        <Text style={styles.buttonText}>Choose Files</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Max {maxFiles} files, {Math.round(maxSize / (1024 * 1024))}MB each
      </Text>
    </View>
  );
};
