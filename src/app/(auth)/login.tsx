import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { LogIn } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';

import { ERPButton } from '@/components/ERPButton';
import { ERPInput } from '@/components/ERPInput';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email.trim(), password);
      if (response.success) {
        router.replace('/(app)/workspace');
      } else {
        Alert.alert('Login Failed', response.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <LogIn color={theme.primary} size={32} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter your details to access your account.</Text>
          </View>

          <View style={[styles.form, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ERPInput
              label="Email"
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <ERPInput
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            
            <View style={styles.forgotPasswordContainer}>
              <Text style={[styles.forgotPassword, { color: theme.primary }]}>Forgot password?</Text>
            </View>

            <ERPButton
              title="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>{"Don't have an account? "}</Text>
            <Link href="/(auth)/register" asChild>
              <Text style={StyleSheet.flatten([styles.footerLink, { color: theme.primary }])}>Sign up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  footerLink: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
});
