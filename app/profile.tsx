import { ProtectedRoute, UserProfileScreen } from '@/packages/langchat/src';
import { router } from 'expo-router';
import React from 'react';

export default function ProfileScreen() {
  return (
    <ProtectedRoute>
      <UserProfileScreen onClose={() => router.back()} />
    </ProtectedRoute>
  );
}
