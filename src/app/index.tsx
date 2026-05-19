import { Redirect } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EntryScreen() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

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

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECFEFF' }}>
        <ActivityIndicator size="large" color="#0891B2" />
      </View>
    );
  }

  if (isFirstLaunch) {
    return <Redirect href="/(onboarding)" />;
  }

  // If not first launch, assume we need to login or are logged in
  // For demo purposes, we redirect to auth. State management would handle dashboard redirects.
  return <Redirect href="/(auth)/login" />;
}
