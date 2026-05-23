import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, Calendar, CheckCircle2, AlertCircle, X, ChevronDown, Plus } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';

interface CorrectionRequest {
  id: number;
  attendance_id: number;
  corrected_clock_in?: string | null;
  corrected_clock_out?: string | null;
  reason: string;
  status: 'pending' | 'supervisor_approved' | 'hr_approved' | 'rejected' | string;
  created_at: string;
  attendance?: {
    date: string;
    clock_in?: string | null;
    clock_out?: string | null;
  } | null;
}

interface AttendanceLog {
  id: number;
  date: string;
  clock_in?: string | null;
  clock_out?: string | null;
}

export default function CorrectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken, user } = useAuth();

  // State
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [showLogDropdown, setShowLogDropdown] = useState(false);
  const [correctedIn, setCorrectedIn] = useState('');
  const [correctedOut, setCorrectedOut] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCorrections = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      // Fetch user's corrections
      const result = await attendanceService.getCorrections();

      if (result && result.success && result.data) {
        // Filter to only include this staff member's requests
        const staffId = user?.staff?.id;
        const myCorrections = result.data.filter((req: any) => !staffId || req.staff_id === staffId);
        setCorrections(myCorrections);
      }

      // Fetch user's recent attendance logs to correct
      if (user?.staff?.id) {
        const resultLogs = await attendanceService.getLogs(user.staff.id);
        if (resultLogs && resultLogs.success && resultLogs.data) {
          // Handle Laravel paginated response (resultLogs.data.data) or flat array (resultLogs.data)
          const logsArray = Array.isArray(resultLogs.data) ? resultLogs.data : (resultLogs.data.data || []);
          setAttendanceLogs(logsArray.slice(0, 10)); // Take last 10 logs
        }
      }
    } catch (error) {
      console.error('Error fetching corrections details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken, user]);

  useEffect(() => {
    fetchCorrections(true);
  }, [fetchCorrections]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCorrections(false);
  };

  const handleSubmitCorrection = async () => {
    if (!selectedLogId || !reason) {
      Alert.alert('Error', 'Please select an attendance record and state the reason.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await attendanceService.submitCorrection({
        attendance_id: selectedLogId,
        corrected_clock_in: correctedIn || null,
        corrected_clock_out: correctedOut || null,
        reason: reason,
      });

      if (result && result.success) {
        Alert.alert('Success', 'Correction request submitted successfully.');
        setModalVisible(false);
        // Reset form
        setSelectedLogId(null);
        setCorrectedIn('');
        setCorrectedOut('');
        setReason('');
        fetchCorrections(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit correction.');
      }
    } catch (e: any) {
      console.error('Error submitting correction:', e);
      Alert.alert('Error', e?.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s.includes('approved')) return '#10B981';
    if (s === 'rejected') return '#EF4444';
    return '#F59E0B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s.includes('approved')) return 'rgba(16, 185, 129, 0.08)';
    if (s === 'rejected') return 'rgba(239, 68, 68, 0.08)';
    return 'rgba(245, 158, 11, 0.08)';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Attendance Corrections</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Plus color="#FFFFFF" size={18} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Request History</Text>
          {corrections.length > 0 ? (
            <View style={styles.listContainer}>
              {corrections.map((req) => {
                const statusColor = getStatusColor(req.status);
                const statusBg = getStatusBg(req.status);

                return (
                  <View
                    key={req.id}
                    style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.dateBlock}>
                        <Calendar size={14} color={theme.textSecondary} />
                        <Text style={[styles.dateText, { color: theme.text }]}>
                          Date: {req.attendance?.date || 'Unknown'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {req.status?.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.timeComparison, { borderColor: theme.border }]}>
                      <View style={styles.timeCol}>
                        <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>CURRENT CLOCK</Text>
                        <Text style={[styles.timeVal, { color: theme.text }]}>
                          In: {req.attendance?.clock_in || '--:--'} • Out: {req.attendance?.clock_out || '--:--'}
                        </Text>
                      </View>
                      <View style={styles.timeCol}>
                        <Text style={[styles.timeLabel, { color: theme.primary }]}>REQUESTED CORRECTION</Text>
                        <Text style={[styles.timeVal, { color: theme.primary }]}>
                          In: {req.corrected_clock_in || '--:--'} • Out: {req.corrected_clock_out || '--:--'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.reasonText, { color: theme.textSecondary }]}>
                      Reason: {req.reason}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Clock color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No correction requests found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Submit a request if you missed clocking in or clocking out.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Request Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Request Correction</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Attendance Record *</Text>
              <Pressable
                onPress={() => setShowLogDropdown(!showLogDropdown)}
                style={[styles.selectBox, { borderColor: theme.border }]}
              >
                <Text style={{ color: selectedLogId ? theme.text : theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium' }}>
                  {selectedLogId
                    ? `Date: ${attendanceLogs.find((l) => l.id === selectedLogId)?.date} (In: ${
                        attendanceLogs.find((l) => l.id === selectedLogId)?.clock_in || '--'
                      } • Out: ${attendanceLogs.find((l) => l.id === selectedLogId)?.clock_out || '--'})`
                    : 'Select a record to correct'}
                </Text>
                <ChevronDown color={theme.textSecondary} size={18} />
              </Pressable>

              {showLogDropdown && (
                <View style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  {attendanceLogs.map((log) => (
                    <Pressable
                      key={log.id}
                      onPress={() => {
                        setSelectedLogId(log.id);
                        setShowLogDropdown(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                        {log.date} (In: {log.clock_in || '--'} • Out: {log.clock_out || '--'})
                      </Text>
                    </Pressable>
                  ))}
                  {attendanceLogs.length === 0 && (
                    <Text style={[styles.dropdownEmptyText, { color: theme.textSecondary }]}>No recent records found</Text>
                  )}
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Corrected Clock In (HH:MM)</Text>
              <TextInput
                value={correctedIn}
                onChangeText={setCorrectedIn}
                placeholder="e.g. 08:30"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Corrected Clock Out (HH:MM)</Text>
              <TextInput
                value={correctedOut}
                onChangeText={setCorrectedOut}
                placeholder="e.g. 17:00"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Reason for Correction *</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="State the reason (e.g. Forgot to clock out, network error...)"
                placeholderTextColor={theme.textSecondary}
                multiline={true}
                numberOfLines={3}
                style={[styles.textArea, { color: theme.text, borderColor: theme.border }]}
              />

              <Pressable
                onPress={handleSubmitCorrection}
                disabled={submitting}
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
  },
  timeComparison: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  timeCol: {
    gap: 2,
  },
  timeLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  timeVal: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
  reasonText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17.5,
  },
  modalForm: {
    padding: 20,
  },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },
  selectBox: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
  },
  dropdownEmptyText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    padding: 12,
    textAlign: 'center',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    marginBottom: 18,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14.5,
    color: '#FFFFFF',
  },
});
