import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu, Calendar, Clock, Plus, CheckCircle2, AlertCircle } from 'lucide-react-native';

export default function LeaveScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [requests, setRequests] = useState([
    { id: 1, type: 'Annual Leave', duration: '3 days (May 24-26)', status: 'Approved', date: 'Yesterday' },
    { id: 2, type: 'Sick Leave', duration: '1 day (May 12)', status: 'Approved', date: '1 wk ago' },
    { id: 3, type: 'Casual Leave', duration: '2 days (Jun 12-13)', status: 'Pending', date: '2d ago' },
  ]);

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const handleRequestLeave = () => {
    Alert.alert(
      'New Leave Request',
      'Would you like to submit a new leave request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit Request', 
          onPress: () => {
            const newReq = {
              id: requests.length + 1,
              type: 'Annual Leave',
              duration: '5 days (Jul 05-09)',
              status: 'Pending',
              date: 'Just now'
            };
            setRequests([newReq, ...requests]);
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Leave Management</Text>
        <Pressable onPress={handleRequestLeave} style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Plus color="#FFFFFF" size={18} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Balances Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Leave Balances</Text>
        <View style={styles.balanceContainer}>
          <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(30, 111, 253, 0.1)' }]}>
              <Calendar color={theme.primary} size={20} />
            </View>
            <Text style={[styles.balanceValue, { color: theme.text }]}>12</Text>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Annual Left</Text>
          </View>

          <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <CheckCircle2 color="#10B981" size={20} />
            </View>
            <Text style={[styles.balanceValue, { color: theme.text }]}>4</Text>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Sick Left</Text>
          </View>

          <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Clock color="#F59E0B" size={20} />
            </View>
            <Text style={[styles.balanceValue, { color: theme.text }]}>2</Text>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Pending</Text>
          </View>
        </View>

        {/* Requests Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Requests</Text>
        <View style={styles.listContainer}>
          {requests.map((req) => {
            const isApproved = req.status === 'Approved';
            const statusColor = isApproved ? '#10B981' : '#F59E0B';
            const statusBg = isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';

            return (
              <View key={req.id} style={[styles.requestRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.requestMain}>
                  <Text style={[styles.requestType, { color: theme.text }]}>{req.type}</Text>
                  <Text style={[styles.requestDuration, { color: theme.textSecondary }]}>{req.duration}</Text>
                  <Text style={[styles.requestDate, { color: theme.textSecondary }]}>{req.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: `${statusColor}30` }]}>
                  {isApproved ? (
                    <CheckCircle2 size={12} color={statusColor} style={styles.badgeIcon} />
                  ) : (
                    <AlertCircle size={12} color={statusColor} style={styles.badgeIcon} />
                  )}
                  <Text style={[styles.statusText, { color: statusColor }]}>{req.status}</Text>
                </View>
              </View>
            );
          })}
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  headerButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  balanceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    marginBottom: 2,
  },
  balanceLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  requestMain: {
    flex: 1,
    gap: 4,
  },
  requestType: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  requestDuration: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
  },
  requestDate: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 4,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
  },
});
