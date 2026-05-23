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
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Plus, Clock, Navigation, X, Calendar } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface Movement {
  id: number;
  destination: string;
  purpose: string;
  status: string;
  expected_exit_time: string;
  expected_return_time: string;
  actual_exit_time?: string;
  actual_return_time?: string;
  notes?: string;
  authorizedBy?: { id: number; name?: string; first_name?: string; last_name?: string };
  created_at: string;
}

export default function StaffMovementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Expected Exit Time
  const [exitTime, setExitTime] = useState(new Date());
  const [showExitPicker, setShowExitPicker] = useState(false);
  const [exitPickerMode, setExitPickerMode] = useState<'date' | 'time'>('date');

  // Expected Return Time
  const [returnTime, setReturnTime] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)); // Default 2 hours later
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [returnPickerMode, setReturnPickerMode] = useState<'date' | 'time'>('date');

  const fetchMovements = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/staff/movements`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.movements) {
          setMovements(result.movements);
        }
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchMovements(true);
  }, [fetchMovements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovements(false);
  };

  const submitRequest = async () => {
    if (!destination || !purpose) {
      Alert.alert('Error', 'Please fill in all required fields (Destination, Purpose)');
      return;
    }

    if (returnTime <= exitTime) {
      Alert.alert('Error', 'Return time must be after exit time');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        destination,
        purpose,
        expected_exit_time: exitTime.toISOString(),
        expected_return_time: returnTime.toISOString(),
        notes
      };

      const response = await fetch(`${API_BASE_URL}/staff/movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Movement request submitted successfully');
        setShowForm(false);
        setDestination('');
        setPurpose('');
        setNotes('');
        setExitTime(new Date());
        setReturnTime(new Date(Date.now() + 2 * 60 * 60 * 1000));
        fetchMovements(true);
      } else {
        Alert.alert('Error', data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyles = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'pending': return { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
      case 'approved':
      case 'authorized': return { color: '#047857', bg: '#D1FAE5', border: '#A7F3D0' };
      case 'out': return { color: '#6D28D9', bg: '#EDE9FE', border: '#DDD6FE' };
      case 'returned': return { color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' };
      case 'rejected': return { color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' };
      default: return { color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' };
    }
  };

  const formatIsoDateString = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  const formatTimeString = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const openExitPicker = () => {
    setExitPickerMode('date');
    setShowExitPicker(true);
  };

  const openReturnPicker = () => {
    setReturnPickerMode('date');
    setShowReturnPicker(true);
  };

  const renderExitPicker = () => {
    if (!showExitPicker) return null;
    return (
      <DateTimePicker
        value={exitTime}
        mode={exitPickerMode}
        is24Hour={true}
        onChange={(event, selectedDate) => {
          if (Platform.OS === 'android') setShowExitPicker(false);
          if (selectedDate) {
            setExitTime(selectedDate);
            if (Platform.OS === 'android' && exitPickerMode === 'date') {
              setExitPickerMode('time');
              setShowExitPicker(true);
            }
          }
        }}
      />
    );
  };

  const renderReturnPicker = () => {
    if (!showReturnPicker) return null;
    return (
      <DateTimePicker
        value={returnTime}
        mode={returnPickerMode}
        is24Hour={true}
        onChange={(event, selectedDate) => {
          if (Platform.OS === 'android') setShowReturnPicker(false);
          if (selectedDate) {
            setReturnTime(selectedDate);
            if (Platform.OS === 'android' && returnPickerMode === 'date') {
              setReturnPickerMode('time');
              setShowReturnPicker(true);
            }
          }
        }}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Staff Movements</Text>
        <Pressable onPress={() => setShowForm(!showForm)} style={styles.actionButton}>
          {showForm ? <X color={theme.text} size={24} /> : <Plus color={theme.primary} size={24} />}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : showForm ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Request Gate Pass</Text>
          <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
            Submit details for HOD approval and gate security clearance
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Destination *</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              placeholder="e.g. Client Office / Bank / Project Site"
              placeholderTextColor={theme.textSecondary}
              value={destination}
              onChangeText={setDestination}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Purpose of Movement *</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              placeholder="e.g. Official document delivery / Meeting"
              placeholderTextColor={theme.textSecondary}
              value={purpose}
              onChangeText={setPurpose}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Expected Exit Time *</Text>
            <Pressable
              onPress={openExitPicker}
              style={[styles.dateInput, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
            >
              <Text style={{ color: theme.text }}>
                {exitTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
              <Calendar size={18} color={theme.textSecondary} />
            </Pressable>
            {renderExitPicker()}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Expected Return Time *</Text>
            <Pressable
              onPress={openReturnPicker}
              style={[styles.dateInput, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
            >
              <Text style={{ color: theme.text }}>
                {returnTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
              <Calendar size={18} color={theme.textSecondary} />
            </Pressable>
            {renderReturnPicker()}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Additional Notes</Text>
            <TextInput
              style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              placeholder="Any special instructions..."
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={() => setShowForm(false)}
            >
              <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
              onPress={submitRequest}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {/* Policy Banner */}
          <View style={[styles.policyBanner, { backgroundColor: theme.primary }]}>
            <View style={styles.policyIconContainer}>
              <Navigation size={40} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.policyTitle}>Gate Pass Policy</Text>
            <Text style={styles.policyText}>
              All official staff movements outside company premises during working hours require prior authorization from your HOD.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Movement Requests</Text>

          {movements.length > 0 ? (
            <View style={styles.listContainer}>
              {movements.map((m) => {
                const sStyles = getStatusStyles(m.status);

                return (
                  <View key={m.id} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <View style={[styles.iconBox, { backgroundColor: sStyles.bg, borderColor: sStyles.border }]}>
                          <MapPin size={20} color={sStyles.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.titleRow}>
                            <Text style={[styles.destination, { color: theme.text }]} numberOfLines={1}>
                              {m.destination}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: sStyles.bg, borderColor: sStyles.border }]}>
                              <Text style={[styles.statusText, { color: sStyles.color }]}>{m.status}</Text>
                            </View>
                          </View>
                          <Text style={[styles.purpose, { color: theme.textSecondary }]} numberOfLines={1}>
                            {m.purpose}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.timeContainer}>
                      <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                        Exit: {formatIsoDateString(m.expected_exit_time)}
                      </Text>
                      <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                        Return: {formatIsoDateString(m.expected_return_time)}
                      </Text>
                    </View>

                    {(m.actual_exit_time || m.actual_return_time) && (
                      <View style={[styles.actualTimeContainer, { backgroundColor: 'rgba(109, 40, 217, 0.1)' }]}>
                        {m.actual_exit_time && (
                          <Text style={[styles.actualTimeText, { color: '#6D28D9' }]}>
                            Gate Out: {formatTimeString(m.actual_exit_time)}
                          </Text>
                        )}
                        {m.actual_return_time && (
                          <Text style={[styles.actualTimeText, { color: '#6D28D9' }]}>
                            Gate In: {formatTimeString(m.actual_return_time)}
                          </Text>
                        )}
                      </View>
                    )}

                    {(m.authorizedBy?.name || m.notes) && (
                      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                        {m.authorizedBy?.name && (
                          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                            Auth by: {m.authorizedBy.name}
                          </Text>
                        )}
                        {m.notes && (
                          <Text style={[styles.notesText, { color: theme.textSecondary }]} numberOfLines={2}>
                            "{m.notes}"
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Clock color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No movement passes yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Tap the + icon above to request a new gate pass.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8, marginLeft: -8 },
  actionButton: { padding: 8, marginRight: -8 },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  // Form Styles
  formTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, marginBottom: 4 },
  formSubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, marginBottom: 24 },
  formGroup: { marginBottom: 16 },
  label: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
  submitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },

  // List Styles
  policyBanner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  policyIconContainer: { position: 'absolute', right: 10, top: 10 },
  policyTitle: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, marginBottom: 8 },
  policyText: { color: 'rgba(255,255,255,0.9)', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  listContainer: { gap: 16 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16 },
  cardHeader: { marginBottom: 12 },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  destination: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, textTransform: 'uppercase' },
  purpose: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
  timeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  timeText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  actualTimeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  actualTimeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  cardFooter: { borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  footerText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
  notesText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginBottom: 6 },
  emptySubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
