# LangChat Example App

This example app demonstrates the LangChat package authentication system integration.

## Features Demonstrated

- **User Authentication Flow**: Sign up, sign in, and forgot password
- **Session Management**: Automatic token refresh and persistence
- **Profile Management**: User profile display and updates
- **Secure Integration**: Proper Supabase integration with environment variables
- **Theme Customization**: Custom theme configuration
- **Error Handling**: Comprehensive error handling and user feedback

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env`
3. Fill in your Supabase project URL and anon key in `.env`
4. Run the SQL schema from `../src/data/schemas/index.sql` in your Supabase SQL editor
5. Enable Row Level Security (RLS) on all tables

### 3. Environment Variables

Create a `.env` file in the example directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Run the App

```bash
npm start
```

## App Flow

1. **Loading Screen**: Shows while checking authentication status
2. **Authentication Flow**:
   - Sign In screen (default)
   - Sign Up screen
   - Forgot Password screen
3. **Main App**: Displayed after successful authentication
   - Welcome message with user details
   - Feature overview
   - Sign out functionality

## Authentication Features

### Sign Up
- Name, email, and password fields
- Password strength validation
- Confirm password matching
- Email verification

### Sign In
- Email and password authentication
- Remember me functionality
- Error handling for invalid credentials

### Forgot Password
- Email-based password reset
- Confirmation flow

### Profile Management
- View user profile
- Update user name
- Avatar display (with fallback)

## Code Structure

```
example/src/
├── App.tsx                 # Main app component with auth flow
└── .env.example           # Environment configuration template
```

## Integration Example

```tsx
import React from 'react';
import { AuthProvider, AuthNavigator, useAuthContext } from 'langchat';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuthContext();

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthNavigator />;

  return <MainApp user={user} />;
}
```

## Next Steps

After setting up authentication, you can:

1. Add chat functionality
2. Integrate with LangGraph backend
3. Implement file upload features
4. Add voice input capabilities
5. Customize themes and styling

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env` file is in the example directory
   - Restart the development server after changing environment variables

2. **Supabase Connection Errors**
   - Verify your Supabase URL and anon key
   - Ensure your Supabase project is active
   - Check that RLS policies are properly configured

3. **Build Errors**
   - Run `npm install` in both root and example directories
   - Clear Metro cache: `npx expo start --clear`

### Getting Help

- Check the main package documentation
- Review Supabase documentation for database setup
- Open an issue in the GitHub repository
