import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { OAUTH_CONFIG, isOAuthProviderAvailable } from '@/lib/oauth-config';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const { currentTheme: theme } = useAppTheme();
  const { signIn, signUp, signInWithOAuth, forgotPassword, isLoading } = useAuth();
  const params = useLocalSearchParams();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Handle OAuth errors from URL params
  useEffect(() => {
    if (params.error) {
      setErrors({ oauth: params.error as string });
    }
  }, [params.error]);

  const clearErrors = () => setErrors({});

  const getOAuthIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'google';
      case 'apple':
        return 'apple';
      case 'twitter':
        return 'x-twitter';
      default:
        return 'question';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (mode !== 'forgot') {
      if (!password.trim()) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }

      if (mode === 'signup') {
        if (!name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    clearErrors();

    try {
      let result;

      if (mode === 'signin') {
        result = await signIn(email, password);
      } else if (mode === 'signup') {
        result = await signUp(email, password, name);
      } else {
        result = await forgotPassword(email);
      }

      if (result.success) {
        if (mode === 'forgot') {
          Alert.alert('Success', 'Password reset email sent! Check your inbox.');
          setMode('signin');
        } else {
          // Navigate back to home or wherever appropriate
          router.replace('/');
        }
      } else {
        Alert.alert('Error', result.error || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'twitter') => {
    try {
      const result = await signInWithOAuth(provider);

      if (result.success) {
        router.replace('/');
      } else {
        Alert.alert('Error', result.error || `Failed to sign in with ${OAUTH_CONFIG.providers[provider].name}`);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during sign in');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setErrors({});
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const renderModeTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Welcome Back';
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Reset Password';
    }
  };

  const renderModeSubtitle = () => {
    switch (mode) {
      case 'signin':
        return 'Sign in to your account to continue';
      case 'signup':
        return 'Create a new account to get started';
      case 'forgot':
        return 'Enter your email to reset your password';
    }
  };

  const renderOAuthButtons = () => {
    if (mode === 'forgot') return null;

    const availableProviders = (['google', 'apple', 'twitter'] as const).filter(provider =>
      isOAuthProviderAvailable(provider)
    );

    if (availableProviders.length === 0) return null;

    return (
      <View style={styles.oauthSection}>
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.placeholder }]}>
            Or continue with
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <View style={styles.oauthButtons}>
          {availableProviders.map((provider) => {
            const config = OAUTH_CONFIG.providers[provider];
            return (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.oauthButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleOAuthSignIn(provider)}
                disabled={isLoading}
              >
                <FontAwesome6
                  name={getOAuthIcon(provider)}
                  size={20}
                  color={config.color}
                  brand
                />
                <Text style={[styles.oauthButtonText, { color: theme.text }]}>
                  {config.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={() => router.back()}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.text }]}>
              {renderModeTitle()}
            </Text>
            <Text style={[styles.subtitle, { color: theme.placeholder }]}>
              {renderModeSubtitle()}
            </Text>
          </View>
        </View>

        {/* OAuth Buttons */}
        {renderOAuthButtons()}

        {/* OAuth Error Display */}
        {errors.oauth && (
          <View style={[styles.errorContainer, { backgroundColor: '#FFE6E6', borderColor: '#FF6B6B' }]}>
            <FontAwesome6 name="exclamation-triangle" size={16} color="#FF6B6B" />
            <Text style={[styles.errorText, { color: '#FF6B6B', marginLeft: 8, flex: 1 }]}>
              {errors.oauth}
            </Text>
          </View>
        )}

        {/* Email/Password Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Email
            </Text>
            <View style={[
              styles.inputContainer,
              {
                backgroundColor: theme.surface,
                borderColor: errors.email ? '#FF6B6B' : theme.border,
              }
            ]}>
              <FontAwesome6 name="envelope" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) clearErrors();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Name Input (Sign Up only) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Full Name
              </Text>
              <View style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.name ? '#FF6B6B' : theme.border,
                }
              ]}>
                <FontAwesome6 name="user" size={20} color={theme.placeholder} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.placeholder}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) clearErrors();
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
          )}

          {/* Password Input */}
          {mode !== 'forgot' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Password
              </Text>
              <View style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.password ? '#FF6B6B' : theme.border,
                }
              ]}>
                <FontAwesome6 name="lock" size={20} color={theme.placeholder} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) clearErrors();
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <FontAwesome6
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color={theme.placeholder}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>
          )}

          {/* Confirm Password Input (Sign Up only) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Confirm Password
              </Text>
              <View style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.confirmPassword ? '#FF6B6B' : theme.border,
                }
              ]}>
                <FontAwesome6 name="lock" size={20} color={theme.placeholder} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.placeholder}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) clearErrors();
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          )}

          {/* Forgot Password Link (Sign In only) */}
          {mode === 'signin' && (
            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={() => switchMode('forgot')}
              disabled={isLoading}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                Forgot your password?
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.primary,
              opacity: isLoading ? 0.7 : 1,
            }
          ]}
          onPress={handleEmailAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.actionButtonText}>
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Email'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Mode Switch */}
        <View style={styles.modeSwitch}>
          {mode === 'signin' && (
            <>
              <Text style={[styles.modeSwitchText, { color: theme.placeholder }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => switchMode('signup')}
                disabled={isLoading}
              >
                <Text style={[styles.modeSwitchLink, { color: theme.primary }]}>
                  Sign up
                </Text>
              </TouchableOpacity>
            </>
          )}
          {mode === 'signup' && (
            <>
              <Text style={[styles.modeSwitchText, { color: theme.placeholder }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => switchMode('signin')}
                disabled={isLoading}
              >
                <Text style={[styles.modeSwitchLink, { color: theme.primary }]}>
                  Sign in
                </Text>
              </TouchableOpacity>
            </>
          )}
          {mode === 'forgot' && (
            <>
              <Text style={[styles.modeSwitchText, { color: theme.placeholder }]}>
                Remember your password?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => switchMode('signin')}
                disabled={isLoading}
              >
                <Text style={[styles.modeSwitchLink, { color: theme.primary }]}>
                  Sign in
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Demo Account Info */}
        {mode === 'signin' && (
          <View style={[styles.demoInfo, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <FontAwesome6 name="circle-info" size={16} color={theme.placeholder} />
            <Text style={[styles.demoInfoText, { color: theme.placeholder }]}>
              Demo: Use demo@langchat.com / demo123
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  oauthSection: {
    marginBottom: 30,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  oauthButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  oauthButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modeSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modeSwitchText: {
    fontSize: 14,
  },
  modeSwitchLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  demoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  demoInfoText: {
    fontSize: 12,
    flex: 1,
  },
});
