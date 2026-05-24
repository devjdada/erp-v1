import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { hrService } from '@/services/hrService';
import api from '@/services/api';
import dayjs from 'dayjs';

export default function HRPermissions() {
  const theme = useTheme();
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const res = await hrService.getPermissions();
      setPermissions(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermission = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.post(`/settings/attendance-permissions/${id}/handle`, { status });
      Alert.alert('Success', `Permission ${status} successfully`);
      loadPermissions();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update permission');
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
          <Text style={[styles.title, { color: theme.text }]}>Attendance Permissions</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Review and manage requests</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <View style={styles.listContainer}>
            {permissions.map((req: any, index: number) => (
              <View 
                key={req.id || index} 
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
                      {req.staff?.full_name || req.staff?.user?.name || `Staff ID: ${req.staff_id}`}
                    </Text>
                    <Text style={[styles.date, { color: theme.textSecondary }]}>
                      Date: {dayjs(req.date).format('MMM DD, YYYY')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(req.status) }]} />
                    <Text style={[styles.statusText, { color: theme.text }]}>{req.status}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.cardBody}>
                  <Text style={[styles.typeText, { color: theme.primary }]}>Type: {req.type}</Text>
                  <Text style={[styles.reasonText, { color: theme.textSecondary }]}>{req.reason}</Text>
                </View>

                {req.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { borderColor: theme.error, borderWidth: 1 }]}
                      onPress={() => handlePermission(req.id, 'rejected')}
                    >
                      <XCircle color={theme.error} size={18} />
                      <Text style={[styles.actionBtnText, { color: theme.error }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: theme.success }]}
                      onPress={() => handlePermission(req.id, 'approved')}
                    >
                      <CheckCircle color="#fff" size={18} />
                      <Text style={[styles.actionBtnText, { color: '#fff' }]}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            {permissions.length === 0 && (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No permission requests found.</Text>
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
  statusText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, textTransform: 'capitalize' },
  divider: { height: 1, marginVertical: 16 },
  cardBody: { marginBottom: 16 },
  typeText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, marginBottom: 4, textTransform: 'capitalize' },
  reasonText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, lineHeight: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  actionBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});
