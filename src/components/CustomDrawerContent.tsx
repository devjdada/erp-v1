import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/context/ThemeContext';
import { Mail, Phone, LogOut, Shield } from 'lucide-react-native';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { theme, isDark } = useThemeContext();
  const router = useRouter();

  const handleLogout = () => {
    // Navigate back to the login screen
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar Container with Status indicator */}
          <View style={styles.avatarContainer}>
            <Image
              source="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
              style={[styles.avatar, { borderColor: theme.primary }]}
              transition={200}
            />
            {/* Online Status Indicator */}
            <View style={[styles.onlineBadge, { backgroundColor: theme.primary, borderColor: theme.backgroundElement }]} />
          </View>

          {/* User Name & Role */}
          <View style={styles.identityContainer}>
            <Text style={[styles.userName, { color: theme.text }]}>O.K.I Isokariari</Text>
            
            {/* Custom Role Badge */}
            <View style={[styles.roleBadge, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }]}>
              <Shield size={11} color={theme.primary} style={styles.badgeIcon} />
              <Text style={[styles.roleText, { color: theme.primary }]}>System Admin</Text>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.contactDetails}>
            <View style={styles.contactRow}>
              <Mail size={14} color={theme.textSecondary} />
              <Text style={[styles.contactText, { color: theme.textSecondary }]}>
                oki.isokariari@oki-app.com
              </Text>
            </View>
            <View style={styles.contactRow}>
              <Phone size={14} color={theme.textSecondary} />
              <Text style={[styles.contactText, { color: theme.textSecondary }]}>
                +1 (555) 234-5678
              </Text>
            </View>
          </View>
        </View>

        {/* Subtle Horizontal Divider */}
        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        {/* Navigator Drawer Menu List */}
        <View style={styles.linksContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Logout Action Area (Anchored to Drawer Bottom) */}
      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)' }
          ]}
        >
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  avatarContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    marginBottom: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  identityContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 4,
  },
  roleText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  contactDetails: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  linksContainer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  logoutText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#EF4444',
  },
});
