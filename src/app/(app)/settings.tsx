import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useThemeContext, ThemePreference } from '@/context/ThemeContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useFontScale } from '@/context/FontSizeContext';
export default function SettingsScreen() {
  const theme = useTheme();
  const { themePreference, setThemePreference } = useThemeContext();
  const { fontScale, setFontScale } = useFontScale();

  const options: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light Theme', icon: <Sun color={theme.text} size={20} /> },
    { value: 'dark', label: 'Dark Theme', icon: <Moon color={theme.text} size={20} /> },
    { value: 'system', label: 'System Default', icon: <Laptop color={theme.text} size={20} /> },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Configure your ERP interface preferences.</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
          <View style={[styles.optionsContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
            {options.map((opt, index) => {
              const isSelected = themePreference === opt.value;
              return (
                <View key={opt.value}>
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => setThemePreference(opt.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      {opt.icon}
                      <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
                    </View>
                    {isSelected && <Check color={theme.primary} size={20} />}
                  </TouchableOpacity>
                  {index < options.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>FONT SIZE</Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>Scale: {fontScale.toFixed(2)}x</Text>
            <Slider
              style={{ width: '100%' }}
              minimumValue={0.8}
              maximumValue={1.5}
              step={0.05}
              value={fontScale}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.primary}
              onValueChange={setFontScale}
            />
          </View>
        </View>
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            ERP Mobile App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingLeft: 4,
  },
  optionsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
  },
  sliderContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  sliderLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  divider: {
    height: 1,
  },
  infoSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  infoText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
  },
});
