import React from 'react';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFontScale } from '@/context/FontSizeContext';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { fontScale } = useFontScale();

  // Helper to apply scaling to a base font size
  const scale = (size: number) => size * fontScale;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && { ...styles.default, fontSize: scale(styles.default.fontSize) },
        type === 'title' && { ...styles.title, fontSize: scale(styles.title.fontSize) },
        type === 'small' && { ...styles.small, fontSize: scale(styles.small.fontSize) },
        type === 'smallBold' && { ...styles.smallBold, fontSize: scale(styles.smallBold.fontSize) },
        type === 'subtitle' && { ...styles.subtitle, fontSize: scale(styles.subtitle.fontSize) },
        type === 'link' && { ...styles.link, fontSize: scale(styles.link.fontSize) },
        type === 'linkPrimary' && { ...styles.linkPrimary, fontSize: scale(styles.linkPrimary.fontSize) },
        type === 'code' && { ...styles.code, fontSize: scale(styles.code.fontSize) },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
