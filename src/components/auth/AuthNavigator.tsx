import React, { useState } from 'react';
import { SignInScreen } from './SignInScreen';
import { SignUpScreen } from './SignUpScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

export type AuthScreenType = 'signin' | 'signup' | 'forgot-password';

export interface AuthNavigatorProps {
  initialScreen?: AuthScreenType;
  onAuthSuccess?: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({
  initialScreen = 'signin',
  onAuthSuccess,
}) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>(initialScreen);

  const navigateToSignIn = () => setCurrentScreen('signin');
  const navigateToSignUp = () => setCurrentScreen('signup');
  const navigateToForgotPassword = () => setCurrentScreen('forgot-password');

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
  };

  const handlePasswordResetSent = () => {
    // Navigate back to sign in after password reset email is sent
    setCurrentScreen('signin');
  };

  switch (currentScreen) {
    case 'signup':
      return (
        <SignUpScreen
          onSignUpSuccess={handleAuthSuccess}
          onNavigateToSignIn={navigateToSignIn}
        />
      );

    case 'forgot-password':
      return (
        <ForgotPasswordScreen
          onPasswordResetSent={handlePasswordResetSent}
          onNavigateBack={navigateToSignIn}
        />
      );

    default:
      return (
        <SignInScreen
          onSignInSuccess={handleAuthSuccess}
          onNavigateToSignUp={navigateToSignUp}
          onForgotPassword={navigateToForgotPassword}
        />
      );
  }
};
