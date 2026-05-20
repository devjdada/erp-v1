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
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import * as Location from 'expo-location';
import { workspaceService } from '@/services/workspaceService';
import { attendanceService } from '@/services/attendanceService';
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
  Fingerprint,
  Check,
} from 'lucide-react-native';


const getFriendlyErrorMessage = (message: string, action: 'in' | 'out') => {
  if (!message) return `Failed to clock ${action}.`;
  
  if (message.includes('No active attendance locations are defined')) {
    return 'No active attendance locations are configured on the server. Please contact HR or your system administrator to define the office geofence.';
  }
  if (message.includes('outside the allowed radius')) {
    return 'You are outside the allowed radius to mark attendance. Please make sure you are physically present at the office or worksite and try again.';
  }
  if (message.includes('restricted location') && message.includes('not assigned to')) {
    return 'You are at a restricted location that has not been assigned to you. Please contact your supervisor to assign you to this work site.';
  }
  if (message.includes('must be at the same location')) {
    return 'You must be at the same office location where you clocked in to clock out.';
  }
  if (message.includes('Location access is required')) {
    return 'GPS location access is required. Please ensure location services are enabled on your device.';
  }
  if (message.includes('No active clock-in found')) {
    return 'No active clock-in found for today. You must clock in before you can clock out.';
  }
  if (message.includes('Staff profile not found')) {
    return 'Your staff profile was not found on the system. Please verify your login credentials or contact IT support.';
  }

  return message;
};

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
  const { showAlert } = useAlert();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftSeconds, setShiftSeconds] = useState(0);
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);

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
      const result = await workspaceService.getDashboard();
      if (result.success && result.data) {
        setStats(result.data);
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
    setAttendanceError(null);
    setAttendanceSuccess(null);
    const endpoint = isClockedIn ? 'clock-out' : 'clock-in';

    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      // 1. Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Permission to access your location is required to verify your workspace proximity for attendance. Please enable location permissions for OKI App in your device settings.';
        setAttendanceError(msg);
        showAlert({ title: 'Location Permission Required', message: msg, type: 'warning' });
        setClockActionLoading(false);
        return;
      }

      // 2. Retrieve current GPS position
      let location = null;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (locError) {
        console.warn('getCurrentPositionAsync failed, attempting last known location:', locError);
        location = await Location.getLastKnownPositionAsync({});
      }

      if (!location || !location.coords) {
        const msg = 'Unable to retrieve your current location. Please verify that GPS/Location services are enabled on your device and that you have a clear signal.';
        setAttendanceError(msg);
        showAlert({ title: 'GPS Signal Error', message: msg, type: 'error' });
        setClockActionLoading(false);
        return;
      }

      latitude = location.coords.latitude;
      longitude = location.coords.longitude;

    } catch (gpsError: any) {
      console.error('GPS/Location error:', gpsError);
      const msg = `An error occurred while retrieving your location: ${gpsError?.message || 'Unknown GPS error'}. Please ensure location services are enabled and try again.`;
      setAttendanceError(msg);
      showAlert({ title: 'GPS Error', message: msg, type: 'error' });
      setClockActionLoading(false);
      return;
    }

    try {
      const result = await attendanceService.clockInOut(endpoint, latitude, longitude);

      if (result?.success) {
        const successMsg = result.message || `Successfully clocked ${isClockedIn ? 'out' : 'in'}.`;
        setAttendanceSuccess(successMsg);
        showAlert({ title: 'Success', message: successMsg, type: 'success' });
        fetchDashboardStats(false);
      } else {
        const serverMessage = result?.message || `Failed to clock ${isClockedIn ? 'out' : 'in'}.`;
        const friendlyMessage = getFriendlyErrorMessage(serverMessage, isClockedIn ? 'out' : 'in');
        setAttendanceError(friendlyMessage);
        showAlert({ title: 'Attendance Error', message: friendlyMessage, type: 'error' });
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        const msg = 'Your login session has expired or is invalid. Please sign out and log back in to mark your attendance.';
        setAttendanceError(msg);
        showAlert({ title: 'Session Expired', message: msg, type: 'warning' });
        setClockActionLoading(false);
        return;
      }
      
      console.error(`Error during clock-${isClockedIn ? 'out' : 'in'}:`, error);
      
      const responseData = error.response?.data;
      if (responseData && !responseData.success) {
        const serverMessage = responseData.message || `Failed to clock ${isClockedIn ? 'out' : 'in'}.`;
        const friendlyMessage = getFriendlyErrorMessage(serverMessage, isClockedIn ? 'out' : 'in');
        setAttendanceError(friendlyMessage);
        showAlert({ title: 'Attendance Error', message: friendlyMessage, type: 'error' });
      } else {
        const networkMsg = 'Could not connect to the attendance server. Please check your internet connection and try again.';
        setAttendanceError(networkMsg);
        showAlert({ title: 'Network Error', message: networkMsg, type: 'error' });
      }
    } finally {
      setClockActionLoading(false);
    }
  };

  // Time and Date formatting
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const ampmStr = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  const timeStr = `${displayHours}:${displayMinutes}`;

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

  const designation = user?.staff?.designation || user?.role || 'admin';
  const lastName = user?.staff?.surname || user?.name?.split(' ').slice(1).join(' ') || 'Isokariari';

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
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>OKI APP</Text>
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
          <View style={[styles.welcomeSection, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.welcomeHeaderRow}>
              {/* Custom OK Logo */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Fingerprint color="#3B82F6" size={14} />
                </View>
                <Text style={styles.logoKText}>K</Text>
              </View>

              {/* Header User Icon Button */}
              <Pressable style={[styles.headerUserButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
                <Users color="#94A3B8" size={18} />
              </Pressable>
            </View>

            <Text style={styles.welcomeText}>
              Welcome, <Text style={styles.welcomeNameText}>{user?.staff?.first_name || user?.name?.split(' ')[0] || 'O.K.I'}</Text>
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
              {designation} • {lastName}
            </Text>
          </View>

          {/* Quick Stats Columns */}
          <View style={styles.metricsRow}>
            {/* PRESENT */}
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Check color="#10B981" size={16} strokeWidth={3} />
              </View>
              <Text style={styles.metricLabel}>PRESENT</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {stats?.attendance?.present ?? 0}
              </Text>
            </View>

            {/* LATE */}
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Clock color="#F59E0B" size={16} strokeWidth={3} />
              </View>
              <Text style={styles.metricLabel}>LATE</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {stats?.attendance?.late ?? 0}
              </Text>
            </View>

            {/* MESSAGES */}
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <MessageSquare color="#3B82F6" size={16} strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>MESSAGES</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>
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

            {attendanceError && (
              <View style={[styles.inlineErrorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <View style={styles.errorIconTitleRow}>
                  <Text style={styles.inlineErrorTitle}>ATTENDANCE ERROR</Text>
                  <Pressable onPress={() => setAttendanceError(null)} style={styles.closeErrorButton}>
                    <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 12 }}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.inlineErrorText}>{attendanceError}</Text>
              </View>
            )}

            {attendanceSuccess && (
              <View style={[styles.inlineSuccessContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <View style={styles.errorIconTitleRow}>
                  <Text style={styles.inlineSuccessTitle}>SUCCESS</Text>
                  <Pressable onPress={() => setAttendanceSuccess(null)} style={styles.closeErrorButton}>
                    <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12 }}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.inlineSuccessText}>{attendanceSuccess}</Text>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    height: 56,
  },
  headerButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginBottom: 20,
  },
  welcomeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: 60,
    height: 36,
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logoKText: {
    fontSize: 30,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#EF4444',
    position: 'absolute',
    left: 20,
    top: -4,
  },
  headerUserButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 36,
  },
  welcomeNameText: {
    color: '#3B82F6',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  welcomeSubtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#94A3B8',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 32,
  },
  timeClockCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginHorizontal: 16,
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  clockTimeText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 56,
    lineHeight: 60,
  },
  clockAmpmText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    marginLeft: 6,
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
    height: 48,
    borderRadius: 16,
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
    marginHorizontal: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
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
  inlineErrorContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorIconTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inlineErrorTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  inlineErrorText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 16,
  },
  inlineSuccessContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  inlineSuccessTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#10B981',
    letterSpacing: 0.5,
  },
  inlineSuccessText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#10B981',
    lineHeight: 16,
  },
  closeErrorButton: {
    padding: 4,
  },
});
