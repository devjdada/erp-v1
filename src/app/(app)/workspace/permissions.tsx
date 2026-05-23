import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldAlert, KeyRound, Calendar, ShieldCheck, Plus, X, ChevronDown, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import DateTimePicker from '@react-native-community/datetimepicker';

interface PermissionRecord {
  id: number;
  permission_type?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at?: string;
  hr_remarks?: string | null;
  approved_by_user?: {
    name: string;
  } | null;
}

export default function PermissionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPermissions = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const result = await attendanceService.getPermissions();
      if (result && result.success && result.data) {
        setPermissions(result.data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchPermissions(true);
  }, [fetchPermissions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPermissions(false);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return '#10B981';
    if (s === 'rejected') return '#EF4444';
    return '#F59E0B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return 'rgba(16, 185, 129, 0.08)';
    if (s === 'rejected') return 'rgba(239, 68, 68, 0.08)';
    return 'rgba(245, 158, 11, 0.08)';
  };

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [dateStr, setDateStr] = useState('');
  const [dateValue, setDateValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState('lateness');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!dateStr || !type || !reason) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await attendanceService.submitPermission({
        date: dateStr,
        type: type,
        reason: reason,
      });

      if (result && result.success) {
        Alert.alert('Success', 'Permission request submitted successfully.');
        setModalVisible(false);
        setDateStr('');
        setType('lateness');
        setReason('');
        fetchPermissions(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit request.');
      }
    } catch (e: any) {
      console.error('Error submitting permission:', e);
      Alert.alert('Error', e?.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Attendance Permissions</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Permissions</Text>
          {permissions.length > 0 ? (
            <View style={styles.listContainer}>
              {permissions.map((perm) => {
                const statusColor = getStatusColor(perm.status);
                const statusBg = getStatusBg(perm.status);

                return (
                  <View
                    key={perm.id}
                    style={[styles.permissionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.permissionIdentity}>
                        <View style={[styles.avatarBox, { backgroundColor: `${theme.primary}12` }]}>
                          <KeyRound color={theme.primary} size={18} />
                        </View>
                        <View>
                          <Text style={[styles.permType, { color: theme.text }]}>
                            {perm.type || perm.permission_type || 'Permission'}
                          </Text>
                          <Text style={[styles.permDuration, { color: theme.textSecondary }]}>
                            {perm.date 
                              ? new Date(perm.date).toLocaleDateString() 
                              : (perm.start_date ? new Date(perm.start_date).toLocaleDateString() : '')}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {perm.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.detailsSection, { borderColor: theme.border }]}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>REASON:</Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>{perm.reason}</Text>
                      
                      {perm.hr_remarks && (
                        <View style={styles.approverRow}>
                          <ShieldCheck size={14} color="#10B981" />
                          <Text style={[styles.approverText, { color: theme.textSecondary }]}>
                            HR Remarks: <Text style={{ color: theme.text, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{perm.hr_remarks}</Text>
                          </Text>
                        </View>
                      )}
                      
                      {perm.approved_by_user && (
                        <View style={styles.approverRow}>
                          <ShieldCheck size={14} color="#10B981" />
                          <Text style={[styles.approverText, { color: theme.textSecondary }]}>
                            Approved by: <Text style={{ color: theme.text, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{perm.approved_by_user.name}</Text>
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Calendar size={12} color={theme.textSecondary} />
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        Requested: {perm.created_at ? new Date(perm.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <KeyRound color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No permissions found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Attendance exemptions (e.g. Work From Home, swap duty permission) will show up here.
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>Request Permission</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Date (YYYY-MM-DD) *</Text>
              
              {Platform.OS === 'web' ? (
                // @ts-ignore - web specific attribute
                <input 
                  type="date"
                  value={dateStr}
                  onChange={(e: any) => setDateStr(e.target.value)}
                  style={{
                    height: 44,
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingLeft: 12,
                    paddingRight: 12,
                    borderColor: theme.border,
                    backgroundColor: 'transparent',
                    color: theme.text,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    fontSize: 13.5,
                    marginBottom: 8,
                    outline: 'none',
                  }}
                />
              ) : (
                <Pressable onPress={() => setShowDatePicker(true)} style={[styles.input, { color: theme.text, borderColor: theme.border, justifyContent: 'center' }]}>
                  <Text style={{ color: dateStr ? theme.text : theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium' }}>
                    {dateStr || 'Select Date'}
                  </Text>
                </Pressable>
              )}

              {Platform.OS !== 'web' && showDatePicker && (
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDateValue(selectedDate);
                      setDateStr(selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Type *</Text>
              <Pressable
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                style={[styles.selectBox, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.text, fontFamily: 'PlusJakartaSans_500Medium', textTransform: 'capitalize' }}>
                  {type}
                </Text>
                <ChevronDown color={theme.textSecondary} size={18} />
              </Pressable>

              {showTypeDropdown && (
                <View style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  {['lateness', 'absence'].map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        setType(opt);
                        setShowTypeDropdown(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.text, textTransform: 'capitalize' }]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Reason *</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Explain why you are requesting this permission..."
                placeholderTextColor={theme.textSecondary}
                multiline={true}
                numberOfLines={3}
                style={[styles.textArea, { color: theme.text, borderColor: theme.border }]}
              />

              <View style={[styles.infoAlert, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}30` }]}>
                <AlertCircle size={16} color={theme.primary} />
                <Text style={[styles.infoAlertText, { color: theme.primary }]}>
                  Approved requests will prevent automatic salary deductions during payroll processing.
                </Text>
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit to HR</Text>
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
  permissionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  permissionIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permType: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  permDuration: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
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
  detailsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 4,
  },
  detailLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    lineHeight: 18,
  },
  approverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  approverText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
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
  infoAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  infoAlertText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
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
