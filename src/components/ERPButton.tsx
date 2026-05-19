import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface ERPButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function ERPButton({ title, onPress, variant = 'primary', isLoading, style, textStyle }: ERPButtonProps) {
  const theme = useTheme();

  const buttonStyle = [
    styles.button,
    variant === 'primary' && { backgroundColor: theme.primary },
    variant === 'secondary' && { backgroundColor: theme.backgroundSelected },
    variant === 'outline' && { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.primary },
    style
  ];

  const textStyleComputed = [
    styles.text,
    variant === 'primary' && { color: '#FFFFFF' },
    variant === 'secondary' && { color: theme.primary },
    variant === 'outline' && { color: theme.primary },
    textStyle
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        buttonStyle,
        pressed && styles.pressed,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.primary : '#FFFFFF'} />
      ) : (
        <Text style={textStyleComputed}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12, // More modern rounded radius
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
});
