import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function EntryScreen() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { authToken, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const value = await AsyncStorage.getItem('hasLaunched');
        if (value === null) {
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch {
        setIsFirstLaunch(false);
      }
    }
    checkFirstLaunch();
  }, []);

  // Show loading spinner while checking first launch or validating authentication token
  if (isFirstLaunch === null || isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECFEFF' }}>
        <ActivityIndicator size="large" color="#0891B2" />
      </View>
    );
  }

  if (isFirstLaunch) {
    return <Redirect href="/(onboarding)" />;
  }

  // Redirect based on whether the user has a valid authenticated session
  if (authToken) {
    return <Redirect href="/(app)/workspace" />;
  }

  return <Redirect href="/(auth)/login" />;
}
