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
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckSquare, Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface TaskRecord {
  id: number;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | string;
  created_at: string;
}

export default function TasksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const getPriorityColor = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === 'high') return '#EF4444';
    if (p === 'medium') return '#F59E0B';
    return '#10B981';
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return '#10B981';
    if (s === 'in-progress') return '#3B82F6';
    if (s === 'overdue') return '#EF4444';
    return '#64748B'; // pending
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return 'rgba(16, 185, 129, 0.08)';
    if (s === 'in-progress') return 'rgba(59, 130, 246, 0.08)';
    if (s === 'overdue') return 'rgba(239, 68, 68, 0.08)';
    return 'rgba(100, 116, 139, 0.08)';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Tasks</Text>
        <View style={{ width: 40 }} />
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Task Assignments</Text>
          {tasks.length > 0 ? (
            <View style={styles.listContainer}>
              {tasks.map((task) => {
                const priorityColor = getPriorityColor(task.priority);
                const statusColor = getStatusColor(task.status);
                const statusBg = getStatusBg(task.status);

                return (
                  <View
                    key={task.id}
                    style={[styles.taskCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.priorityTag, { backgroundColor: `${priorityColor}15` }]}>
                          <Text style={[styles.priorityText, { color: priorityColor }]}>
                            {task.priority?.toUpperCase()} PRIORITY
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {task.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
                    <Text style={[styles.taskDesc, { color: theme.textSecondary }]}>{task.description}</Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.dueBlock}>
                        <Clock size={12} color={task.status === 'overdue' ? '#EF4444' : theme.textSecondary} />
                        <Text
                          style={[
                            styles.dateText,
                            { color: task.status === 'overdue' ? '#EF4444' : theme.textSecondary },
                          ]}
                        >
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <CheckSquare color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No tasks assigned</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Any work orders, project milestones, or specific HOD tasks assigned to you will show up here.
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
  taskCard: {
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
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
  taskTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15.5,
    marginBottom: 6,
  },
  taskDesc: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
    paddingTop: 10,
  },
  dueBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
});
