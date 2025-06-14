import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
          margin: 16,
        }}
        onPress={() => router.push('/chat')}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
          Open Chat
        </Text>
      </TouchableOpacity>
    </View>
  );
}
