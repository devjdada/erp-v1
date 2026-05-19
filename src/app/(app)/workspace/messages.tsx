import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Image } from 'expo-image';
import {
  Menu,
  Search,
  Check,
  CheckCheck,
  MessageSquarePlus,
  ArrowLeft,
  Users,
  User,
} from 'lucide-react-native';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface ApiMessage {
  id: number;
  thread_id: string | null;
  subject: string;
  body: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  read_at: string | null;
  type: string;
  sender: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  receiver?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
}

interface GroupedThread {
  threadId: string;
  latestMessage: ApiMessage;
  partnerId: number;
  partnerName: string;
  partnerAvatar: string | null;
  unreadCount: number;
  subject: string;
}

interface StaffResource {
  id: number;
  first_name: string;
  surname: string;
  user_id: number;
}

interface DepartmentResource {
  id: number;
  name: string;
}

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { authToken, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<GroupedThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Chat Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [staffList, setStaffList] = useState<StaffResource[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentResource[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // WhatsApp theme colors
  const whatsappGreen = '#128C7E';
  const whatsappAccent = '#25D366';
  const whatsappUnreadBadge = '#25D366';

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  // Fetch conversations/messages
  const fetchConversations = useCallback(async (showLoader = false) => {
    if (!authToken || !user) {
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const apiMessages: ApiMessage[] = result.data;
          
          // Group messages by thread_id, fallback to sorting sender and receiver IDs
          const threadsMap: { [key: string]: GroupedThread } = {};
          
          // API returns messages sorted desc by created_at.
          // Iterating in order means the first message we see for a thread key is the latest one.
          apiMessages.forEach((msg) => {
            const rawThreadKey = msg.thread_id;
            const fallbackKey = [msg.sender_id, msg.receiver_id].sort((a, b) => a - b).join('-');
            const threadKey = rawThreadKey || `legacy-${fallbackKey}`;

            const isIncoming = msg.receiver_id === user.id;
            const isUnread = isIncoming && !msg.read_at;

            // Determine recipient details
            let partnerId = 0;
            let partnerName = 'Internal Broadcast';
            let partnerAvatar: string | null = null;

            if (msg.sender_id === user.id) {
              partnerId = msg.receiver_id;
              partnerName = msg.receiver?.name || 'Internal Recipient';
              partnerAvatar = msg.receiver?.avatar || null;
            } else {
              partnerId = msg.sender_id;
              partnerName = msg.sender.name;
              partnerAvatar = msg.sender.avatar || null;
            }

            if (!threadsMap[threadKey]) {
              threadsMap[threadKey] = {
                threadId: threadKey,
                latestMessage: msg,
                partnerId,
                partnerName,
                partnerAvatar,
                unreadCount: isUnread ? 1 : 0,
                subject: msg.subject,
              };
            } else {
              if (isUnread) {
                threadsMap[threadKey].unreadCount += 1;
              }
            }
          });

          // Sort threads by latest message created_at desc
          const sortedThreads = Object.values(threadsMap).sort((a, b) => {
            return (
              new Date(b.latestMessage.created_at).getTime() -
              new Date(a.latestMessage.created_at).getTime()
            );
          });

          setThreads(sortedThreads);
        }
      }
    } catch (error) {
      console.error('Error fetching messaging threads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken, user]);

  // Fetch contacts (staff and departments)
  const fetchContacts = async () => {
    if (!authToken) return;
    setLoadingContacts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/resources`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStaffList(result.data.staff || []);
          setDepartmentsList(result.data.departments || []);
        }
      }
    } catch (error) {
      console.error('Error fetching messaging resources:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
  }, [authToken, fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(false);
  };

  const handleOpenNewChat = () => {
    fetchContacts();
    setModalVisible(true);
  };

  // Navigate to chat detail
  const navigateToChat = (thread: GroupedThread) => {
    // If it's a legacy thread, we strip the prefix
    const activeThreadId = thread.threadId.startsWith('legacy-') ? 'null' : thread.threadId;
    
    router.push({
      pathname: '/(app)/workspace/chat',
      params: {
        threadId: activeThreadId,
        recipientId: thread.partnerId.toString(),
        recipientName: thread.partnerName,
        recipientAvatar: thread.partnerAvatar || '',
        subject: thread.subject,
      },
    });
  };

  // Navigate to new chat with a contact
  const handleStartChatWithContact = (contact: StaffResource) => {
    setModalVisible(false);
    setContactSearch('');

    // Check if we already have a thread with this contact
    const existingThread = threads.find((t) => t.partnerId === contact.user_id);
    const fullName = `${contact.first_name} ${contact.surname}`;

    if (existingThread) {
      navigateToChat(existingThread);
    } else {
      router.push({
        pathname: '/(app)/workspace/chat',
        params: {
          threadId: 'null',
          recipientId: contact.user_id.toString(),
          recipientName: fullName,
          recipientAvatar: '',
          subject: 'New Conversation',
        },
      });
    }
  };

  // Navigate to new department chat
  const handleStartChatWithDepartment = (dept: DepartmentResource) => {
    setModalVisible(false);
    setContactSearch('');
    // For departments, we can compose a message. Since department is a group target_type,
    // we'll pass parameter details
    router.push({
      pathname: '/(app)/workspace/chat',
      params: {
        threadId: 'null',
        recipientId: dept.id.toString(), // will be treated as department_id
        recipientName: dept.name,
        recipientAvatar: '',
        subject: `Dept: ${dept.name}`,
      },
    });
  };

  // Filter threads by search query
  const filteredThreads = threads.filter((thread) => {
    const nameMatch = thread.partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    const msgMatch = thread.latestMessage.body.toLowerCase().includes(searchQuery.toLowerCase());
    const subjectMatch = thread.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || msgMatch || subjectMatch;
  });

  // Filter contacts by search query
  const filteredStaff = staffList.filter((staff) => {
    const fullName = `${staff.first_name} ${staff.surname}`.toLowerCase();
    return fullName.includes(contactSearch.toLowerCase()) && staff.user_id !== user?.id;
  });

  const filteredDepartments = departmentsList.filter((dept) =>
    dept.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const isDarkMode = theme.background === '#070A13';

  const renderThreadItem = ({ item }: { item: GroupedThread }) => {
    const isLatestIncoming = item.latestMessage.receiver_id === user?.id;
    const isRead = item.latestMessage.read_at !== null;
    const hasUnread = item.unreadCount > 0;

    return (
      <Pressable
        onPress={() => navigateToChat(item)}
        style={({ pressed }) => [
          styles.chatCard,
          {
            backgroundColor: pressed
              ? theme.backgroundSelected
              : theme.backgroundElement,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.avatarWrapper}>
          {item.partnerAvatar ? (
            <Image source={item.partnerAvatar} style={styles.avatar} transition={200} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
              <Text style={[styles.avatarLetter, { color: isDarkMode ? '#FFFFFF' : '#475569' }]}>
                {item.partnerName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text
              style={[
                styles.chatName,
                { color: theme.text },
                hasUnread && styles.unreadBoldText,
              ]}
              numberOfLines={1}
            >
              {item.partnerName}
            </Text>
            <Text
              style={[
                styles.chatTime,
                { color: hasUnread ? whatsappUnreadBadge : theme.textSecondary },
                hasUnread && styles.unreadBoldText,
              ]}
            >
              {formatTime(item.latestMessage.created_at)}
            </Text>
          </View>

          <View style={styles.messageRowContainer}>
            <View style={styles.messageStatusAndBody}>
              {!isLatestIncoming && (
                <View style={styles.tickIcon}>
                  {isRead ? (
                    <CheckCheck size={16} color="#34B7F1" />
                  ) : (
                    <Check size={16} color={isDarkMode ? '#94A3B8' : '#8A91A5'} />
                  )}
                </View>
              )}
              <Text
                style={[
                  styles.chatMessage,
                  { color: hasUnread ? theme.text : theme.textSecondary },
                  hasUnread && styles.unreadMessageText,
                ]}
                numberOfLines={1}
              >
                {item.latestMessage.body}
              </Text>
            </View>

            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: whatsappUnreadBadge }]}>
                <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDarkMode ? theme.backgroundElement : whatsappGreen} />
      
      {/* WhatsApp Green Top Header */}
      <View style={[styles.headerBar, { backgroundColor: isDarkMode ? theme.backgroundElement : whatsappGreen }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color="#FFFFFF" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? theme.background : '#F0F2F5' }]}>
        <View style={[styles.searchBox, { backgroundColor: isDarkMode ? theme.backgroundElement : '#FFFFFF', borderColor: theme.border }]}>
          <Search color={theme.textSecondary} size={18} style={styles.searchIcon} />
          <TextInput
            placeholder="Search or start new chat"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
      </View>

      {/* Threads List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={isDarkMode ? theme.primary : whatsappGreen} />
        </View>
      ) : filteredThreads.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[whatsappGreen]} />
          }
          ListEmptyComponent={
            <View style={styles.centeredEmpty}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Conversations</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Tap the floating button below to start messaging staff.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredThreads}
          renderItem={renderThreadItem}
          keyExtractor={(item) => item.threadId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[whatsappGreen]} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* WhatsApp Green FAB for New Chat */}
      <Pressable
        onPress={handleOpenNewChat}
        style={[styles.fab, { backgroundColor: isDarkMode ? theme.primary : whatsappAccent }]}
      >
        <MessageSquarePlus color="#FFFFFF" size={22} />
      </Pressable>

      {/* Contact Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: isDarkMode ? theme.backgroundElement : whatsappGreen }]}>
            <Pressable onPress={() => setModalVisible(false)} style={styles.modalBackButton}>
              <ArrowLeft color="#FFFFFF" size={24} />
            </Pressable>
            <View>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <Text style={styles.modalSubtitle}>
                {staffList.length ? `${staffList.length - 1} contacts available` : 'Loading...'}
              </Text>
            </View>
          </View>

          {/* Modal Search */}
          <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? theme.background : '#F0F2F5' }]}>
            <View style={[styles.searchBox, { backgroundColor: isDarkMode ? theme.backgroundElement : '#FFFFFF', borderColor: theme.border }]}>
              <Search color={theme.textSecondary} size={18} style={styles.searchIcon} />
              <TextInput
                placeholder="Search staff or departments..."
                placeholderTextColor={theme.textSecondary}
                value={contactSearch}
                onChangeText={setContactSearch}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>
          </View>

          {loadingContacts ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={isDarkMode ? theme.primary : whatsappGreen} />
            </View>
          ) : (
            <FlatList
              data={[
                { type: 'header', title: 'Departments' },
                ...filteredDepartments.map((d) => ({ type: 'department', data: d })),
                { type: 'header', title: 'Staff Contacts' },
                ...filteredStaff.map((s) => ({ type: 'staff', data: s })),
              ]}
              keyExtractor={(item, index) => `${item.type}-${index}`}
              renderItem={({ item }: { item: any }) => {
                if (item.type === 'header') {
                  return (
                    <View style={[styles.sectionHeader, { backgroundColor: isDarkMode ? '#1E293B' : '#F0F2F5' }]}>
                      <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>
                        {item.title}
                      </Text>
                    </View>
                  );
                }

                if (item.type === 'department') {
                  const dept = item.data as DepartmentResource;
                  return (
                    <Pressable
                      onPress={() => handleStartChatWithDepartment(dept)}
                      style={[styles.contactItem, { borderBottomColor: theme.border }]}
                    >
                      <View style={[styles.contactAvatarPlaceholder, { backgroundColor: '#10B981' }]}>
                        <Users color="#FFFFFF" size={20} />
                      </View>
                      <Text style={[styles.contactName, { color: theme.text }]}>
                        {dept.name}
                      </Text>
                    </Pressable>
                  );
                }

                const staff = item.data as StaffResource;
                const name = `${staff.first_name} ${staff.surname}`;
                return (
                  <Pressable
                    onPress={() => handleStartChatWithContact(staff)}
                    style={[styles.contactItem, { borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.contactAvatarPlaceholder, { backgroundColor: isDarkMode ? '#334155' : '#CBD5E1' }]}>
                      <User color={isDarkMode ? '#94A3B8' : '#475569'} size={20} />
                    </View>
                    <Text style={[styles.contactName, { color: theme.text }]}>
                      {name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
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
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  headerButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 40,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
    padding: 0,
  },
  listContent: {
    paddingBottom: 80,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  chatDetails: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    maxWidth: '70%',
  },
  chatTime: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
  },
  unreadBoldText: {
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  messageRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageStatusAndBody: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tickIcon: {
    marginRight: 4,
  },
  chatMessage: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    flex: 1,
  },
  unreadMessageText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10.5,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  centeredEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 120,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  modalBackButton: {
    padding: 8,
    marginRight: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  modalSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    marginTop: 1,
  },
  sectionHeader: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  sectionHeaderText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15.5,
  },
});
