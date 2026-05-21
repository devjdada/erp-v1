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
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, Users, Calendar, Clock, UserCheck,
  Plus, X, Car, MapPin, UserPlus, Info
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface VisitorLog {
  id: number;
  name: string;
  phone?: string;
  company?: string;
  purpose?: string;
  check_in: string;
  check_out?: string | null;
  status: 'pending' | 'checked in' | 'checked out' | string;
  number_of_people?: number;
  vehicle_reg_number?: string;
  expected_arrival?: string;
  created_at?: string;
  host_staff?: {
    first_name: string;
    surname: string;
  } | null;
}

export default function VisitorsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: '',
    number_of_people: '1',
    vehicle_reg_number: '',
    expected_arrival: '',
  });

  const fetchVisitors = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/security/visitors`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setVisitors(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchVisitors(true);
  }, [fetchVisitors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitors(false);
  };

  const submitVisitor = async () => {
    if (!formData.name || !formData.purpose) {
      Alert.alert("Required Fields", "Please fill in the visitor's name and purpose.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Endpoint assumption for creating a staff visitor
      const response = await fetch(`${API_BASE_URL}/staff/visitors`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...formData,
          number_of_people: parseInt(formData.number_of_people) || 1,
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Visitor registered successfully.");
        setModalVisible(false);
        setFormData({ name: '', phone: '', purpose: '', number_of_people: '1', vehicle_reg_number: '', expected_arrival: '' });
        fetchVisitors(true);
      } else {
        Alert.alert("Error", "Failed to register visitor.");
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyles = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'pending') return { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' }; // Amber
    if (s === 'checked in') return { color: '#047857', bg: '#D1FAE5', border: '#A7F3D0' }; // Emerald
    if (s === 'checked out') return { color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' }; // Slate
    return { color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' }; // Default
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#EE1C25" size={20} />
          </Pressable>
          <View>
            <Text style={[styles.breadcrumb, { color: '#EE1C25' }]}>PORTAL / WORKSPACE</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Visitors Log</Text>
          </View>
        </View>
        <Pressable 
          style={styles.headerAddBtn} 
          onPress={() => setModalVisible(true)}
        >
          <Plus color="#FFF" size={16} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EE1C25" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EE1C25']} />}
        >
          {visitors.length > 0 ? (
            <View style={styles.listContainer}>
              {visitors.map((log) => {
                const sStyle = getStatusStyles(log.status);

                return (
                  <Pressable
                    key={log.id}
                    style={[styles.visitorCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconWrapper, { backgroundColor: `${sStyle.bg}80` }]}>
                        <UserCheck color={sStyle.color} size={20} />
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: sStyle.bg, borderColor: sStyle.border }]}>
                        <Text style={[styles.statusText, { color: sStyle.color }]}>
                          {log.status?.toUpperCase() || 'UNKNOWN'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.visitorName, { color: theme.text }]}>{log.name}</Text>
                    <View style={styles.purposeRow}>
                      <MapPin size={12} color={theme.textSecondary} />
                      <Text style={[styles.purposeText, { color: theme.textSecondary }]}>
                        {log.purpose || 'Official Visit'}
                      </Text>
                    </View>

                    <View style={[styles.detailsSection, { borderTopColor: theme.border }]}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconLabel}>
                          <Users size={14} color={theme.textSecondary} style={{ opacity: 0.6 }} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>PEOPLE</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{log.number_of_people || 1}</Text>
                      </View>
                      
                      {log.vehicle_reg_number && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailIconLabel}>
                            <Car size={14} color={theme.textSecondary} style={{ opacity: 0.6 }} />
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>VEHICLE</Text>
                          </View>
                          <Text style={[styles.detailValue, { color: theme.text }]}>{log.vehicle_reg_number}</Text>
                        </View>
                      )}

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconLabel}>
                          <Calendar size={14} color={theme.textSecondary} style={{ opacity: 0.6 }} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>CREATED</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                          {log.created_at ? formatDateTime(log.created_at) : formatDateTime(log.check_in)}
                        </Text>
                      </View>
                    </View>

                    {(log.check_in || log.check_out) && (
                      <View style={[styles.timeSection, { borderTopColor: theme.border }]}>
                        {log.check_in && (
                          <View style={styles.timeBlock}>
                            <Clock size={12} color="#059669" />
                            <Text style={[styles.timeText, { color: '#059669' }]}>
                              IN: {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        )}
                        {log.check_out && (
                          <View style={styles.timeBlock}>
                            <Clock size={12} color={theme.textSecondary} />
                            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                              OUT: {new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: theme.background }]}>
                <Users color={theme.textSecondary} size={40} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Visitors Registered</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                You haven't registered any visitors yet.
              </Text>
              <Pressable 
                style={styles.emptyActionBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.emptyActionText}>REGISTER A VISITOR</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <Pressable 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Plus color="#FFF" size={24} />
      </Pressable>

      {/* Registration Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalHeader, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.breadcrumb, { color: '#EE1C25' }]}>PORTAL / VISITORS</Text>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Register Visitor</Text>
            </View>
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <X color={theme.text} size={24} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.formCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Visitor Full Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter full name"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.name}
                  onChangeText={(t) => setFormData({...formData, name: t})}
                />
              </View>

              <View style={styles.rowGroup}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="+234..."
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(t) => setFormData({...formData, phone: t})}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>No. of People *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="1"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    value={formData.number_of_people}
                    onChangeText={(t) => setFormData({...formData, number_of_people: t})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Vehicle Registration (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="e.g. ABC-123-XY"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.vehicle_reg_number}
                  onChangeText={(t) => setFormData({...formData, vehicle_reg_number: t})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Purpose of Visit *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="e.g. Official Meeting, Delivery, personal visit..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  value={formData.purpose}
                  onChangeText={(t) => setFormData({...formData, purpose: t})}
                />
              </View>

              <Pressable 
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={submitVisitor}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <UserPlus color="#FFF" size={18} />
                    <Text style={styles.submitBtnText}>REGISTER VISITOR</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.infoHeader}>
                <View style={styles.infoIcon}>
                  <Info color="#2563EB" size={18} />
                </View>
                <Text style={[styles.infoTitle, { color: theme.text }]}>SECURITY NOTE</Text>
              </View>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Pre-registering your visitors helps our security team process them faster at the gate. Registered visitors only need to provide their name for verification.
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: { padding: 4 },
  breadcrumb: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  headerAddBtn: {
    backgroundColor: '#EE1C25',
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EE1C25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  listContainer: { gap: 16 },
  visitorCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconWrapper: {
    padding: 12,
    borderRadius: 14,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 9,
    letterSpacing: 1,
  },
  visitorName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    marginBottom: 4,
  },
  purposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  purposeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
  },
  timeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 9,
    letterSpacing: 1,
  },
  emptyContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  emptyActionBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  emptyActionText: {
    color: '#FFF',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#EE1C25',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EE1C25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  modalContent: { padding: 24 },
  formCard: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#EE1C25',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#EE1C25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoIcon: {
    backgroundColor: '#DBEAFE',
    padding: 8,
    borderRadius: 12,
  },
  infoTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1,
  },
  infoText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    lineHeight: 20,
  },
});
