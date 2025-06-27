import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { OAUTH_CONFIG, isOAuthProviderAvailable } from '@/lib/oauth-config';
import { FontAwesome6 } from '@expo/vector-icons';
import LucideIcon from '@react-native-vector-icons/lucide';
import React, { useState } from 'react';
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

export default function OAuthSignInScreen() {
  const { currentTheme: theme } = useAppTheme();
  const { signIn, signUp, signInWithOAuth, forgotPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const clearErrors = () => setErrors({});

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

      switch (mode) {
        case 'signin':
          result = await signIn(email, password);
          break;
        case 'signup':
          result = await signUp(email, password, name);
          break;
        case 'forgot':
          result = await forgotPassword(email);
          if (result.success) {
            Alert.alert(
              'Reset Email Sent',
              'Please check your email for password reset instructions.',
              [{ text: 'OK', onPress: () => setMode('signin') }]
            );
            return;
          }
          break;
      }

      if (!result.success) {
        Alert.alert('Authentication Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'twitter') => {
    try {
      const result = await signInWithOAuth(provider);

      if (!result.success) {
        Alert.alert('Sign-In Failed', result.error || `${provider} sign-in failed`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to sign in with ${provider}`);
    }
  };

  const getAvailableOAuthProviders = () => {
    return Object.entries(OAUTH_CONFIG.providers).filter(([key]) =>
      isOAuthProviderAvailable(key as keyof typeof OAUTH_CONFIG.providers)
    );
  };

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

  const renderOAuthButtons = () => {
    const availableProviders = getAvailableOAuthProviders();

    if (availableProviders.length === 0) {
      return null;
    }

    return (
      <View style={styles.oauthContainer}>
        <Text style={[styles.oauthTitle, { color: theme.text }]}>
          Or continue with
        </Text>

        <View style={styles.oauthButtons}>
          {availableProviders.map(([key, config]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.oauthButton,
                {
                  backgroundColor: config.color,
                  opacity: isLoading ? 0.7 : 1
                }
              ]}
              onPress={() => handleOAuthSignIn(key as 'google' | 'apple' | 'twitter')}
              disabled={isLoading}
            >
              <FontAwesome6
                name={getOAuthIcon(key)}
                size={20}
                color="white"
                brand
              />
              <Text style={styles.oauthButtonText}>
                {config.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDivider = () => (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      <Text style={[styles.dividerText, { color: theme.placeholder }]}>or</Text>
      <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {mode === 'signin' ? 'Welcome Back' :
               mode === 'signup' ? 'Create Account' :
               'Reset Password'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.placeholder }]}>
              {mode === 'signin' ? 'Sign in to your account' :
               mode === 'signup' ? 'Join the LangChat community' :
               'Enter your email to reset your password'}
            </Text>
          </View>

          {/* OAuth Buttons */}
          {mode !== 'forgot' && renderOAuthButtons()}

          {/* Divider */}
          {mode !== 'forgot' && getAvailableOAuthProviders().length > 0 && renderDivider()}

          {/* Email/Password Form */}
          <View style={styles.form}>
            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.name ? theme.error : theme.border,
                      backgroundColor: theme.surface,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor={theme.placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                {errors.name && (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {errors.name}
                  </Text>
                )}
              </View>
            )}

            {/* Email field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.email ? theme.error : theme.border,
                    backgroundColor: theme.surface,
                    color: theme.text,
                  },
                ]}
                placeholder="Email"
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Password fields */}
            {mode !== 'forgot' && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          borderColor: errors.password ? theme.error : theme.border,
                          backgroundColor: theme.surface,
                          color: theme.text,
                        },
                      ]}
                      placeholder="Password"
                      placeholderTextColor={theme.placeholder}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <LucideIcon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={theme.placeholder}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text style={[styles.errorText, { color: theme.error }]}>
                      {errors.password}
                    </Text>
                  )}
                </View>

                {/* Confirm password (signup only) */}
                {mode === 'signup' && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: errors.confirmPassword ? theme.error : theme.border,
                          backgroundColor: theme.surface,
                          color: theme.text,
                        },
                      ]}
                      placeholder="Confirm Password"
                      placeholderTextColor={theme.placeholder}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={true}
                    />
                    {errors.confirmPassword && (
                      <Text style={[styles.errorText, { color: theme.error }]}>
                        {errors.confirmPassword}
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: theme.primary,
                  opacity: isLoading ? 0.7 : 1
                },
              ]}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.background} size="small" />
              ) : (
                <Text style={[styles.submitButtonText, { color: theme.background }]}>
                  {mode === 'signin' ? 'Sign In' :
                   mode === 'signup' ? 'Create Account' :
                   'Send Reset Email'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Mode switchers */}
          <View style={styles.footer}>
            {mode === 'signin' && (
              <>
                <TouchableOpacity onPress={() => setMode('forgot')}>
                  <Text style={[styles.linkText, { color: theme.primary }]}>
                    Forgot your password?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('signup')}>
                  <Text style={[styles.linkText, { color: theme.text }]}>
                    Don't have an account?{' '}
                    <Text style={{ color: theme.primary }}>Sign up</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {mode === 'signup' && (
              <TouchableOpacity onPress={() => setMode('signin')}>
                <Text style={[styles.linkText, { color: theme.text }]}>
                  Already have an account?{' '}
                  <Text style={{ color: theme.primary }}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'forgot' && (
              <TouchableOpacity onPress={() => setMode('signin')}>
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  Back to sign in
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Demo accounts info */}
          {mode === 'signin' && (
            <View style={[styles.demoInfo, { borderColor: theme.border }]}>
              <Text style={[styles.demoTitle, { color: theme.text }]}>
                Demo Accounts
              </Text>
              <Text style={[styles.demoText, { color: theme.placeholder }]}>
                demo@langchat.com / demo123{'\n'}
                test@example.com / test123
              </Text>
            </View>
          )}
        </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    lineHeight: 22,
  },
  oauthContainer: {
    marginBottom: 24,
  },
  oauthTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  oauthButtons: {
    gap: 12,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 10,
  },
  oauthButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
  demoInfo: {
    marginTop: 32,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
