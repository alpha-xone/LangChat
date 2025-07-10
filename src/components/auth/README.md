# LangChat Authentication System

This document describes the authentication system implementation for the LangChat package, which provides a complete authentication flow using Supabase as the backend.

## Overview

The authentication system includes:
- User registration (sign up)
- User authentication (sign in)
- Password reset functionality
- User profile management
- Session management with automatic token refresh
- Secure token handling for LangGraph backend communication

## Components

### Core Components

#### 1. `AuthService`
The main service class that handles all authentication operations:
- Sign up, sign in, sign out
- Password reset
- Profile management
- Token management for API calls
- Session persistence with AsyncStorage

#### 2. `useAuth` Hook
A React hook that provides authentication state and methods:
```typescript
const {
  user,           // Current authenticated user
  session,        // Current session
  loading,        // Loading state
  signUp,         // Sign up function
  signIn,         // Sign in function
  signOut,        // Sign out function
  resetPassword,  // Password reset function
  updateProfile,  // Update profile function
  refreshUser,    // Refresh user data
} = useAuth();
```

#### 3. `AuthProvider`
Context provider for global authentication state:
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

#### 4. `AuthNavigator`
A component that manages the authentication flow between sign in, sign up, and forgot password screens:
```tsx
<AuthNavigator
  initialScreen="signin"
  onAuthSuccess={() => {/* Handle successful auth */}}
  theme={customTheme}
/>
```

### UI Components

#### 1. `SignInScreen`
Complete sign-in interface with:
- Email and password inputs
- Form validation
- Loading states
- Navigation to sign up and forgot password

#### 2. `SignUpScreen`
User registration interface with:
- Name, email, password, and confirm password inputs
- Strong password validation
- Account creation confirmation

#### 3. `ForgotPasswordScreen`
Password reset interface with:
- Email input for reset instructions
- Confirmation of email sent

#### 4. `ProfileScreen`
User profile management interface with:
- Profile viewing and editing
- Name updates
- Sign out functionality

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your project:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema

The authentication system expects the following Supabase database schema (already defined in `src/data/schemas/index.sql`):

- `profiles` table: User profile information
- `chat_threads` table: User chat threads
- `chat_messages` table: Chat messages
- `file_uploads` table: File attachments
- `voice_inputs` table: Voice input data
- `user_preferences` table: User settings

### 3. Basic Usage

```tsx
import React from 'react';
import { AuthProvider, AuthNavigator, useAuthContext } from 'langchat';

// Main app component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// App content with authentication check
function AppContent() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <AuthNavigator
        onAuthSuccess={() => {
          // Handle successful authentication
          console.log('User authenticated successfully');
        }}
      />
    );
  }

  return <MainApp />;
}
```

### 4. Custom Theming

```tsx
const customTheme = {
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

<AuthNavigator theme={customTheme} />
```

## API Reference

### AuthService Methods

#### `signUp(data: SignUpData)`
Creates a new user account.
```typescript
const { user, error } = await authService.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe'
});
```

#### `signIn(data: SignInData)`
Authenticates an existing user.
```typescript
const { user, error } = await authService.signIn({
  email: 'user@example.com',
  password: 'password123'
});
```

#### `signOut()`
Signs out the current user.
```typescript
const { error } = await authService.signOut();
```

#### `resetPassword(email: string)`
Sends password reset email.
```typescript
const { error } = await authService.resetPassword('user@example.com');
```

#### `getAccessToken()`
Gets current access token for API calls.
```typescript
const token = await authService.getAccessToken();
```

### Types

#### `AuthUser`
```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}
```

#### `SignUpData`
```typescript
interface SignUpData {
  email: string;
  password: string;
  name: string;
}
```

#### `SignInData`
```typescript
interface SignInData {
  email: string;
  password: string;
}
```

## Security Features

1. **Row Level Security (RLS)**: All database tables have RLS policies ensuring users can only access their own data.

2. **JWT Token Validation**: Access tokens are properly validated for LangGraph backend communication.

3. **Secure Session Storage**: Sessions are stored securely using AsyncStorage with automatic refresh.

4. **Password Validation**: Strong password requirements are enforced during registration.

5. **Email Verification**: Users receive email verification during registration.

## Integration with LangGraph

The authentication system automatically includes the Supabase access token in all requests to the LangGraph backend. The token is included in the `Authorization` header as a Bearer token, allowing the LangGraph backend to:

1. Validate the user's identity using the Supabase JWT secret
2. Extract the user ID for database operations
3. Implement user-specific context and permissions

## Error Handling

All authentication operations return a consistent error format:
```typescript
interface AuthResult {
  success: boolean;
  error?: string;
}
```

Common error scenarios are handled gracefully with user-friendly error messages.

## Testing

The authentication system includes comprehensive error handling and validation. For testing, you can mock the AuthService or use Supabase's testing utilities.

## Dependencies

- `@supabase/supabase-js`: Supabase client library
- `@react-native-async-storage/async-storage`: Secure local storage
- React Native core components

These are included as both dependencies and peerDependencies to ensure compatibility with consuming applications.
