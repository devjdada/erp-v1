import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { hrService } from '@/services/hrService';
import { BarChart, Users, CheckCircle, Clock } from 'lucide-react-native';

export default function HRReports() {
  const theme = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await hrService.getReports();
      setStats(res.data?.data || res.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Present', value: stats?.present || 0, icon: CheckCircle, color: theme.success },
    { title: 'Absent', value: stats?.absent || 0, icon: Users, color: theme.error },
    { title: 'Late', value: stats?.late || 0, icon: Clock, color: theme.warning },
    { title: 'On Leave', value: stats?.on_leave || 0, icon: BarChart, color: theme.primary },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Attendance Reports</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Daily summary statistics</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <View style={styles.grid}>
            {statCards.map((card, index) => (
              <View 
                key={index} 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: theme.backgroundElement, 
                    borderColor: theme.border, 
                    borderWidth: 1 
                  }
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: card.color + '20' }]}>
                  <card.icon color={card.color} size={24} />
                </View>
                <Text style={[styles.value, { color: theme.text }]}>{card.value}</Text>
                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{card.title}</Text>
              </View>
            ))}
          </View>
        )}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { flex: 1, minWidth: '45%', padding: 20, borderRadius: 16, alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  value: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, marginBottom: 4 },
  cardTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});
