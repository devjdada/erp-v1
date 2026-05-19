import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu, User, Mail, Phone, Shield, Settings, HelpCircle, LogOut } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of OKI APP?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          } 
        }
      ]
    );
  };

  const getDisplayName = () => {
    if (user?.staff) {
      const { first_name, middle_name, surname } = user.staff;
      const parts = [first_name, middle_name, surname].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(' ');
      }
    }
    return user?.name || 'Guest User';
  };

  const displayName = getDisplayName();
  const designation = user?.staff?.designation || user?.role || 'Staff Member';
  const email = user?.email || 'No email';
  const phone = user?.staff?.phone || 'No phone number';
  const employeeId = user?.staff?.id ? `EMP-STAFF-${user.staff.id}` : (user?.id ? `EMP-USER-${user.id}` : 'N/A');

  const getAvatarSource = () => {
    const photo = user?.staff?.profile_photo;
    if (photo) {
      if (photo.startsWith('http://') || photo.startsWith('https://')) {
        return photo;
      }
      return `https://oki.wchapel.com/storage/${photo}`;
    }
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80";
  };

  const avatarSource = getAvatarSource();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Image
            source={avatarSource}
            style={[styles.avatar, { borderColor: theme.primary }]}
            transition={200}
          />
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: 'rgba(30, 111, 253, 0.1)', borderColor: 'rgba(30, 111, 253, 0.2)' }]}>
            <Shield size={12} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.roleText, { color: theme.primary }]} numberOfLines={1}>
              {designation}
            </Text>
          </View>
        </View>

        {/* User Info Details */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Details</Text>
        <View style={[styles.detailsContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.detailRow}>
            <Mail size={18} color={theme.textSecondary} />
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.detailRow}>
            <Phone size={18} color={theme.textSecondary} />
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>PHONE NUMBER</Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {phone}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.detailRow}>
            <User size={18} color={theme.textSecondary} />
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>EMPLOYEE ID</Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {employeeId}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Settings Links */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
        <View style={[styles.detailsContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Pressable 
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.backgroundSelected }]}
          >
            <View style={styles.menuLeft}>
              <Settings size={18} color={theme.textSecondary} />
              <Text style={[styles.menuText, { color: theme.text }]}>App Settings</Text>
            </View>
            <HelpCircle size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Log Out Button */}
        <Pressable 
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton, 
            { borderColor: '#EF4444' },
            pressed && { backgroundColor: 'rgba(239, 68, 68, 0.08)' }
          ]}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out Account</Text>
        </Pressable>
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
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    marginBottom: 16,
  },
  userName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  detailsContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  detailTextContainer: {
    gap: 2,
  },
  detailLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#EF4444',
  },
});
