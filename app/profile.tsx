import ProtectedRoute from '@/components/ProtectedRoute';
import UserProfileScreen from '@/components/UserProfileScreen';
import { router } from 'expo-router';
import React from 'react';

export default function ProfileScreen() {
  return (
    <ProtectedRoute>
      <UserProfileScreen onClose={() => router.back()} />
    </ProtectedRoute>
  );
}
