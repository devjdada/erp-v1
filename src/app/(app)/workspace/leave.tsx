import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu, Calendar, Clock, Plus, CheckCircle2, AlertCircle, X, ChevronDown, User } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface LeaveRequestItem {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
  vouch_staff?: {
    first_name: string;
    surname: string;
  } | null;
}

interface Colleague {
  id: number;
  first_name: string;
  surname: string;
}

interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
  used: number;
}

export default function LeaveScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { authToken, user } = useAuth();

  // API State
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [balance, setBalance] = useState<LeaveBalance>({ annual: 20, sick: 10, casual: 5, used: 0 });
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [vouchStaffId, setVouchStaffId] = useState<number | null>(null);
  const [showColleagueDropdown, setShowColleagueDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaveData = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/staff/leaves`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const { leaves, balance: apiBalance, colleagues: apiColleagues } = result.data;
          setRequests(leaves?.data || leaves || []);
          if (apiBalance) setBalance(apiBalance);
          if (apiColleagues) setColleagues(apiColleagues);
        }
      }
    } catch (error) {
      console.error('Error fetching leave details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchLeaveData(true);
  }, [fetchLeaveData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveData(false);
  };

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const handleRequestLeave = () => {
    setModalVisible(true);
  };

  const submitLeaveRequest = async () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!user?.staff?.id) {
      Alert.alert('Error', 'Staff profile ID not found.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/staff/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          staff_id: user.staff.id,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
          vouch_staff_id: vouchStaffId,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        Alert.alert('Success', 'Leave request submitted successfully.');
        setModalVisible(false);
        // Reset form
        setStartDate('');
        setEndDate('');
        setReason('');
        setVouchStaffId(null);
        fetchLeaveData(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit leave request.');
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      Alert.alert('Error', 'Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return '#10B981';
    if (s === 'rejected') return '#EF4444';
    return '#F59E0B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return 'rgba(16, 185, 129, 0.1)';
    if (s === 'rejected') return 'rgba(239, 68, 68, 0.1)';
    return 'rgba(245, 158, 11, 0.1)';
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Leave Management</Text>
        <Pressable onPress={handleRequestLeave} style={[styles.addButton, { backgroundColor: theme.primary }]}>
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
          {/* Balances Section */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Leave Balances</Text>
          <View style={styles.balanceContainer}>
            <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(30, 111, 253, 0.1)' }]}>
                <Calendar color={theme.primary} size={20} />
              </View>
              <Text style={[styles.balanceValue, { color: theme.text }]}>{balance.annual}</Text>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Annual Days</Text>
            </View>

            <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <CheckCircle2 color="#10B981" size={20} />
              </View>
              <Text style={[styles.balanceValue, { color: theme.text }]}>{balance.sick}</Text>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Sick Days</Text>
            </View>

            <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Clock color="#F59E0B" size={20} />
              </View>
              <Text style={[styles.balanceValue, { color: theme.text }]}>{balance.used}</Text>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Approved Used</Text>
            </View>
          </View>

          {/* Requests Section */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Requests</Text>
          <View style={styles.listContainer}>
            {requests.length > 0 ? (
              requests.map((req) => {
                const statusColor = getStatusColor(req.status);
                const statusBg = getStatusBg(req.status);

                return (
                  <View key={req.id} style={[styles.requestRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <View style={styles.requestMain}>
                      <Text style={[styles.requestType, { color: theme.text }]}>{req.leave_type}</Text>
                      <Text style={[styles.requestDuration, { color: theme.textSecondary }]}>
                        {formatDateString(req.start_date)} - {formatDateString(req.end_date)}
                      </Text>
                      <Text style={[styles.requestReason, { color: theme.textSecondary }]} numberOfLines={1}>
                        Reason: {req.reason}
                      </Text>
                      {req.vouch_staff && (
                        <Text style={[styles.requestVouch, { color: theme.primary }]}>
                          Cover: {req.vouch_staff.first_name} {req.vouch_staff.surname}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: `${statusColor}30` }]}>
                      {req.status?.toLowerCase() === 'approved' ? (
                        <CheckCircle2 size={12} color={statusColor} style={styles.badgeIcon} />
                      ) : (
                        <AlertCircle size={12} color={statusColor} style={styles.badgeIcon} />
                      )}
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {req.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={[styles.emptyContainer, { borderColor: theme.border }]}>
                <Calendar color={theme.textSecondary} size={36} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No leave requests found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* New Request Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Submit Leave Request</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Type Select */}
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Leave Type</Text>
              <View style={styles.typePills}>
                {['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave'].map((t) => {
                  const isSel = leaveType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setLeaveType(t)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSel ? theme.primary : theme.background,
                          borderColor: isSel ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.pillText, { color: isSel ? '#FFFFFF' : theme.textSecondary }]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Start Date */}
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Start Date (YYYY-MM-DD) *</Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="e.g. 2026-06-01"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />

              {/* End Date */}
              <Text style={[styles.fieldLabel, { color: theme.text }]}>End Date (YYYY-MM-DD) *</Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="e.g. 2026-06-05"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />

              {/* Cover colleague */}
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Covering Colleague</Text>
              <Pressable
                onPress={() => setShowColleagueDropdown(!showColleagueDropdown)}
                style={[styles.selectBox, { borderColor: theme.border }]}
              >
                <Text style={{ color: vouchStaffId ? theme.text : theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium' }}>
                  {vouchStaffId
                    ? colleagues.find((c) => c.id === vouchStaffId)?.first_name +
                      ' ' +
                      colleagues.find((c) => c.id === vouchStaffId)?.surname
                    : 'Select colleague to cover duties'}
                </Text>
                <ChevronDown color={theme.textSecondary} size={18} />
              </Pressable>

              {showColleagueDropdown && (
                <View style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  {colleagues.map((col) => (
                    <Pressable
                      key={col.id}
                      onPress={() => {
                        setVouchStaffId(col.id);
                        setShowColleagueDropdown(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                        {col.first_name} {col.surname}
                      </Text>
                    </Pressable>
                  ))}
                  {colleagues.length === 0 && (
                    <Text style={[styles.dropdownEmptyText, { color: theme.textSecondary }]}>No department colleagues found</Text>
                  )}
                </View>
              )}

              {/* Reason */}
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Reason for Leave *</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Explain the reason for request..."
                placeholderTextColor={theme.textSecondary}
                multiline={true}
                numberOfLines={3}
                style={[styles.textArea, { color: theme.text, borderColor: theme.border }]}
              />

              {/* Submit Button */}
              <Pressable
                onPress={submitLeaveRequest}
                disabled={submitting}
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Leave Request</Text>
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
  headerButton: {
    padding: 8,
    marginRight: -8,
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
    fontSize: 14.5,
    marginBottom: 14,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  balanceCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    marginBottom: 2,
  },
  balanceLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  requestMain: {
    flex: 1,
    gap: 3,
  },
  requestType: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  requestDuration: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
  },
  requestReason: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11.5,
  },
  requestVouch: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 4,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9.5,
  },
  emptyContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
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
  typePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
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
