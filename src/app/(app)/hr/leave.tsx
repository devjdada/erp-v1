import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Calendar, UserCircle } from 'lucide-react-native';
import { hrService } from '@/services/hrService';
import dayjs from 'dayjs';

export default function HRLeave() {
  const theme = useTheme();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await hrService.getLeaves();
      setLeaves(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return theme.success;
      case 'pending': return theme.warning;
      case 'rejected': return theme.error;
      default: return theme.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Leave Requests</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage staff leave applications</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <View style={styles.listContainer}>
            {leaves.map((leave: any, index: number) => (
              <View 
                key={leave.id || index} 
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
                      {leave.staff?.full_name || leave.staff?.user?.name || `Staff ID: ${leave.staff_id}`}
                    </Text>
                    <Text style={[styles.type, { color: theme.textSecondary }]}>
                      {leave.leaveType?.name || 'Leave Request'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(leave.status) }]} />
                    <Text style={[styles.statusText, { color: theme.text }]}>{leave.status}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.cardFooter}>
                  <View style={styles.timeBlock}>
                    <Calendar color={theme.textSecondary} size={14} />
                    <View>
                      <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Duration</Text>
                      <Text style={[styles.timeValue, { color: theme.text }]}>
                        {dayjs(leave.start_date).format('MMM DD')} - {dayjs(leave.end_date).format('MMM DD, YYYY')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timeBlock}>
                    <UserCircle color={theme.textSecondary} size={14} />
                    <View>
                      <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Days</Text>
                      <Text style={[styles.timeValue, { color: theme.text }]}>{leave.total_days || 0} days</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            {leaves.length === 0 && (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No leave requests found.</Text>
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
  type: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, textTransform: 'capitalize' },
  divider: { height: 1, marginVertical: 16 },
  cardFooter: { flexDirection: 'row', gap: 32 },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  timeValue: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});
