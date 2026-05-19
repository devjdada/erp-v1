import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu, Users, CheckCircle, Clock, MessageSquare, Play, Square } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function WorkspaceDashboard() {
  const theme = useTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();

  // Time & Date State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock-in State
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [shiftSeconds, setShiftSeconds] = useState(0);

  // Digital clock ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Shift duration counter ticking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isClockedIn) {
      timer = setInterval(() => {
        setShiftSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setShiftSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isClockedIn]);

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const handleClockInOut = () => {
    setIsClockedIn(prev => !prev);
  };

  // Time formatting
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  // Split the time and AM/PM
  const timeParts = formattedTime.split(' ');
  const timeStr = timeParts[0];
  const ampmStr = timeParts[1] || '';

  // Custom date formatting (e.g. Tuesday, May 19th)
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

  // Shift duration formatting (MM:SS or HH:MM:SS)
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>OKI APP</Text>
        <View style={{ width: 40 }} /> {/* Layout balance */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Logo and Identity Toggle Row */}
        <View style={styles.identityRow}>
          {/* Stylized custom overlapping O.K. logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoLetterO}>O</Text>
            <Text style={styles.logoLetterK}>K</Text>
          </View>

          <Pressable 
            onPress={() => router.push('/(app)/workspace/profile')}
            style={[styles.profileToggleBtn, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
          >
            <Users color={theme.primary} size={20} />
          </Pressable>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            Welcome, <Text style={{ color: theme.primary }}>{user?.staff?.first_name || user?.name?.split(' ')[0] || 'User'}</Text>
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
            {user?.staff?.designation || user?.role || 'Staff Member'}{user?.staff?.surname ? ` • ${user.staff.surname}` : ''}
          </Text>
        </View>

        {/* Three Columns Metrics Row */}
        <View style={styles.metricsRow}>
          {/* Card 1: PRESENT */}
          <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <CheckCircle color="#10B981" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PRESENT</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {isClockedIn ? '1' : '0'}
            </Text>
          </View>

          {/* Card 2: LATE */}
          <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Clock color="#F59E0B" size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>LATE</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>0</Text>
          </View>

          {/* Card 3: MESSAGES */}
          <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(30, 111, 253, 0.12)' }]}>
              <MessageSquare color={theme.primary} size={16} />
            </View>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>MESSAGES</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>0</Text>
          </View>
        </View>

        {/* Time Clock Card */}
        <View style={[styles.timeClockCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {/* Clock Header */}
          <View style={styles.clockHeader}>
            <View style={styles.clockHeaderLeft}>
              <Clock color={theme.primary} size={16} />
              <Text style={[styles.clockTitle, { color: theme.text }]}>TIME CLOCK</Text>
            </View>
            <Text style={[styles.clockDate, { color: theme.textSecondary }]}>
              {getFormattedDate(currentTime)}
            </Text>
          </View>

          {/* Large Clock Display */}
          <View style={styles.clockDisplayContainer}>
            <Text style={[styles.clockTimeText, { color: theme.text }]}>{timeStr}</Text>
            <Text style={[styles.clockAmpmText, { color: theme.textSecondary }]}>{ampmStr}</Text>
          </View>

          {/* Active Shift status if clocked in */}
          {isClockedIn && (
            <View style={styles.activeShiftRow}>
              <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.activeShiftText, { color: '#10B981' }]}>
                Shift Active: {formatShiftDuration(shiftSeconds)}
              </Text>
            </View>
          )}

          {/* Clock In/Out Action Button */}
          <Pressable 
            onPress={handleClockInOut}
            style={[
              styles.clockButton, 
              { backgroundColor: isClockedIn ? '#EF4444' : theme.primary }
            ]}
          >
            {isClockedIn ? (
              <>
                <Square color="#FFFFFF" size={16} fill="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.clockButtonText}>CLOCK OUT NOW</Text>
              </>
            ) : (
              <>
                <Play color="#FFFFFF" size={16} fill="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.clockButtonText}>CLOCK IN NOW</Text>
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 38,
    width: 60,
  },
  logoLetterO: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 34,
    color: '#1E6FFD',
    position: 'absolute',
    left: 0,
    top: -6,
  },
  logoLetterK: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 26,
    color: '#EF4444',
    position: 'absolute',
    left: 18,
    bottom: -6,
  },
  profileToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  welcomeSection: {
    marginBottom: 28,
  },
  welcomeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 30,
    lineHeight: 38,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  metricLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 26,
    lineHeight: 30,
  },
  timeClockCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  clockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clockTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
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
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 54,
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
    gap: 8,
    marginBottom: 16,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeShiftText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
  clockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  clockButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
