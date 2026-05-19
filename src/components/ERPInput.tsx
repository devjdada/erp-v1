import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface ERPInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function ERPInput({ label, error, style, ...props }: ERPInputProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            color: theme.text,
          },
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={theme.textSecondary}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
