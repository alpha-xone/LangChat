import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LucideIcon from '@react-native-vector-icons/lucide';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

interface SignInScreenProps {
  onSuccess?: () => void;
}

export default function SignInScreen({ onSuccess }: SignInScreenProps) {
  const { currentTheme: theme } = useAppTheme();
  const { signIn, signUp, forgotPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (not for forgot password)
    if (mode !== 'forgot-password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }
    }

    // Sign up specific validations
    if (mode === 'signup') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      let result;

      if (mode === 'signin') {
        result = await signIn(formData.email, formData.password);
      } else if (mode === 'signup') {
        result = await signUp(formData.email, formData.password, formData.name);
      } else if (mode === 'forgot-password') {
        result = await forgotPassword(formData.email);
      }

      if (result?.success) {
        if (mode === 'forgot-password') {
          Alert.alert(
            'Password Reset Sent',
            'Please check your email for password reset instructions.',
            [
              {
                text: 'OK',
                onPress: () => setMode('signin'),
              },
            ]
          );
        } else {
          onSuccess?.();
        }
      } else {
        Alert.alert('Error', result?.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const renderInput = (
    key: keyof typeof formData,
    placeholder: string,
    options: {
      secureTextEntry?: boolean;
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      keyboardType?: 'default' | 'email-address';
      showToggle?: boolean;
      toggleState?: boolean;
      onToggle?: () => void;
    } = {}
  ) => (
    <View style={{ marginBottom: 16 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: errors[key] ? theme.error : theme.border,
        borderRadius: 12,
        backgroundColor: theme.surface,
        paddingHorizontal: 16,
        height: 52,
      }}>
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            color: theme.text,
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          value={formData[key]}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, [key]: text }));
            if (errors[key]) {
              setErrors(prev => ({ ...prev, [key]: '' }));
            }
          }}
          secureTextEntry={options.secureTextEntry && !options.toggleState}
          autoCapitalize={options.autoCapitalize}
          keyboardType={options.keyboardType}
          autoCorrect={false}
        />
        {options.showToggle && (
          <TouchableOpacity
            onPress={options.onToggle}
            style={{ padding: 4 }}
          >
            <LucideIcon
              name={options.toggleState ? 'eye' : 'eye-off'}
              size={20}
              color={theme.placeholder}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[key] && (
        <Text style={{
          color: theme.error,
          fontSize: 14,
          marginTop: 4,
          marginLeft: 4,
        }}>
          {errors[key]}
        </Text>
      )}
    </View>
  );

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot-password': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signin': return 'Sign in to continue chatting';
      case 'signup': return 'Join the conversation';
      case 'forgot-password': return 'Enter your email to receive reset instructions';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'signin': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'forgot-password': return 'Send Reset Link';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 40,
          }}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                <LucideIcon
                  name="message-circle"
                  size={36}
                  color={theme.primary}
                />
              </View>
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: theme.text,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                {getTitle()}
              </Text>
              <Text style={{
                fontSize: 16,
                color: theme.placeholder,
                textAlign: 'center',
                lineHeight: 22,
              }}>
                {getSubtitle()}
              </Text>
            </View>

            {/* Demo Users Info */}
            {mode === 'signin' && (
              <View style={{
                backgroundColor: theme.primary + '10',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: theme.primary,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.primary,
                  marginBottom: 8,
                }}>
                  Demo Accounts
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: theme.text,
                  opacity: 0.8,
                  lineHeight: 18,
                }}>
                  Try: demo@langchat.com / demo123{'\n'}
                  Or: test@example.com / test123
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={{ marginBottom: 32 }}>
              {/* Email */}
              {renderInput('email', 'Email address', {
                keyboardType: 'email-address',
                autoCapitalize: 'none',
              })}

              {/* Name (signup only) */}
              {mode === 'signup' && renderInput('name', 'Full name', {
                autoCapitalize: 'words',
              })}

              {/* Password (not for forgot password) */}
              {mode !== 'forgot-password' && renderInput('password', 'Password', {
                secureTextEntry: true,
                showToggle: true,
                toggleState: showPassword,
                onToggle: () => setShowPassword(!showPassword),
              })}

              {/* Confirm Password (signup only) */}
              {mode === 'signup' && renderInput('confirmPassword', 'Confirm password', {
                secureTextEntry: true,
                showToggle: true,
                toggleState: showConfirmPassword,
                onToggle: () => setShowConfirmPassword(!showConfirmPassword),
              })}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                borderRadius: 12,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                opacity: isLoading ? 0.7 : 1,
              }}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.background} size="small" />
              ) : (
                <Text style={{
                  color: theme.background,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  {getButtonText()}
                </Text>
              )}
            </TouchableOpacity>

            {/* Mode Switching */}
            <View style={{ alignItems: 'center' }}>
              {mode === 'signin' && (
                <>
                  <TouchableOpacity
                    onPress={() => switchMode('forgot-password')}
                    style={{ marginBottom: 16 }}
                  >
                    <Text style={{
                      color: theme.primary,
                      fontSize: 14,
                      fontWeight: '500',
                    }}>
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: theme.placeholder, fontSize: 14 }}>
                      Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => switchMode('signup')}>
                      <Text style={{
                        color: theme.primary,
                        fontSize: 14,
                        fontWeight: '500',
                      }}>
                        Sign up
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {mode === 'signup' && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: theme.placeholder, fontSize: 14 }}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => switchMode('signin')}>
                    <Text style={{
                      color: theme.primary,
                      fontSize: 14,
                      fontWeight: '500',
                    }}>
                      Sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {mode === 'forgot-password' && (
                <TouchableOpacity onPress={() => switchMode('signin')}>
                  <Text style={{
                    color: theme.primary,
                    fontSize: 14,
                    fontWeight: '500',
                  }}>
                    Back to sign in
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
