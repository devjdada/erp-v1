import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Search,
  Layout,
  BarChart3,
  Target,
  Plus,
  X,
  Check
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface User {
  id: number;
  name: string;
  staff?: { department?: { name: string } };
}

interface TaskRecord {
  id: number;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | string;
  progress: number;
  created_at: string;
  assigned_users?: User[];
  assignedUsers?: User[];
  creator?: { staff?: { department?: { name: string } } };
  taskable_type?: string;
}

export default function TasksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Task State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    goal_specific: '',
    goal_measurable: '',
    goal_achievable: '',
    goal_relevant: '',
    goal_time_bound: '',
    assigned_users: [] as number[],
  });

  const fetchTasks = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTasks(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

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
          setAvailableUsers(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [authToken]);

  useEffect(() => {
    fetchTasks(true);
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks(false);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateValue;
    setShowDatePicker(Platform.OS === 'ios');
    setDateValue(currentDate);
    setFormData(prev => ({...prev, due_date: currentDate.toISOString().split('T')[0]}));
  };

  const handleCreateTask = async () => {
    if (!formData.title || !formData.due_date) {
      Alert.alert('Required Fields', 'Please provide a Title and a Due Date (YYYY-MM-DD).');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
        setCreateModalVisible(false);
        setFormData({
          title: '', description: '', priority: 'medium', due_date: '',
          goal_specific: '', goal_measurable: '', goal_achievable: '',
          goal_relevant: '', goal_time_bound: '', assigned_users: []
        });
        fetchTasks(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'An error occurred while creating the task.');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleUserAssignment = (userId: number) => {
    setFormData(prev => {
      const isAssigned = prev.assigned_users.includes(userId);
      return {
        ...prev,
        assigned_users: isAssigned 
          ? prev.assigned_users.filter(id => id !== userId)
          : [...prev.assigned_users, userId]
      };
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title?.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query);
        const assignees = task.assigned_users || task.assignedUsers || [];
        const matchAssignee = assignees.some((u: User) => u.name?.toLowerCase().includes(query));

        if (!matchTitle && !matchDesc && !matchAssignee) {
          return false;
        }
      }

      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      pending: filteredTasks.filter(t => t.status === 'pending').length,
      inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
      completed: filteredTasks.filter(t => t.status === 'completed').length,
    };
  }, [filteredTasks]);

  const getPriorityStyle = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === 'urgent') return { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626' }; 
    if (p === 'high') return { bg: 'rgba(234, 88, 12, 0.1)', text: '#EA580C' };
    if (p === 'medium') return { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563EB' };
    return { bg: theme.backgroundSelected, text: theme.textSecondary };
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.background,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: 8,
    },
    headerTitle: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 20,
      color: theme.text,
    },
    headerTitleHighlight: {
      color: theme.primary,
    },
    headerSubtitle: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    createButton: {
      backgroundColor: theme.primary,
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    statsContainer: {
      gap: 12,
      paddingBottom: 16,
    },
    statCard: {
      backgroundColor: theme.backgroundElement,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      width: 140,
    },
    statIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    statLabel: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 10,
      color: theme.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    statValue: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 24,
      color: theme.text,
    },
    filtersContainer: {
      backgroundColor: theme.backgroundElement,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
      gap: 16,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 14,
      color: theme.text,
    },
    filterTabs: {
      gap: 8,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundElement,
    },
    filterTabActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterTabText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 12,
      color: theme.textSecondary,
    },
    filterTabTextActive: {
      color: '#FFFFFF', // active text is always white against primary
    },
    listContainer: {
      gap: 16,
    },
    taskCard: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 100,
    },
    priorityText: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 9,
      letterSpacing: 0.5,
    },
    dateBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dateText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 10,
      color: theme.textSecondary,
    },
    taskTitle: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 18,
      color: theme.text,
      marginBottom: 16,
      lineHeight: 24,
    },
    middleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    avatarsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.backgroundSelected,
      borderWidth: 2,
      borderColor: theme.backgroundElement,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 10,
      color: theme.textSecondary,
    },
    deptBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundSelected,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
      maxWidth: 120,
    },
    deptText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 10,
      color: theme.textSecondary,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressSection: {
      flex: 1,
      marginRight: 20,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: theme.backgroundSelected,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 4,
    },
    statusSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statusTextWrapper: {
      alignItems: 'flex-end',
    },
    progressPercent: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 14,
      color: theme.text,
    },
    statusText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 9,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statusIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      backgroundColor: theme.backgroundElement,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyTitle: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 16,
      color: theme.text,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 12,
      color: theme.textSecondary,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.backgroundElement,
    },
    modalTitle: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 18,
      color: theme.text,
    },
    formContent: {
      padding: 16,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    formInput: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 15,
      color: theme.text,
    },
    formTextArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    priorityOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    priorityOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
    },
    priorityOptionActive: {
      borderColor: theme.primary,
      backgroundColor: 'rgba(30, 111, 253, 0.1)',
    },
    priorityOptionText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 12,
      color: theme.textSecondary,
    },
    priorityOptionTextActive: {
      color: theme.primary,
    },
    smartSection: {
      backgroundColor: theme.backgroundElement,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
    },
    smartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    smartTitle: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 14,
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    userListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    userListItemActive: {
      borderColor: theme.primary,
      backgroundColor: 'rgba(30, 111, 253, 0.05)',
    },
    userName: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 14,
      color: theme.text,
    },
    userDept: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 40,
    },
    submitButtonText: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 16,
      color: '#FFFFFF',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            Task <Text style={styles.headerTitleHighlight}>Orchestrator</Text>
          </Text>
          <Text style={styles.headerSubtitle}>SMART goal-oriented task tracking.</Text>
        </View>
        <Pressable 
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus color="#FFFFFF" size={20} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
        >
          {/* Stats Overview */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                <Layout size={20} color="#2563EB" />
              </View>
              <Text style={styles.statLabel}>TOTAL FILTERED</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                <Clock size={20} color="#D97706" />
              </View>
              <Text style={styles.statLabel}>PENDING</Text>
              <Text style={styles.statValue}>{stats.pending}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}>
                <BarChart3 size={20} color="#4F46E5" />
              </View>
              <Text style={styles.statLabel}>IN PROGRESS</Text>
              <Text style={styles.statValue}>{stats.inProgress}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
                <CheckCircle2 size={20} color="#059669" />
              </View>
              <Text style={styles.statLabel}>COMPLETED</Text>
              <Text style={styles.statValue}>{stats.completed}</Text>
            </View>
          </ScrollView>

          {/* Filters & Search */}
          <View style={styles.filtersContainer}>
            <View style={styles.searchBox}>
              <Search size={18} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
              <Pressable 
                style={[styles.filterTab, statusFilter === 'all' && styles.filterTabActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.filterTabText, statusFilter === 'all' && styles.filterTabTextActive]}>All</Text>
              </Pressable>
              <Pressable 
                style={[styles.filterTab, statusFilter === 'pending' && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
                onPress={() => setStatusFilter('pending')}
              >
                <Text style={[styles.filterTabText, statusFilter === 'pending' && { color: '#FFFFFF' }]}>Pending</Text>
              </Pressable>
              <Pressable 
                style={[styles.filterTab, statusFilter === 'in-progress' && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }]}
                onPress={() => setStatusFilter('in-progress')}
              >
                <Text style={[styles.filterTabText, statusFilter === 'in-progress' && { color: '#FFFFFF' }]}>In Progress</Text>
              </Pressable>
              <Pressable 
                style={[styles.filterTab, statusFilter === 'completed' && { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                onPress={() => setStatusFilter('completed')}
              >
                <Text style={[styles.filterTabText, statusFilter === 'completed' && { color: '#FFFFFF' }]}>Completed</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Tasks List */}
          {filteredTasks.length > 0 ? (
            <View style={styles.listContainer}>
              {filteredTasks.map((task) => {
                const pStyle = getPriorityStyle(task.priority);
                const assignees = task.assigned_users || task.assignedUsers || [];
                const prog = task.progress || 0;

                return (
                  <Pressable
                    key={task.id}
                    style={styles.taskCard}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
                        <Text style={[styles.priorityText, { color: pStyle.text }]}>
                          {task.priority?.toUpperCase() || 'NORMAL'}
                        </Text>
                      </View>
                      <View style={styles.dateBlock}>
                        <Clock size={12} color={theme.textSecondary} />
                        <Text style={styles.dateText}>
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.taskTitle}>{task.title}</Text>

                    <View style={styles.middleRow}>
                      <View style={styles.avatarsRow}>
                        {assignees.slice(0, 3).map((u: User, i: number) => (
                          <View key={u.id} style={[styles.avatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                            <Text style={styles.avatarText}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                          </View>
                        ))}
                        {assignees.length > 3 && (
                          <View style={[styles.avatar, { marginLeft: -8 }]}>
                            <Text style={styles.avatarText}>+{assignees.length - 3}</Text>
                          </View>
                        )}
                        {assignees.length === 0 && (
                          <View style={styles.avatar}>
                            <Text style={[styles.avatarText, { fontStyle: 'italic' }]}>?</Text>
                          </View>
                        )}
                      </View>

                      {task.creator?.staff?.department?.name && (
                        <View style={styles.deptBadge}>
                          <Layout size={10} color={theme.primary} />
                          <Text style={styles.deptText} numberOfLines={1}>{task.creator.staff.department.name}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.progressSection}>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${prog}%` }]} />
                        </View>
                      </View>
                      <View style={styles.statusSection}>
                        <View style={styles.statusTextWrapper}>
                          <Text style={styles.progressPercent}>{prog}%</Text>
                          <Text style={styles.statusText}>{task.status}</Text>
                        </View>
                        <View style={[styles.statusIconWrapper, { backgroundColor: task.status === 'completed' ? 'rgba(5, 150, 105, 0.1)' : theme.backgroundSelected }]}>
                          {task.status === 'completed' ? (
                            <CheckCircle2 size={24} color="#059669" />
                          ) : (
                            <Circle size={24} color={theme.border} />
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Target color={theme.textSecondary} size={48} strokeWidth={1.5} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query or filters.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Task Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New SMART Task</Text>
            <Pressable onPress={() => setCreateModalVisible(false)} style={{ padding: 8 }}>
              <X color={theme.text} size={24} />
            </Pressable>
          </View>
          
          <ScrollView contentContainerStyle={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Task Title</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter task title"
                placeholderTextColor={theme.textSecondary}
                value={formData.title}
                onChangeText={(t) => setFormData(prev => ({...prev, title: t}))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Task Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Enter detailed task description..."
                placeholderTextColor={theme.textSecondary}
                value={formData.description}
                onChangeText={(t) => setFormData(prev => ({...prev, description: t}))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.priorityOptions}>
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <Pressable 
                    key={p}
                    style={[styles.priorityOption, formData.priority === p && styles.priorityOptionActive]}
                    onPress={() => setFormData(prev => ({...prev, priority: p}))}
                  >
                    <Text style={[styles.priorityOptionText, formData.priority === p && styles.priorityOptionTextActive]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Due Date</Text>
              <Pressable 
                style={styles.formInput} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: formData.due_date ? theme.text : theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15 }}>
                  {formData.due_date || "Select Due Date"}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Assign Users</Text>
              {availableUsers.map((user) => {
                const isSelected = formData.assigned_users.includes(user.id);
                return (
                  <Pressable 
                    key={user.id}
                    style={[styles.userListItem, isSelected && styles.userListItemActive]}
                    onPress={() => toggleUserAssignment(user.id)}
                  >
                    <View>
                      <Text style={styles.userName}>{user.name}</Text>
                      {user.staff?.department?.name && (
                        <Text style={styles.userDept}>{user.staff.department.name}</Text>
                      )}
                    </View>
                    {isSelected && <Check size={20} color={theme.primary} />}
                  </Pressable>
                );
              })}
              {availableUsers.length === 0 && (
                <Text style={{color: theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13}}>
                  No users available or failed to load.
                </Text>
              )}
            </View>

            <View style={styles.smartSection}>
              <View style={styles.smartHeader}>
                <Target size={18} color={theme.primary} />
                <Text style={styles.smartTitle}>SMART Alignment</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Specific (What exactly needs to be done?)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.goal_specific}
                  onChangeText={(t) => setFormData(prev => ({...prev, goal_specific: t}))}
                  multiline
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Measurable (How will we know it's done?)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.goal_measurable}
                  onChangeText={(t) => setFormData(prev => ({...prev, goal_measurable: t}))}
                  multiline
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Achievable (Is this realistic?)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.goal_achievable}
                  onChangeText={(t) => setFormData(prev => ({...prev, goal_achievable: t}))}
                  multiline
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Relevant (Does this align with our goals?)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.goal_relevant}
                  onChangeText={(t) => setFormData(prev => ({...prev, goal_relevant: t}))}
                  multiline
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time-bound (What is the hard deadline?)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.goal_time_bound}
                  onChangeText={(t) => setFormData(prev => ({...prev, goal_time_bound: t}))}
                  multiline
                />
              </View>
            </View>

            <Pressable 
              style={[styles.submitButton, isCreating && {opacity: 0.7}]} 
              onPress={handleCreateTask}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Launch SMART Task</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
