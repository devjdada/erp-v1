import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  Menu,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface LeaveRequestItem {
  id: number;
  type: string;
  start_date: string;
  end_date: string;
  selected_dates?: string[] | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'hod_approved' | 'vouched' | string;
  vouch_status: 'pending' | 'vouched' | 'rejected' | string;
  created_at: string;
  vouch_staff?: { id: number; first_name: string; surname: string } | null;
  staff?: { first_name: string; surname: string; user?: { name: string } } | null;
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

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const TODAY_STR = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDaysInMonth(year: number, month: number): Date[] {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // pad from Sunday
  const startPad = firstDay.getDay();
  const endPad = 6 - lastDay.getDay();
  const days: Date[] = [];
  for (let i = startPad; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  for (let i = 1; i <= endPad; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

/* ─── Multi-Date Picker Component ───────────────────────────────────────── */

interface MultiDatePickerProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  theme: any;
}

function MultiDatePicker({ selectedDates, onChange, theme }: MultiDatePickerProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const days = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function toggleDate(date: Date) {
    const str = toDateStr(date);
    if (str < TODAY_STR) return; // disable past
    if (selectedDates.includes(str)) {
      onChange(selectedDates.filter(d => d !== str));
    } else {
      onChange([...selectedDates, str].sort());
    }
  }

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === viewMonth && date.getFullYear() === viewYear;

  return (
    <View style={[pickerStyles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {/* Month Nav */}
      <View style={[pickerStyles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={prevMonth} style={pickerStyles.navBtn}>
          <ChevronLeft color={theme.text} size={18} />
        </Pressable>
        <Text style={[pickerStyles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
        <Pressable onPress={nextMonth} style={pickerStyles.navBtn}>
          <ChevronRight color={theme.text} size={18} />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={pickerStyles.weekRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={[pickerStyles.weekDay, { color: theme.textSecondary }]}>{d}</Text>
        ))}
      </View>

      {/* Date grid */}
      <View style={pickerStyles.grid}>
        {days.map((date, idx) => {
          const str = toDateStr(date);
          const isPast = str < TODAY_STR;
          const isSelected = selectedDates.includes(str);
          const inMonth = isCurrentMonth(date);
          const isToday = str === TODAY_STR;

          return (
            <Pressable
              key={idx}
              onPress={() => toggleDate(date)}
              disabled={isPast}
              style={[
                pickerStyles.dayCell,
                isSelected && { backgroundColor: theme.primary },
                isToday && !isSelected && { borderWidth: 1, borderColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  pickerStyles.dayText,
                  { color: isPast ? theme.border : inMonth ? theme.text : theme.textSecondary },
                  isSelected && { color: '#FFFFFF' },
                ]}
              >
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected pills footer */}
      {selectedDates.length > 0 && (
        <View style={[pickerStyles.footer, { borderTopColor: theme.border }]}>
          <View style={pickerStyles.footerHeader}>
            <Text style={[pickerStyles.footerLabel, { color: theme.textSecondary }]}>
              {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
            </Text>
            <Pressable onPress={() => onChange([])}>
              <Text style={[pickerStyles.clearBtn, { color: theme.primary }]}>Clear all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={pickerStyles.pillsRow}>
              {selectedDates.map(d => (
                <View key={d} style={[pickerStyles.datePill, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }]}>
                  <Text style={[pickerStyles.datePillText, { color: theme.primary }]}>{formatShort(d)}</Text>
                  <Pressable onPress={() => onChange(selectedDates.filter(x => x !== d))}>
                    <X size={11} color={theme.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────────── */

export default function LeaveScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { authToken } = useAuth();

  // API State
  const [myRequests, setMyRequests] = useState<LeaveRequestItem[]>([]);
  const [pendingVouch, setPendingVouch] = useState<LeaveRequestItem[]>([]);
  const [vouchHistory, setVouchHistory] = useState<LeaveRequestItem[]>([]);
  const [balance, setBalance] = useState<LeaveBalance>({ annual: 20, sick: 10, casual: 5, used: 0 });
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [departmentSet, setDepartmentSet] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<'requests' | 'vouching'>('requests');

  // Submit form state
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState<'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Paternity' | 'Other'>('Annual');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [vouchStaffId, setVouchStaffId] = useState<number | null>(null);
  const [showColleagueDropdown, setShowColleagueDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Vouch review modal
  const [vouchModalItem, setVouchModalItem] = useState<LeaveRequestItem | null>(null);
  const [vouchDecision, setVouchDecision] = useState<'vouched' | 'rejected'>('vouched');
  const [vouchRemarks, setVouchRemarks] = useState('');
  const [vouchSubmitting, setVouchSubmitting] = useState(false);

  /* ── Fetch ──────────────────────────────────────────────────────── */

  const fetchLeaveData = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/staff/leaves`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const { leaves, balance: apiBalance, colleagues: apiColleagues, department_set } = result.data;
          const leavesArray: LeaveRequestItem[] = leaves?.data || leaves || [];
          setMyRequests(leavesArray);
          if (apiBalance) setBalance(apiBalance);
          if (apiColleagues) setColleagues(apiColleagues);
          if (department_set !== undefined) setDepartmentSet(department_set);
        }
      }

      // Fetch vouching requests
      const vouchRes = await fetch(`${API_BASE_URL}/staff/leaves/vouching`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (vouchRes.ok) {
        const vr = await vouchRes.json();
        if (vr.success && vr.data) {
          setPendingVouch(vr.data.pending || []);
          setVouchHistory(vr.data.history?.data || vr.data.history || []);
        }
      }
    } catch (error) {
      console.error('Error fetching leave details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => { fetchLeaveData(true); }, [fetchLeaveData]);
  const onRefresh = () => { setRefreshing(true); fetchLeaveData(false); };

  /* ── Submit leave request ───────────────────────────────────────── */

  const submitLeaveRequest = async () => {
    if (selectedDates.length === 0) {
      Alert.alert('Error', 'Please select at least one leave date.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your leave.');
      return;
    }
    if (!vouchStaffId) {
      Alert.alert('Error', 'Please select a covering colleague.');
      return;
    }

    setSubmitting(true);
    try {
      const body = JSON.stringify({
        type: leaveType,
        selected_dates: selectedDates,
        reason: reason.trim(),
        vouch_staff_id: vouchStaffId,
      });

      const response = await fetch(`${API_BASE_URL}/staff/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body,
      });

      const result = await response.json();
      if (response.ok && result.success) {
        Alert.alert('Success', 'Leave request submitted. Awaiting colleague acknowledgement.');
        resetForm();
        setModalVisible(false);
        fetchLeaveData(false);
      } else {
        const msg = result.message || (result.errors ? Object.values(result.errors).flat().join('\n') : 'Failed to submit.');
        Alert.alert('Error', msg);
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      Alert.alert('Error', 'Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  function resetForm() {
    setLeaveType('Annual');
    setSelectedDates([]);
    setReason('');
    setVouchStaffId(null);
    setShowColleagueDropdown(false);
  }

  /* ── Submit vouch decision ──────────────────────────────────────── */

  const submitVouchDecision = async () => {
    if (!vouchModalItem) return;
    setVouchSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/staff/leaves/${vouchModalItem.id}/vouch`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: vouchDecision, remarks: vouchRemarks }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const msg = vouchDecision === 'vouched' ? 'You agreed to cover. HOD has been notified.' : 'You declined the cover request.';
        Alert.alert('Done', msg);
        setVouchModalItem(null);
        setVouchRemarks('');
        setVouchDecision('vouched');
        fetchLeaveData(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit decision.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setVouchSubmitting(false);
    }
  };

  /* ── Status helpers ─────────────────────────────────────────────── */

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return '#10B981';
    if (s === 'rejected') return '#EF4444';
    if (s === 'hod_approved' || s === 'vouched') return '#3B82F6';
    return '#F59E0B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return 'rgba(16,185,129,0.12)';
    if (s === 'rejected') return 'rgba(239,68,68,0.12)';
    if (s === 'hod_approved' || s === 'vouched') return 'rgba(59,130,246,0.12)';
    return 'rgba(245,158,11,0.12)';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'hod_approved') return 'HOD Approved';
    if (status === 'vouched') return 'Cover Confirmed';
    return (status || '').toUpperCase();
  };

  const formatDateRange = (req: LeaveRequestItem) => {
    if (req.selected_dates && req.selected_dates.length > 0) {
      if (req.selected_dates.length === 1) return formatDisplay(req.selected_dates[0]);
      return `${req.selected_dates.length} days: ${req.selected_dates.slice(0, 2).map(formatShort).join(', ')}${req.selected_dates.length > 2 ? '...' : ''}`;
    }
    return `${formatDisplay(req.start_date)} – ${formatDisplay(req.end_date)}`;
  };

  const coveredByName = (req: LeaveRequestItem) =>
    req.vouch_staff ? `${req.vouch_staff.first_name} ${req.vouch_staff.surname}` : null;

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Leave Management</Text>
        <Pressable
          onPress={() => { resetForm(); setModalVisible(true); }}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {/* Balance Cards */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Leave Balances</Text>
          <View style={styles.balanceContainer}>
            <BalanceCard icon={<Calendar color={theme.primary} size={18} />} value={balance.annual} label="Annual" bg="rgba(30,111,253,0.12)" theme={theme} />
            <BalanceCard icon={<CheckCircle2 color="#10B981" size={18} />} value={balance.sick} label="Sick" bg="rgba(16,185,129,0.12)" theme={theme} />
            <BalanceCard icon={<Clock color="#F59E0B" size={18} />} value={balance.used} label="Used" bg="rgba(245,158,11,0.12)" theme={theme} />
          </View>

          {/* Tabs */}
          <View style={[styles.tabsRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Pressable
              style={[styles.tab, activeTab === 'requests' && { backgroundColor: theme.primary }]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'requests' ? '#FFFFFF' : theme.textSecondary }]}>
                My Requests
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'vouching' && { backgroundColor: theme.primary }]}
              onPress={() => setActiveTab('vouching')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'vouching' ? '#FFFFFF' : theme.textSecondary }]}>
                Vouching
              </Text>
              {pendingVouch.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{pendingVouch.length}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Tab: My Requests */}
          {activeTab === 'requests' && (
            <View style={styles.listContainer}>
              {myRequests.length > 0 ? (
                myRequests.map((req) => {
                  const statusColor = getStatusColor(req.status);
                  const statusBg = getStatusBg(req.status);
                  return (
                    <View key={req.id} style={[styles.requestRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                      <View style={styles.requestMain}>
                        <Text style={[styles.requestType, { color: theme.text }]}>{req.type} Leave</Text>
                        <Text style={[styles.requestDuration, { color: theme.textSecondary }]}>
                          {formatDateRange(req)}
                        </Text>
                        <Text style={[styles.requestReason, { color: theme.textSecondary }]} numberOfLines={1}>
                          {req.reason}
                        </Text>
                        {coveredByName(req) && (
                          <View style={styles.coverRow}>
                            <UserCheck size={11} color={theme.primary} />
                            <Text style={[styles.coverText, { color: theme.primary }]}>
                              Cover: {coveredByName(req)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: `${statusColor}40` }]}>
                          {req.status?.toLowerCase() === 'approved' ? (
                            <CheckCircle2 size={11} color={statusColor} style={styles.badgeIcon} />
                          ) : req.status?.toLowerCase() === 'rejected' ? (
                            <XCircle size={11} color={statusColor} style={styles.badgeIcon} />
                          ) : (
                            <AlertCircle size={11} color={statusColor} style={styles.badgeIcon} />
                          )}
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {getStatusLabel(req.status)}
                          </Text>
                        </View>
                        {/* vouch status mini badge */}
                        {req.vouch_status && (
                          <View style={[styles.miniVouchBadge, { backgroundColor: getStatusBg(req.vouch_status), borderColor: `${getStatusColor(req.vouch_status)}30` }]}>
                            <Text style={[styles.miniVouchText, { color: getStatusColor(req.vouch_status) }]}>
                              Cover: {req.vouch_status === 'vouched' ? '✓ Confirmed' : req.vouch_status === 'rejected' ? '✗ Declined' : 'Pending'}
                            </Text>
                          </View>
                        )}
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
          )}

          {/* Tab: Vouching */}
          {activeTab === 'vouching' && (
            <View style={styles.listContainer}>
              {/* Pending */}
              {pendingVouch.length > 0 && (
                <>
                  <Text style={[styles.subSectionLabel, { color: theme.textSecondary }]}>Pending Action</Text>
                  {pendingVouch.map((req) => (
                    <View key={req.id} style={[styles.vouchCard, { backgroundColor: theme.backgroundElement, borderColor: 'rgba(239,68,68,0.25)' }]}>
                      <View style={styles.vouchCardMain}>
                        <Text style={[styles.vouchCardName, { color: theme.text }]}>
                          {req.staff?.user?.name || `${req.staff?.first_name} ${req.staff?.surname}`}
                        </Text>
                        <Text style={[styles.vouchCardType, { color: theme.primary }]}>
                          {req.type} Leave
                        </Text>
                        <Text style={[styles.vouchCardDates, { color: theme.textSecondary }]}>
                          {formatDateRange(req)}
                        </Text>
                        {req.reason ? (
                          <Text style={[styles.vouchCardReason, { color: theme.textSecondary }]} numberOfLines={2}>
                            "{req.reason}"
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        onPress={() => { setVouchModalItem(req); setVouchDecision('vouched'); setVouchRemarks(''); }}
                        style={[styles.reviewBtn, { backgroundColor: theme.primary }]}
                      >
                        <Text style={styles.reviewBtnText}>Review</Text>
                      </Pressable>
                    </View>
                  ))}
                </>
              )}

              {/* History */}
              {vouchHistory.length > 0 && (
                <>
                  <Text style={[styles.subSectionLabel, { color: theme.textSecondary, marginTop: 20 }]}>History</Text>
                  {vouchHistory.map((req) => {
                    const vc = getStatusColor(req.vouch_status);
                    const vb = getStatusBg(req.vouch_status);
                    return (
                      <View key={req.id} style={[styles.historyRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                        <View style={styles.historyMain}>
                          <Text style={[styles.historyName, { color: theme.text }]}>
                            {req.staff?.user?.name || `${req.staff?.first_name} ${req.staff?.surname}`}
                          </Text>
                          <Text style={[styles.historyType, { color: theme.textSecondary }]}>
                            {req.type} Leave · {formatDateRange(req)}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: vb, borderColor: `${vc}40` }]}>
                          <Text style={[styles.statusText, { color: vc }]}>
                            {req.vouch_status === 'vouched' ? 'Covered' : req.vouch_status?.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}

              {pendingVouch.length === 0 && vouchHistory.length === 0 && (
                <View style={[styles.emptyContainer, { borderColor: theme.border }]}>
                  <UserCheck color={theme.textSecondary} size={36} style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No cover requests</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Submit Leave Modal ──────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Submit Leave Request</Text>
              <Pressable onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              {/* Leave Type */}
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Leave Type</Text>
              <View style={styles.typePills}>
                {(['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Other'] as const).map((t) => {
                  const isSel = leaveType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setLeaveType(t)}
                      style={[styles.pill, { backgroundColor: isSel ? theme.primary : theme.background, borderColor: isSel ? theme.primary : theme.border }]}
                    >
                      <Text style={[styles.pillText, { color: isSel ? '#FFFFFF' : theme.textSecondary }]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Multi-Date Picker */}
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Leave Dates *</Text>
              <MultiDatePicker selectedDates={selectedDates} onChange={setSelectedDates} theme={theme} />

              {/* Covering Colleague */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Covering Colleague *</Text>
              <Pressable
                onPress={() => setShowColleagueDropdown(v => !v)}
                style={[styles.selectBox, { borderColor: showColleagueDropdown ? theme.primary : theme.border }]}
              >
                <Text style={{ color: vouchStaffId ? theme.text : theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13.5 }}>
                  {vouchStaffId
                    ? `${colleagues.find(c => c.id === vouchStaffId)?.first_name} ${colleagues.find(c => c.id === vouchStaffId)?.surname}`
                    : 'Select colleague to cover duties'}
                </Text>
                <ChevronDown color={theme.textSecondary} size={18} />
              </Pressable>

              {showColleagueDropdown && (
                <View style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  {colleagues.length === 0 ? (
                    <Text style={[styles.dropdownEmptyText, { color: theme.textSecondary }]}>
                      {departmentSet
                        ? 'No other active staff in your department'
                        : 'You have no department assigned — contact HR'}
                    </Text>
                  ) : (
                    colleagues.map((col) => (
                      <Pressable
                        key={col.id}
                        onPress={() => { setVouchStaffId(col.id); setShowColleagueDropdown(false); }}
                        style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                      >
                        <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                          {col.first_name} {col.surname}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              )}

              {/* Reason */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Reason for Leave *</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Explain the reason for your request..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              />

              {/* Submit */}
              <Pressable
                onPress={submitLeaveRequest}
                disabled={submitting}
                style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
              >
                {submitting
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.submitBtnText}>Submit Leave Request</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Cover Review Modal ─────────────────────────────────────────── */}
      <Modal visible={!!vouchModalItem} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Acknowledge Cover-up</Text>
                {vouchModalItem && (
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                    Request by {vouchModalItem.staff?.user?.name || `${vouchModalItem.staff?.first_name} ${vouchModalItem.staff?.surname}`}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => { setVouchModalItem(null); setVouchRemarks(''); setVouchDecision('vouched'); }}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              {/* Period info */}
              {vouchModalItem && (
                <View style={[styles.periodInfo, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Calendar size={14} color={theme.primary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.periodLabel, { color: theme.textSecondary }]}>Leave Period</Text>
                    <Text style={[styles.periodValue, { color: theme.text }]}>{formatDateRange(vouchModalItem)}</Text>
                  </View>
                </View>
              )}

              {/* Decision toggle */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Your Decision</Text>
              <View style={styles.decisionRow}>
                <Pressable
                  onPress={() => setVouchDecision('vouched')}
                  style={[
                    styles.decisionBtn,
                    { borderColor: vouchDecision === 'vouched' ? '#10B981' : theme.border, backgroundColor: vouchDecision === 'vouched' ? 'rgba(16,185,129,0.1)' : theme.background },
                  ]}
                >
                  <CheckCircle2 size={24} color={vouchDecision === 'vouched' ? '#10B981' : theme.border} />
                  <Text style={[styles.decisionBtnText, { color: vouchDecision === 'vouched' ? '#10B981' : theme.textSecondary }]}>
                    Agree to Cover
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setVouchDecision('rejected')}
                  style={[
                    styles.decisionBtn,
                    { borderColor: vouchDecision === 'rejected' ? '#EF4444' : theme.border, backgroundColor: vouchDecision === 'rejected' ? 'rgba(239,68,68,0.1)' : theme.background },
                  ]}
                >
                  <XCircle size={24} color={vouchDecision === 'rejected' ? '#EF4444' : theme.border} />
                  <Text style={[styles.decisionBtnText, { color: vouchDecision === 'rejected' ? '#EF4444' : theme.textSecondary }]}>
                    Decline Request
                  </Text>
                </Pressable>
              </View>

              {/* Remarks */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Remarks (optional)</Text>
              <TextInput
                value={vouchRemarks}
                onChangeText={setVouchRemarks}
                placeholder="Add any comments or notes..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              />

              {/* Confirm */}
              <Pressable
                onPress={submitVouchDecision}
                disabled={vouchSubmitting}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: vouchDecision === 'vouched' ? '#10B981' : '#EF4444',
                    opacity: vouchSubmitting ? 0.7 : 1,
                  },
                ]}
              >
                {vouchSubmitting
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.submitBtnText}>
                      {vouchDecision === 'vouched' ? 'Confirm Cover' : 'Decline Request'}
                    </Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ─── Balance Card ───────────────────────────────────────────────────────── */

function BalanceCard({ icon, value, label, bg, theme }: { icon: React.ReactNode; value: number; label: string; bg: string; theme: any }) {
  return (
    <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.iconWrapper, { backgroundColor: bg }]}>{icon}</View>
      <Text style={[styles.balanceValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: 1 },
  headerButton: { padding: 8 },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 },
  addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, marginBottom: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  subSectionLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingHorizontal: 2 },

  balanceContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  balanceCard: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  iconWrapper: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  balanceValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, marginBottom: 2 },
  balanceLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9.5, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },

  tabsRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 16, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10, gap: 6 },
  tabText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  tabBadge: { backgroundColor: '#EF4444', borderRadius: 8, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 9 },

  listContainer: { gap: 10 },

  requestRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1 },
  requestMain: { flex: 1, gap: 4, marginRight: 10 },
  requestType: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  requestDuration: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  requestReason: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5 },
  coverRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  coverText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  badgeIcon: { marginRight: 4 },
  statusText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9.5, textTransform: 'uppercase' },
  miniVouchBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  miniVouchText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.3 },

  vouchCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1.5, gap: 12 },
  vouchCardMain: { flex: 1, gap: 3 },
  vouchCardName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  vouchCardType: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 },
  vouchCardDates: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11.5 },
  vouchCardReason: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, fontStyle: 'italic', marginTop: 3 },
  reviewBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  reviewBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.4 },

  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, borderWidth: 1 },
  historyMain: { flex: 1, gap: 3, marginRight: 10 },
  historyName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
  historyType: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11.5 },

  emptyContainer: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 36, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  emptyText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 },
  modalSubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, marginTop: 2 },
  modalForm: { padding: 20 },

  fieldLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  typePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  pillText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 },

  selectBox: { height: 46, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  dropdown: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  dropdownItem: { padding: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  dropdownItemText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13.5 },
  dropdownEmptyText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5, padding: 14, textAlign: 'center' },

  textArea: { minHeight: 84, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, textAlignVertical: 'top', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13.5, marginBottom: 18 },
  submitBtn: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  submitBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14.5, color: '#FFFFFF' },

  periodInfo: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 4 },
  periodLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  periodValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13.5 },

  decisionRow: { flexDirection: 'row', gap: 12 },
  decisionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, borderWidth: 2, gap: 8 },
  decisionBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
});

const pickerStyles = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  navBtn: { padding: 6 },
  monthLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  weekRow: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 10 },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  dayText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 },
  footer: { padding: 12, borderTopWidth: 1 },
  footerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  footerLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  clearBtn: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  pillsRow: { flexDirection: 'row', gap: 6 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  datePillText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
});
