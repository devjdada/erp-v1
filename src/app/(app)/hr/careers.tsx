import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { hrService } from '@/services/hrService';
import { Briefcase, MapPin, Calendar } from 'lucide-react-native';
import dayjs from 'dayjs';

export default function HRCareers() {
  const theme = useTheme();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCareers();
  }, []);

  const loadCareers = async () => {
    try {
      setLoading(true);
      const res = await hrService.getCareers();
      setApplications(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hired': return theme.success;
      case 'pending': return theme.warning;
      case 'rejected': return theme.error;
      case 'interviewing': return theme.primary;
      default: return theme.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Job Applications</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage career applicants</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <View style={styles.listContainer}>
            {applications.map((app: any, index: number) => (
              <View 
                key={app.id || index} 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: theme.backgroundElement, 
                    borderColor: theme.border, 
                    borderWidth: 1 
                  }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: theme.text }]}>{app.applicant_name || app.first_name + ' ' + app.last_name}</Text>
                    <Text style={[styles.role, { color: theme.textSecondary }]}>{app.job?.title || 'Job Application'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(app.status) }]} />
                    <Text style={[styles.statusText, { color: theme.text }]}>{app.status || 'Pending'}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.cardFooter}>
                  <View style={styles.footerBlock}>
                    <Briefcase color={theme.textSecondary} size={14} />
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                      {app.experience || 'Entry'} Level
                    </Text>
                  </View>
                  <View style={styles.footerBlock}>
                    <Calendar color={theme.textSecondary} size={14} />
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                      {dayjs(app.created_at).format('MMM DD, YYYY')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            {applications.length === 0 && (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No applications found.</Text>
            )}
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
  listContainer: { gap: 16 },
  card: { padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1 },
  name: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, marginBottom: 4 },
  role: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, textTransform: 'capitalize' },
  divider: { height: 1, marginVertical: 16 },
  cardFooter: { flexDirection: 'row', gap: 24 },
  footerBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 },
});
