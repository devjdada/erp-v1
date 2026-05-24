import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { FileText, Shield, Briefcase, Wrench, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HRMore() {
  const theme = useTheme();

  const menuItems = [
    { title: 'Reports', icon: FileText, route: '/(app)/hr/reports', description: 'Attendance and HR reports' },
    { title: 'Departments', icon: Shield, route: '/(app)/hr/departments', description: 'Manage company departments' },
    { title: 'Careers', icon: Briefcase, route: '/(app)/hr/careers', description: 'Job applications and openings' },
    { title: 'Tools', icon: Wrench, route: '/(app)/hr/tools', description: 'Staff tool requests and assignments' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>More Options</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Additional HR modules</Text>
        </View>

        <View style={styles.listContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.card, 
                { 
                  backgroundColor: theme.backgroundElement, 
                  borderColor: theme.border, 
                  borderWidth: 1 
                }
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSelected }]}>
                  <item.icon color={theme.primary} size={24} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>{item.description}</Text>
                </View>
                <ChevronRight color={theme.textSecondary} size={20} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, marginBottom: 4 },
  subtitle: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16 },
  listContainer: { gap: 12 },
  card: { padding: 16, borderRadius: 16 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  itemTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginBottom: 2 },
  itemDesc: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 },
});
