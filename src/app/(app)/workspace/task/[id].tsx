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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Layout,
  BarChart3,
  Target,
  TrendingUp,
  UserPlus,
  History,
  MessageSquare,
  X,
  Check
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const { authToken, user: currentUser } = useAuth();

  const [task, setTask] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Forms
  const [updateForm, setUpdateForm] = useState({
    update_text: '',
    progress_change: '0',
    new_status: 'pending',
  });

  const [assignForm, setAssignForm] = useState({
    user_ids: [] as number[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTaskDetails = useCallback(async (showLoader = false) => {
    if (!authToken || !id) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTask(result.data);
          setUpdateForm(prev => ({ ...prev, new_status: result.data.status }));
          const assignedIds = (result.data.assigned_users || result.data.assignedUsers || []).map((u: any) => u.id);
          setAssignForm({ user_ids: assignedIds });
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken, id]);

  const fetchUsers = useCallback(async () => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/users`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUsers(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [authToken]);

  useEffect(() => {
    fetchTaskDetails(true);
    fetchUsers();
  }, [fetchTaskDetails, fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTaskDetails(false);
  };

  const submitUpdate = async () => {
    if (!updateForm.update_text) {
      Alert.alert('Required', 'Please describe what has been achieved.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/progress`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          update_text: updateForm.update_text,
          progress_change: parseInt(updateForm.progress_change) || 0,
          new_status: updateForm.new_status,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setIsUpdateModalOpen(false);
        setUpdateForm(prev => ({ ...prev, update_text: '', progress_change: '0' }));
        fetchTaskDetails(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to update progress.');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'An error occurred while updating task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAssign = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/assign`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          user_ids: assignForm.user_ids,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setIsAssignModalOpen(false);
        fetchTaskDetails(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to update assignments.');
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      Alert.alert('Error', 'An error occurred while assigning staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserAssignment = (userId: number) => {
    setAssignForm(prev => {
      const isAssigned = prev.user_ids.includes(userId);
      return {
        user_ids: isAssigned 
          ? prev.user_ids.filter(i => i !== userId)
          : [...prev.user_ids, userId]
      };
    });
  };

  const getPriorityStyle = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === 'urgent') return { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626' }; 
    if (p === 'high') return { bg: 'rgba(234, 88, 12, 0.1)', text: '#EA580C' };
    if (p === 'medium') return { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563EB' };
    return { bg: theme.backgroundSelected, text: theme.textSecondary };
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: theme.textSecondary }}>Task not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, padding: 12, backgroundColor: theme.primary, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const pStyle = getPriorityStyle(task.priority);
  const assignedUsers = task.assigned_users || task.assignedUsers || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Task <Text style={styles.headerTitleHighlight}>#{task.id.toString().padStart(5, '0')}</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}
            onPress={() => setIsAssignModalOpen(true)}
          >
            <UserPlus color={theme.text} size={18} />
          </Pressable>
          <Pressable 
            style={[styles.iconButton, { backgroundColor: theme.primary, marginLeft: 8 }]}
            onPress={() => setIsUpdateModalOpen(true)}
          >
            <TrendingUp color="#FFFFFF" size={18} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
      >
        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.priorityRow}>
              <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
                <Text style={[styles.priorityText, { color: pStyle.text }]}>
                  {task.priority?.toUpperCase()} PRIORITY
                </Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressPercent}>{task.progress || 0}%</Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>
          
          <Text style={styles.taskTitle}>{task.title}</Text>

          <View style={styles.contextBox}>
            <View style={styles.contextHeader}>
              <Layout size={14} color={theme.primary} />
              <Text style={styles.contextTitle}>Task Context</Text>
            </View>
            <Text style={styles.contextDesc}>
              {task.description || "No specific description provided."}
            </Text>
          </View>
        </View>

        {/* SMART Alignment */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={theme.primary} />
            <Text style={styles.sectionTitle}>SMART Alignment</Text>
          </View>
          <View style={styles.smartGrid}>
            <SmartItem label="Specific" value={task.goal_specific} icon={<Layout size={16} color="#6366f1" />} theme={theme} />
            <SmartItem label="Measurable" value={task.goal_measurable} icon={<BarChart3 size={16} color="#10b981" />} theme={theme} />
            <SmartItem label="Achievable" value={task.goal_achievable} icon={<TrendingUp size={16} color="#3b82f6" />} theme={theme} />
            <SmartItem label="Relevant" value={task.goal_relevant} icon={<CheckCircle2 size={16} color="#f97316" />} theme={theme} />
            <SmartItem label="Time-bound" value={task.goal_time_bound} icon={<Clock size={16} color="#ef4444" />} theme={theme} />
          </View>
        </View>

        {/* Sidebar Data: Assignees & Timeline */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubTitle}>ASSIGNEES</Text>
          </View>
          <View style={styles.assigneesList}>
            {assignedUsers.map((user: any) => (
              <View key={user.id} style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userRole}>Collaborator</Text>
                </View>
              </View>
            ))}
            {assignedUsers.length === 0 && (
              <Text style={styles.italicEmpty}>No personnel assigned.</Text>
            )}
          </View>

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionSubTitle}>OWNERSHIP</Text>
          </View>
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={[styles.avatarText, { color: '#FFF' }]}>{task.creator?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{task.creator?.name || 'Unknown'}</Text>
              <Text style={styles.userRole}>Department Head / Admin</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionSubTitle}>TIMELINE METRICS</Text>
          <View style={styles.metricsList}>
            <View style={styles.metricRow}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                  <Clock size={14} color="#2563EB" />
                </View>
                <Text style={styles.metricLabel}>Created</Text>
              </View>
              <Text style={styles.metricValue}>{new Date(task.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Clock size={14} color="#EF4444" />
                </View>
                <Text style={styles.metricLabel}>Deadline</Text>
              </View>
              <Text style={styles.metricValue}>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Target size={14} color="#6366f1" />
                </View>
                <Text style={styles.metricLabel}>Linked To</Text>
              </View>
              <Text style={styles.metricValue}>{task.taskable_type ? task.taskable_type.split('\\').pop() : 'General'}</Text>
            </View>
          </View>
        </View>

        {/* Operational Timeline */}
        <View style={[styles.card, { marginBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <History size={18} color={theme.primary} />
            <Text style={styles.sectionTitle}>Operational Timeline</Text>
          </View>
          <View style={styles.timelineList}>
            {task.updates && task.updates.length > 0 ? (
              task.updates.map((update: any, index: number) => {
                const isLast = index === task.updates.length - 1;
                return (
                  <View key={update.id} style={styles.timelineItem}>
                    <View style={styles.timelineLineWrapper}>
                      <View style={[styles.timelineDot, { borderColor: theme.backgroundElement }]} />
                      {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <View style={styles.timelineUser}>
                          <View style={[styles.timelineAvatar, { backgroundColor: theme.backgroundSelected }]}>
                            <Text style={styles.timelineAvatarText}>{update.user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                          </View>
                          <View>
                            <Text style={styles.timelineUserName}>{update.user?.name || 'Unknown'}</Text>
                            <Text style={styles.timelineDate}>{new Date(update.created_at).toLocaleString()}</Text>
                          </View>
                        </View>
                        {update.progress_change > 0 && (
                          <View style={styles.progressGainBadge}>
                            <Text style={styles.progressGainText}>+{update.progress_change}%</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.timelineBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                        <Text style={styles.timelineText}>{update.update_text}</Text>
                        {update.new_status && (
                          <View style={styles.timelineStatusBadge}>
                            <Text style={styles.timelineStatusText}>Status: {update.new_status}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyUpdates}>
                <MessageSquare size={32} color={theme.textSecondary} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={styles.emptyUpdatesText}>No operational updates recorded yet.</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Update Progress Modal */}
      <Modal
        visible={isUpdateModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsUpdateModalOpen(false)}
      >
        <KeyboardAvoidingView style={[styles.modalContainer, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalHeader, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Record Progress</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>Update the status and percentage of completion.</Text>
            </View>
            <Pressable onPress={() => setIsUpdateModalOpen(false)} style={{ padding: 8 }}>
              <X color={theme.text} size={24} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Activity Report</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
                placeholder="Describe what has been achieved..."
                placeholderTextColor={theme.textSecondary}
                value={updateForm.update_text}
                onChangeText={t => setUpdateForm(prev => ({...prev, update_text: t}))}
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.formLabel}>Progress Gain (%)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
                  keyboardType="numeric"
                  value={updateForm.progress_change}
                  onChangeText={t => setUpdateForm(prev => ({...prev, progress_change: t}))}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>New Status</Text>
                <View style={styles.statusOptions}>
                  {['pending', 'in-progress', 'completed', 'cancelled'].map(s => (
                    <Pressable
                      key={s}
                      style={[
                        styles.statusOption,
                        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                        updateForm.new_status === s && { borderColor: theme.primary, backgroundColor: 'rgba(30, 111, 253, 0.1)' }
                      ]}
                      onPress={() => setUpdateForm(prev => ({...prev, new_status: s}))}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        { color: theme.textSecondary },
                        updateForm.new_status === s && { color: theme.primary }
                      ]}>{s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Pressable 
              style={[styles.submitButton, isSubmitting && {opacity: 0.7}]} 
              onPress={submitUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Commit Update</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        visible={isAssignModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAssignModalOpen(false)}
      >
        <KeyboardAvoidingView style={[styles.modalContainer, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalHeader, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Assign Personnel</Text>
            <Pressable onPress={() => setIsAssignModalOpen(false)} style={{ padding: 8 }}>
              <X color={theme.text} size={24} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.formContent}>
            <Text style={styles.formLabel}>Select Users</Text>
            {users.map(user => {
              const isSelected = assignForm.user_ids.includes(user.id);
              return (
                <Pressable
                  key={user.id}
                  style={[
                    styles.userListItem,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    isSelected && { borderColor: theme.primary, backgroundColor: 'rgba(30, 111, 253, 0.05)' }
                  ]}
                  onPress={() => toggleUserAssignment(user.id)}
                >
                  <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
                  {isSelected && <Check size={20} color={theme.primary} />}
                </Pressable>
              );
            })}
            
            <Pressable 
              style={[styles.submitButton, isSubmitting && {opacity: 0.7}, { marginTop: 20 }]} 
              onPress={submitAssign}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Update Assignments</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SmartItem({ label, value, icon, theme }: any) {
  const styles = getStyles(theme);
  return (
    <View style={[styles.smartItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <View style={[styles.smartIconWrap, { backgroundColor: theme.backgroundSelected }]}>
        {icon}
      </View>
      <View style={styles.smartTextWrap}>
        <Text style={styles.smartLabel}>{label}</Text>
        <Text style={[styles.smartValue, { color: theme.text }]}>{value || "Not defined."}</Text>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitleContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20 },
  headerTitleHighlight: { color: theme.primary },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16 },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: theme.backgroundElement, // Defaults overridden by inline or theme if needed
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  priorityRow: { flexDirection: 'row', alignItems: 'center' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  priorityText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, letterSpacing: 1 },
  progressContainer: { alignItems: 'flex-end' },
  progressPercent: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, color: theme.primary, lineHeight: 28 },
  progressLabel: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 9, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  taskTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, lineHeight: 32, marginBottom: 20 },
  contextBox: { padding: 16, borderRadius: 16, backgroundColor: theme.backgroundSelected }, // Default
  contextHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  contextTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: theme.primary, textTransform: 'uppercase', letterSpacing: 1 },
  contextDesc: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: theme.text, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16 },
  sectionSubTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  smartGrid: { gap: 12 },
  smartItem: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12, alignItems: 'flex-start' },
  smartIconWrap: { padding: 8, borderRadius: 10 },
  smartTextWrap: { flex: 1 },
  smartLabel: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 9, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  smartValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, lineHeight: 18 },
  assigneesList: { gap: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14, color: theme.textSecondary },
  userInfo: { flex: 1 },
  userName: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14 },
  userRole: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: theme.textSecondary },
  italicEmpty: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: theme.textSecondary, fontStyle: 'italic', paddingVertical: 8 },
  metricsList: { gap: 16 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricIconWrap: { padding: 8, borderRadius: 10 },
  metricLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: theme.textSecondary },
  metricValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 12 },
  timelineList: { paddingLeft: 8, marginTop: 12 },
  timelineItem: { flexDirection: 'row', marginBottom: 24 },
  timelineLineWrapper: { width: 24, alignItems: 'center', marginRight: 12 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.primary, borderWidth: 3, zIndex: 2 },
  timelineLine: { position: 'absolute', top: 20, bottom: -24, width: 2, zIndex: 1 },
  timelineContent: { flex: 1, marginTop: -2 },
  timelineHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  timelineUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineAvatarText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: theme.textSecondary },
  timelineUserName: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 12 },
  timelineDate: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, color: theme.textSecondary },
  progressGainBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  progressGainText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: '#10b981' },
  timelineBox: { padding: 16, borderRadius: 16, borderWidth: 1 },
  timelineText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20, color: theme.text },
  timelineStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, backgroundColor: 'rgba(59, 130, 246, 0.1)', marginTop: 12 },
  timelineStatusText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 9, color: theme.primary, textTransform: 'uppercase', letterSpacing: 1 },
  emptyUpdates: { alignItems: 'center', paddingVertical: 32 },
  emptyUpdatesText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: theme.textSecondary, fontStyle: 'italic' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18 },
  formContent: { padding: 16 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row' },
  formLabel: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  formInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  formTextArea: { height: 100, textAlignVertical: 'top' },
  statusOptions: { gap: 8 },
  statusOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  statusOptionText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  userListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  submitButton: { backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  submitButtonText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: '#FFFFFF' },
});
