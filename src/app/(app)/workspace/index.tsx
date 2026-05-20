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
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  User,
  Ticket,
  Users,
  Calendar,
  ClipboardEdit,
  FileText,
  Coins,
  ShieldCheck,
  Compass,
  ShoppingBag,
  Wrench,
  MessageSquare,
  CheckSquare,
  Play,
  Square,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface DashboardStats {
  attendance: {
    present: number;
    late: number;
  };
  unread_messages: number;
  today_attendance: {
    id: number;
    status: string;
    clock_in_time: string;
    clock_out_time: string | null;
  } | null;
}

export default function WorkspaceDashboard() {
  const theme = useTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const { authToken, user, refreshProfile } = useAuth();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftSeconds, setShiftSeconds] = useState(0);
  const [clockActionLoading, setClockActionLoading] = useState(false);

  // Digital clock ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch stats from API
  const fetchDashboardStats = useCallback(async (showLoader = false) => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/staff/dashboard`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchDashboardStats(true);
  }, [fetchDashboardStats]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    fetchDashboardStats(false);
  };

  const isClockedIn = !!(stats?.today_attendance && !stats.today_attendance.clock_out_time);

  // Calculate shift duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isClockedIn && stats?.today_attendance?.clock_in_time) {
      const clockInDate = new Date(stats.today_attendance.clock_in_time);
      const updateSeconds = () => {
        const diffMs = new Date().getTime() - clockInDate.getTime();
        setShiftSeconds(Math.max(0, Math.floor(diffMs / 1000)));
      };
      updateSeconds();
      timer = setInterval(updateSeconds, 1000);
    } else {
      setShiftSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isClockedIn, stats?.today_attendance]);

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  // Clock In/Out API Call
  const handleClockInOut = async () => {
    if (!authToken) return;
    setClockActionLoading(true);
    const endpoint = isClockedIn ? 'clock-out' : 'clock-in';
    
    // Default mock coordinates (Lagos)
    const latitude = 6.5244;
    const longitude = 3.3792;

    try {
      const response = await fetch(`${API_BASE_URL}/attendance/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        Alert.alert('Success', result.message || `Successfully clocked ${isClockedIn ? 'out' : 'in'}.`);
        fetchDashboardStats(false);
      } else {
        Alert.alert('Error', result.message || `Failed to clock ${isClockedIn ? 'out' : 'in'}.`);
      }
    } catch (error) {
      console.error(`Error during clock-${isClockedIn ? 'out' : 'in'}:`, error);
      Alert.alert('Error', 'A network error occurred. Please try again.');
    } finally {
      setClockActionLoading(false);
    }
  };

  // Time and Date formatting
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const timeParts = formattedTime.split(' ');
  const timeStr = timeParts[0];
  const ampmStr = timeParts[1] || '';

  const getFormattedDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    
    let suffix = 'th';
    if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st';
    else if (dayNum === 2 || dayNum === 22) suffix = 'nd';
    else if (dayNum === 3 || dayNum === 23) suffix = 'rd';
    
    return `${dayName}, ${monthName} ${dayNum}${suffix}`;
  };

  const formatShiftDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Applications Grid configuration
  const tools = [
    { name: 'Profile', icon: User, route: '/(app)/workspace/profile', color: '#3B82F6', desc: 'View details' },
    { name: 'Leave', icon: Calendar, route: '/(app)/workspace/leave', color: '#10B981', desc: 'Request leave' },
    { name: 'Documents', icon: FileText, route: '/(app)/workspace/documents', color: '#8B5CF6', desc: 'Forms & Policies' },
    { name: 'Messages', icon: MessageSquare, route: '/(app)/workspace/messages', color: '#128C7E', desc: 'Staff Chat' },
    { name: 'Tickets', icon: Ticket, route: '/(app)/workspace/tickets', color: '#EC4899', desc: 'Helpdesk' },
    { name: 'Tasks', icon: CheckSquare, route: '/(app)/workspace/tasks', color: '#F59E0B', desc: 'Assigned jobs' },
    { name: 'Corrections', icon: ClipboardEdit, route: '/(app)/workspace/corrections', color: '#EF4444', desc: 'Attendance fix' },
    { name: 'Visitors', icon: Users, route: '/(app)/workspace/visitors', color: '#06B6D4', desc: 'Visitor logs' },
    { name: 'Loans', icon: Coins, route: '/(app)/workspace/loans', color: '#FBBF24', desc: 'Salary advances' },
    { name: 'Permissions', icon: ShieldCheck, route: '/(app)/workspace/permissions', color: '#14B8A6', desc: 'Security access' },
    { name: 'Movements', icon: Compass, route: '/(app)/workspace/movements', color: '#6366F1', desc: 'Logs' },
    { name: 'Requisitions', icon: ShoppingBag, route: '/(app)/workspace/requisitions', color: '#84CC16', desc: 'PRs & RFQs' },
    { name: 'Tools Request', icon: Wrench, route: '/(app)/workspace/tools', color: '#64748B', desc: 'Inventory' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>OKI Mobile Portal</Text>
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
          {/* Welcome Banner */}
          <View style={[styles.welcomeBanner, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.welcomeInfo}>
              <Text style={[styles.welcomeText, { color: theme.text }]}>
                Welcome, <Text style={{ color: theme.primary, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{user?.staff?.first_name || user?.name?.split(' ')[0] || 'User'}</Text>
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                {user?.staff?.designation || user?.role || 'Staff Member'}
              </Text>
            </View>
            <View style={[styles.sparkleBadge, { backgroundColor: `${theme.primary}12` }]}>
              <Sparkles color={theme.primary} size={18} />
            </View>
          </View>

          {/* Quick Stats Columns */}
          <View style={styles.metricsRow}>
            {/* PRESENT */}
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>MONTHLY PRESENT</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {stats?.attendance?.present ?? 0}
              </Text>
            </View>

            {/* LATE */}
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.metricLabel, { color: '#F59E0B' }]}>MONTHLY LATE</Text>
              <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
                {stats?.attendance?.late ?? 0}
              </Text>
            </View>

            {/* UNREAD MESSAGES */}
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.metricLabel, { color: theme.primary }]}>UNREAD CHATS</Text>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {stats?.unread_messages ?? 0}
              </Text>
            </View>
          </View>

          {/* Clock In/Out card */}
          <View style={[styles.timeClockCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.clockHeader}>
              <View style={styles.clockHeaderLeft}>
                <Clock color={theme.primary} size={16} />
                <Text style={[styles.clockTitle, { color: theme.text }]}>TIME CLOCK</Text>
              </View>
              <Text style={[styles.clockDate, { color: theme.textSecondary }]}>
                {getFormattedDate(currentTime)}
              </Text>
            </View>

            <View style={styles.clockDisplayContainer}>
              <Text style={[styles.clockTimeText, { color: theme.text }]}>{timeStr}</Text>
              <Text style={[styles.clockAmpmText, { color: theme.textSecondary }]}>{ampmStr}</Text>
            </View>

            {isClockedIn && (
              <View style={styles.activeShiftRow}>
                <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.activeShiftText, { color: '#10B981' }]}>
                  Shift Active: {formatShiftDuration(shiftSeconds)}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleClockInOut}
              disabled={clockActionLoading}
              style={({ pressed }) => [
                styles.clockButton,
                { backgroundColor: isClockedIn ? '#EF4444' : theme.primary },
                pressed && { opacity: 0.85 }
              ]}
            >
              {clockActionLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : isClockedIn ? (
                <>
                  <Square color="#FFFFFF" size={14} fill="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.clockButtonText}>CLOCK OUT NOW</Text>
                </>
              ) : (
                <>
                  <Play color="#FFFFFF" size={14} fill="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.clockButtonText}>CLOCK IN NOW</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Applications Grid Section */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Workspace Applications</Text>
          
          <View style={styles.gridContainer}>
            {tools.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <Pressable
                  key={idx}
                  onPress={() => router.push(tool.route as any)}
                  style={({ pressed }) => [
                    styles.gridCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && { backgroundColor: theme.backgroundSelected }
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${tool.color}15` }]}>
                    <ToolIcon color={tool.color} size={22} />
                  </View>
                  <Text style={[styles.gridCardTitle, { color: theme.text }]} numberOfLines={1}>
                    {tool.name}
                  </Text>
                  <Text style={[styles.gridCardDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                    {tool.desc}
                  </Text>
                  <ChevronRight size={14} color={theme.border} style={styles.chevron} />
                </Pressable>
              );
            })}
          </View>
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
  headerButton: {
    padding: 8,
    marginRight: -8,
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
    padding: 16,
    paddingBottom: 40,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
  sparkleBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20,
  },
  timeClockCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  clockDate: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
  },
  clockDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  clockTimeText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 44,
    lineHeight: 48,
  },
  clockAmpmText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    marginLeft: 4,
  },
  activeShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeShiftText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },
  clockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
  },
  clockButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    marginBottom: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    position: 'relative',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridCardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13.5,
    marginBottom: 2,
  },
  gridCardDesc: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10.5,
  },
  chevron: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
});
