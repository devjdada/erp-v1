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
} from 'react-native';
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
  Target
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface User {
  id: number;
  name: string;
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks(false);
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
    if (p === 'urgent') return { bg: '#FEF2F2', text: '#DC2626' }; // red
    if (p === 'high') return { bg: '#FFF7ED', text: '#EA580C' }; // orange
    if (p === 'medium') return { bg: '#EFF6FF', text: '#2563EB' }; // blue
    return { bg: '#F8FAFC', text: '#475569' }; // slate
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return '#10B981'; // emerald
    if (s === 'in-progress') return '#4F46E5'; // indigo
    if (s === 'overdue') return '#EF4444'; // red
    return '#F59E0B'; // amber/pending
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F8FAFC' }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: '#F8FAFC' }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#0F172A" size={24} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            Task <Text style={styles.headerTitleHighlight}>Orchestrator</Text>
          </Text>
          <Text style={styles.headerSubtitle}>SMART goal-oriented task tracking.</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#003399" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003399']} />
          }
        >
          {/* Stats Overview */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#EFF6FF' }]}>
                <Layout size={20} color="#2563EB" />
              </View>
              <Text style={styles.statLabel}>TOTAL FILTERED</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#FFFBEB' }]}>
                <Clock size={20} color="#D97706" />
              </View>
              <Text style={styles.statLabel}>PENDING</Text>
              <Text style={styles.statValue}>{stats.pending}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2FF' }]}>
                <BarChart3 size={20} color="#4F46E5" />
              </View>
              <Text style={styles.statLabel}>IN PROGRESS</Text>
              <Text style={styles.statValue}>{stats.inProgress}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#ECFDF5' }]}>
                <CheckCircle2 size={20} color="#059669" />
              </View>
              <Text style={styles.statLabel}>COMPLETED</Text>
              <Text style={styles.statValue}>{stats.completed}</Text>
            </View>
          </ScrollView>

          {/* Filters & Search */}
          <View style={styles.filtersContainer}>
            <View style={styles.searchBox}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                placeholderTextColor="#94A3B8"
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
                    onPress={() => {
                      // Optional: navigate to details if implemented
                    }}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
                        <Text style={[styles.priorityText, { color: pStyle.text }]}>
                          {task.priority?.toUpperCase() || 'NORMAL'}
                        </Text>
                      </View>
                      <View style={styles.dateBlock}>
                        <Clock size={12} color="#94A3B8" />
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
                          <View style={[styles.avatar, { marginLeft: -8, backgroundColor: '#F1F5F9' }]}>
                            <Text style={styles.avatarText}>+{assignees.length - 3}</Text>
                          </View>
                        )}
                        {assignees.length === 0 && (
                          <View style={[styles.avatar, { backgroundColor: '#F1F5F9' }]}>
                            <Text style={[styles.avatarText, { color: '#94A3B8', fontStyle: 'italic' }]}>?</Text>
                          </View>
                        )}
                      </View>

                      {task.creator?.staff?.department?.name && (
                        <View style={styles.deptBadge}>
                          <Layout size={10} color="#003399" />
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
                        <View style={[styles.statusIconWrapper, { backgroundColor: task.status === 'completed' ? '#ECFDF5' : '#F8FAFC' }]}>
                          {task.status === 'completed' ? (
                            <CheckCircle2 size={24} color="#059669" />
                          ) : (
                            <Circle size={24} color="#CBD5E1" />
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
              <Target color="#CBD5E1" size={48} strokeWidth={1.5} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query or filters.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    color: '#0F172A',
  },
  headerTitleHighlight: {
    color: '#003399',
  },
  headerSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    color: '#0F172A',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    gap: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  filterTabs: {
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  filterTabActive: {
    backgroundColor: '#003399',
    borderColor: '#003399',
  },
  filterTabText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
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
    color: '#94A3B8',
  },
  taskTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: '#0F172A',
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
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 10,
    color: '#64748B',
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    maxWidth: 120,
  },
  deptText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#003399',
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
    color: '#0F172A',
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    color: '#94A3B8',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#94A3B8',
  },
});
