import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { hrService } from '@/services/hrService';
import dayjs from 'dayjs';

export default function HRAttendance() {
  const theme = useTheme();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await hrService.getAttendance();
      setAttendances(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present': return theme.success;
      case 'late': return theme.warning;
      case 'absent': return theme.error;
      default: return theme.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Today's Attendance</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Monitor staff presence</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <View style={styles.listContainer}>
            {attendances.map((record: any, index: number) => (
              <View 
                key={record.id || index} 
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
                    <Text style={[styles.name, { color: theme.text }]}>
                      {record.staff?.full_name || record.staff?.user?.name || `Staff ID: ${record.staff_id}`}
                    </Text>
                    <Text style={[styles.date, { color: theme.textSecondary }]}>
                      {dayjs(record.date).format('MMM DD, YYYY')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(record.status) }]} />
                    <Text style={[styles.statusText, { color: theme.text }]}>{record.status}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.cardFooter}>
                  <View style={styles.timeBlock}>
                    <Clock color={theme.textSecondary} size={14} />
                    <View>
                      <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>In</Text>
                      <Text style={[styles.timeValue, { color: theme.text }]}>{record.clock_in || '--:--'}</Text>
                    </View>
                  </View>
                  <View style={styles.timeBlock}>
                    <Clock color={theme.textSecondary} size={14} />
                    <View>
                      <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Out</Text>
                      <Text style={[styles.timeValue, { color: theme.text }]}>{record.clock_out || '--:--'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            {attendances.length === 0 && (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No attendance records found.</Text>
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
  card: {
    padding: 20, borderRadius: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1 },
  name: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, marginBottom: 4 },
  date: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 },
  divider: { height: 1, marginVertical: 16 },
  cardFooter: { flexDirection: 'row', gap: 32 },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  timeValue: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});
