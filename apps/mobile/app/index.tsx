import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    console.log('Auth state:', { isSignedIn, isLoaded });
  }, [isSignedIn, isLoaded]);

  // Show loading spinner while auth is loading
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/welcome" />;
  }
}