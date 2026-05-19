import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Rocket } from 'lucide-react-native';

import { ERPButton } from '@/components/ERPButton';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Rocket size={64} color="#0891B2" />
          </View>
          <Text style={styles.title}>Welcome to ERP</Text>
          <Text style={styles.description}>
            Manage your business operations efficiently with our clean, unified dashboard.
          </Text>
          
          <View style={styles.bulletPoints}>
            <Text style={styles.bullet}>• Real-time analytics</Text>
            <Text style={styles.bullet}>• Simplified workflows</Text>
            <Text style={styles.bullet}>• Secure access everywhere</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <ERPButton title="Get Started" onPress={handleGetStarted} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ECFEFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 32,
    color: '#164E63',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: '#164E63',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  bulletPoints: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  bullet: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    color: '#0891B2',
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 16,
  },
});
