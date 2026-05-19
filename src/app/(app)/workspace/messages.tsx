import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Pressable, TextInput } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu, Search } from 'lucide-react-native';
import { Image } from 'expo-image';

export default function MessagesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const chatThreads = [
    {
      id: 1,
      name: 'Operations Dispatch',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80',
      message: 'New cargo dispatch coordinates have been updated for WO-2026-089.',
      time: '11:15 PM',
      unread: 1,
      isGroup: true,
    },
    {
      id: 2,
      name: 'Isokariari (Admin)',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=80&h=80&q=80',
      message: 'Alex, make sure you clock out after completing your vehicle safety logs.',
      time: '9:24 PM',
      unread: 0,
      isGroup: false,
    },
    {
      id: 3,
      name: 'Maintenance Support',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=80&h=80&q=80',
      message: 'The replacement brake pads for Fleet Truck 04 are ready at bay 3.',
      time: '5:41 PM',
      unread: 0,
      isGroup: false,
    },
    {
      id: 4,
      name: 'Safety Committee',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&h=80&q=80',
      message: 'Please review the updated summer operations checklist PDF.',
      time: 'May 18',
      unread: 0,
      isGroup: true,
    },
  ];

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const filteredThreads = chatThreads.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
        <View style={{ width: 40 }} /> {/* balance layout */}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Search color={theme.textSecondary} size={18} style={styles.searchIcon} />
          <TextInput
            placeholder="Search conversations..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
      </View>

      {/* Message List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {filteredThreads.map((chat) => {
            const hasUnread = chat.unread > 0;
            return (
              <Pressable key={chat.id} style={[styles.chatCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.avatarWrapper}>
                  <Image source={chat.avatar} style={styles.avatar} transition={200} />
                  {hasUnread && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                  )}
                </View>

                <View style={styles.chatDetails}>
                  <View style={styles.chatHeader}>
                    <Text style={[styles.chatName, { color: theme.text }, hasUnread && styles.unreadText]}>
                      {chat.name}
                    </Text>
                    <Text style={[styles.chatTime, { color: theme.textSecondary }]}>{chat.time}</Text>
                  </View>
                  <Text 
                    numberOfLines={2} 
                    style={[
                      styles.chatMessage, 
                      { color: hasUnread ? theme.text : theme.textSecondary },
                      hasUnread && styles.unreadMessageText
                    ]}
                  >
                    {chat.message}
                  </Text>
                </View>
              </Pressable>
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
  },
  headerButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    padding: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 12,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#070A13', // Matches element background
  },
  chatDetails: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
  },
  unreadText: {
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  chatTime: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
  },
  chatMessage: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  unreadMessageText: {
    fontFamily: 'PlusJakartaSans_500Medium',
  },
});
