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
  ScrollView,
  Alert,
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
  MessageSquare,
  Users,
  User,
  Plus,
  ArrowLeft,
  X,
  Square,
  CheckSquare,
} from 'lucide-react-native';
import { ChatThread, StaffResource, DepartmentResource } from './_types';
import { messageService } from '@/services/messageService';

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { authToken, user } = useAuth();

  // Screen state
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Compose Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'department' | 'group'>('individual');
  const [staffList, setStaffList] = useState<StaffResource[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentResource[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [submittingChat, setSubmittingChat] = useState(false);

  // Form States for Modal
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [groupTopic, setGroupTopic] = useState('');
  const [selectedGroupStaff, setSelectedGroupStaff] = useState<number[]>([]);

  // Theme checking & Spec overrides
  const isDarkMode = theme.background === '#070A13';
  const primaryAccent = isDarkMode ? '#3b82f6' : '#003399'; // Corporate Blue
  const deptAccent = isDarkMode ? '#10b981' : '#059669';    // Emerald Green
  const groupAccent = isDarkMode ? '#a78bfa' : '#7c3aed';   // Purple
  const screenBg = isDarkMode ? '#020617' : '#f6f5f8';       // Off-white bg
  const cardBg = isDarkMode ? '#0f172a' : '#ffffff';         // Card bg

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  // Fetch threads
  const fetchThreads = useCallback(async (showLoader = false) => {
    if (!authToken || !user) {
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    try {
      const result = await messageService.getMessages();
      if (result.success && result.data) {
        setThreads(result.data as ChatThread[]);
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
      const result = await messageService.getResources();
      if (result.success && result.data) {
        setStaffList(result.data.staff || []);
        setDepartmentsList(result.data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching messaging resources:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchThreads(true);
  }, [authToken, fetchThreads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchThreads(false);
  };

  const handleOpenNewChat = () => {
    fetchContacts();
    // Reset Form
    setSelectedStaffId(null);
    setSelectedDeptId(null);
    setGroupTopic('');
    setSelectedGroupStaff([]);
    setContactSearch('');
    setActiveTab('individual');
    setModalVisible(true);
  };

  // Get recipient information depending on the thread type
  const getThreadDetails = (thread: ChatThread) => {
    if (!user) return { name: 'Conversation', avatar: null, type: thread.type };

    if (thread.type === 'individual') {
      const partner = (thread.participants || []).find((p) => p.user_id !== user.id);
      const name = partner
        ? (partner.user?.staff
            ? `${partner.user.staff.first_name} ${partner.user.staff.surname}`
            : (partner.user?.name || 'Unknown Staff'))
        : 'Unknown Staff';
      return {
        name,
        avatar: null, // Fallback if no avatar field
        type: thread.type,
        partnerId: partner?.user_id,
      };
    } else if (thread.type === 'department') {
      const name = thread.department
        ? `${thread.department.name} Department`
        : 'Department Chat';
      return {
        name,
        avatar: null,
        type: thread.type,
      };
    } else {
      const name = thread.topic || 'Group Chat';
      return {
        name,
        avatar: null,
        type: thread.type,
      };
    }
  };

  // Navigate to chat detail
  const navigateToChat = (thread: ChatThread) => {
    const details = getThreadDetails(thread);
    const lastMsg = thread.messages[thread.messages.length - 1];
    
    router.push({
      pathname: '/(app)/workspace/chat',
      params: {
        threadId: thread.id.toString(),
        recipientId: details.partnerId ? details.partnerId.toString() : (thread.department_id?.toString() || '0'),
        recipientName: details.name,
        recipientAvatar: details.avatar || '',
        subject: thread.topic || details.name,
      },
    });
  };

  // Submit new chat creation
  const handleCreateChat = async () => {
    if (!authToken || !user) return;
    
    let payload: any = {
      target_type: activeTab,
    };

    if (activeTab === 'individual') {
      if (!selectedStaffId) {
        Alert.alert('Selection Required', 'Please select a staff member to chat with.');
        return;
      }
      payload.receiver_id = selectedStaffId;
      payload.subject = 'New Message';
    } else if (activeTab === 'department') {
      if (!selectedDeptId) {
        Alert.alert('Selection Required', 'Please select a department.');
        return;
      }
      payload.department_id = selectedDeptId;
      if (groupTopic.trim()) {
        payload.topic = groupTopic.trim();
        payload.subject = `Dept: ${groupTopic.trim()}`;
      } else {
        payload.subject = 'Department Broadcast';
      }
    } else if (activeTab === 'group') {
      if (!groupTopic.trim()) {
        Alert.alert('Input Required', 'Please enter a group name or topic.');
        return;
      }
      if (selectedGroupStaff.length === 0) {
        Alert.alert('Selection Required', 'Please select at least one staff member to add to the group.');
        return;
      }
      payload.topic = groupTopic.trim();
      payload.receiver_ids = selectedGroupStaff;
      payload.subject = groupTopic.trim();
    }

    setSubmittingChat(true);
    try {
      const result = await messageService.createChat(payload);

      if (result.success && result.data) {
        const newThread: ChatThread = result.data.thread;
        setModalVisible(false);
        // Refresh local threads list
        fetchThreads(false);
        
        // Construct navigation params locally based on selection
        let recipientId = '0';
        let recipientName = 'Conversation';
        
        if (activeTab === 'individual') {
          recipientId = selectedStaffId ? selectedStaffId.toString() : '0';
          const selectedStaff = (staffList || []).find((s) => s.user_id === selectedStaffId);
          recipientName = selectedStaff ? `${selectedStaff.first_name} ${selectedStaff.surname}` : 'Staff Member';
        } else if (activeTab === 'department') {
          recipientId = selectedDeptId ? selectedDeptId.toString() : '0';
          const selectedDept = (departmentsList || []).find((d) => d.id === selectedDeptId);
          recipientName = selectedDept ? `${selectedDept.name} Department` : 'Department Chat';
        } else if (activeTab === 'group') {
          recipientId = newThread.id.toString();
          recipientName = groupTopic.trim();
        }

        router.push({
          pathname: '/(app)/workspace/chat',
          params: {
            threadId: newThread.id.toString(),
            recipientId,
            recipientName,
            recipientAvatar: '',
            subject: newThread.topic || recipientName,
          },
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to create chat room.');
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      Alert.alert('Network Error', 'Could not create chat room. Check connection.');
    } finally {
      setSubmittingChat(false);
    }
  };

  const toggleGroupStaffSelection = (uid: number) => {
    setSelectedGroupStaff((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // Filter threads by search query
  const filteredThreads = (threads || []).filter((thread) => {
    const details = getThreadDetails(thread);
    const nameMatch = details.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check inside message bodies
    const bodyMatch = (thread.messages || []).some((msg) =>
      msg.body?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Topic match
    const topicMatch = thread.topic?.toLowerCase().includes(searchQuery.toLowerCase());

    return nameMatch || bodyMatch || topicMatch;
  });

  // Filter contacts by search query
  const filteredStaff = (staffList || []).filter((staff) => {
    const fullName = `${staff.first_name} ${staff.surname}`.toLowerCase();
    return fullName.includes(contactSearch.toLowerCase()) && staff.user_id !== user?.id;
  });

  const filteredDepartments = (departmentsList || []).filter((dept) =>
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

  const renderThreadItem = ({ item }: { item: ChatThread }) => {
    const details = getThreadDetails(item);
    const messagesList = item.messages || [];
    const lastMessage = messagesList[messagesList.length - 1];
    
    const isLatestIncoming = lastMessage ? lastMessage.user_id !== user?.id : false;
    const isRead = lastMessage ? (item.unread_count === 0 || !isLatestIncoming) : true;
    const hasUnread = item.unread_count > 0;

    // Get color theme depending on thread type
    let threadAccent = primaryAccent;
    let ThreadIconComponent = MessageSquare;
    if (item.type === 'department') {
      threadAccent = deptAccent;
      ThreadIconComponent = Users;
    } else if (item.type === 'group') {
      threadAccent = groupAccent;
      ThreadIconComponent = Users;
    }

    return (
      <Pressable
        onPress={() => navigateToChat(item)}
        style={({ pressed }) => [
          styles.chatCard,
          {
            backgroundColor: pressed
              ? theme.backgroundSelected
              : cardBg,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: threadAccent + '15' }]}>
            <ThreadIconComponent color={threadAccent} size={22} />
          </View>
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
              {details.name}
            </Text>
            <Text
              style={[
                styles.chatTime,
                { color: hasUnread ? primaryAccent : theme.textSecondary },
                hasUnread && styles.unreadBoldText,
              ]}
            >
              {lastMessage ? formatTime(lastMessage.created_at) : formatTime(item.created_at)}
            </Text>
          </View>

          <View style={styles.messageRowContainer}>
            <View style={styles.messageStatusAndBody}>
              {lastMessage && !isLatestIncoming && (
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
                {lastMessage
                  ? (lastMessage.body || (lastMessage.attachments?.length ? '📎 Attachment' : 'New interaction'))
                  : 'No messages yet'}
              </Text>
            </View>

            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: primaryAccent }]}>
                <Text style={styles.unreadCountText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDarkMode ? theme.backgroundElement : '#002570'} />
      
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: isDarkMode ? theme.backgroundElement : primaryAccent }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color="#FFFFFF" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#020617' : '#F0F2F5' }]}>
        <View style={[styles.searchBox, { backgroundColor: isDarkMode ? '#0f172a' : '#FFFFFF', borderColor: theme.border }]}>
          <Search color={theme.textSecondary} size={18} style={styles.searchIcon} />
          <TextInput
            placeholder="Search threads or topics..."
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
          <ActivityIndicator size="large" color={primaryAccent} />
        </View>
      ) : filteredThreads.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryAccent]} />
          }
          ListEmptyComponent={
            <View style={styles.centeredEmpty}>
              <MessageSquare size={48} color={theme.textSecondary} style={{ marginBottom: 12, opacity: 0.5 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Conversations</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Tap the floating button below to start messaging staff, departments, or groups.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredThreads}
          renderItem={renderThreadItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryAccent]} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Float button for new chat */}
      <Pressable
        onPress={handleOpenNewChat}
        style={[styles.fab, { backgroundColor: primaryAccent }]}
      >
        <Plus color="#FFFFFF" size={24} />
      </Pressable>

      {/* Segmented Compose Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: screenBg }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: isDarkMode ? theme.backgroundElement : primaryAccent }]}>
            <Pressable onPress={() => setModalVisible(false)} style={styles.modalBackButton}>
              <ArrowLeft color="#FFFFFF" size={24} />
            </Pressable>
            <View>
              <Text style={styles.modalTitle}>Start New Chat</Text>
              <Text style={styles.modalSubtitle}>Create individual, department, or group chats</Text>
            </View>
          </View>

          {/* Segmented Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab('individual')}
              style={[
                styles.tab,
                activeTab === 'individual' && { borderBottomColor: primaryAccent, borderBottomWidth: 3 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'individual' ? primaryAccent : theme.textSecondary },
                  activeTab === 'individual' && styles.activeTabText,
                ]}
              >
                Individual
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('department')}
              style={[
                styles.tab,
                activeTab === 'department' && { borderBottomColor: deptAccent, borderBottomWidth: 3 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'department' ? deptAccent : theme.textSecondary },
                  activeTab === 'department' && styles.activeTabText,
                ]}
              >
                Department
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('group')}
              style={[
                styles.tab,
                activeTab === 'group' && { borderBottomColor: groupAccent, borderBottomWidth: 3 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'group' ? groupAccent : theme.textSecondary },
                  activeTab === 'group' && styles.activeTabText,
                ]}
              >
                Group Chat
              </Text>
            </Pressable>
          </View>

          {/* Search bar inside Modal for filtering list */}
          {(activeTab === 'individual' || activeTab === 'group') && (
            <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#020617' : '#F0F2F5', paddingVertical: 8 }]}>
              <View style={[styles.searchBox, { backgroundColor: isDarkMode ? '#0f172a' : '#FFFFFF', borderColor: theme.border }]}>
                <Search color={theme.textSecondary} size={18} style={styles.searchIcon} />
                <TextInput
                  placeholder="Search staff contacts..."
                  placeholderTextColor={theme.textSecondary}
                  value={contactSearch}
                  onChangeText={setContactSearch}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </View>
            </View>
          )}

          {/* Form Content Scroll view */}
          {loadingContacts ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={primaryAccent} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {activeTab === 'individual' && (
                <FlatList
                  data={filteredStaff}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  renderItem={({ item }) => {
                    const fullName = `${item.first_name} ${item.surname}`;
                    const isSelected = selectedStaffId === item.user_id;
                    return (
                      <Pressable
                        onPress={() => setSelectedStaffId(item.user_id)}
                        style={[
                          styles.contactItem,
                          {
                            borderBottomColor: theme.border,
                            backgroundColor: isSelected ? theme.backgroundSelected : 'transparent',
                          },
                        ]}
                      >
                        <View style={[styles.contactAvatarPlaceholder, { backgroundColor: primaryAccent + '15' }]}>
                          <User color={primaryAccent} size={18} />
                        </View>
                        <Text style={[styles.contactName, { color: theme.text }, isSelected && styles.unreadBoldText]}>
                          {fullName}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              )}

              {activeTab === 'department' && (
                <ScrollView contentContainerStyle={styles.formPadding}>
                  <Text style={[styles.label, { color: theme.text }]}>Select Department</Text>
                  <View style={styles.pickerBoxList}>
                    {departmentsList.map((dept) => {
                      const isSelected = selectedDeptId === dept.id;
                      return (
                        <Pressable
                          key={dept.id}
                          onPress={() => setSelectedDeptId(dept.id)}
                          style={[
                            styles.pickerItem,
                            {
                              borderColor: isSelected ? deptAccent : theme.border,
                              backgroundColor: isSelected ? deptAccent + '10' : cardBg,
                            },
                          ]}
                        >
                          <Users size={16} color={isSelected ? deptAccent : theme.textSecondary} style={{ marginRight: 8 }} />
                          <Text style={[styles.pickerText, { color: theme.text }, isSelected && styles.unreadBoldText]}>
                            {dept.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.label, { color: theme.text, marginTop: 24 }]}>Topic / Subject (Optional)</Text>
                  <TextInput
                    value={groupTopic}
                    onChangeText={setGroupTopic}
                    placeholder="e.g. Invoicing Questions"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: cardBg }]}
                  />
                </ScrollView>
              )}

              {activeTab === 'group' && (
                <View style={{ flex: 1 }}>
                  <View style={[styles.formPadding, { paddingBottom: 8 }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Group Name / Topic *</Text>
                    <TextInput
                      value={groupTopic}
                      onChangeText={setGroupTopic}
                      placeholder="e.g. Generator Team"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: cardBg }]}
                    />
                    <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>Add Members *</Text>
                  </View>

                  <FlatList
                    data={filteredStaff}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => {
                      const fullName = `${item.first_name} ${item.surname}`;
                      const isSelected = selectedGroupStaff.includes(item.user_id);
                      return (
                        <Pressable
                          onPress={() => toggleGroupStaffSelection(item.user_id)}
                          style={[
                            styles.contactItem,
                            {
                              borderBottomColor: theme.border,
                              backgroundColor: isSelected ? theme.backgroundSelected : 'transparent',
                            },
                          ]}
                        >
                          <View style={{ marginRight: 12 }}>
                            {isSelected ? (
                              <CheckSquare size={20} color={groupAccent} />
                            ) : (
                              <Square size={20} color={theme.textSecondary} />
                            )}
                          </View>
                          <View style={[styles.contactAvatarPlaceholder, { backgroundColor: groupAccent + '15' }]}>
                            <User color={groupAccent} size={18} />
                          </View>
                          <Text style={[styles.contactName, { color: theme.text }, isSelected && styles.unreadBoldText]}>
                            {fullName}
                          </Text>
                        </Pressable>
                      );
                    }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Bottom Float Action Bar inside Compose Modal */}
          <View style={[styles.composeFooter, { backgroundColor: cardBg, borderTopColor: theme.border }]}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={[styles.btnSecondary, { borderColor: theme.border }]}
            >
              <Text style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateChat}
              disabled={submittingChat}
              style={[
                styles.btnPrimary,
                { backgroundColor: activeTab === 'individual' ? primaryAccent : activeTab === 'department' ? deptAccent : groupAccent },
              ]}
            >
              {submittingChat ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Create Chat</Text>
              )}
            </Pressable>
          </View>
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
    paddingBottom: 90,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatDetails: {
    flex: 1,
    height: 48,
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
    fontSize: 15.5,
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
    paddingVertical: 100,
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
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
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
  tabContainer: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  activeTabText: {
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
  },
  formPadding: {
    padding: 16,
  },
  label: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    marginBottom: 8,
  },
  pickerBoxList: {
    gap: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
  },
  pickerText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
  },
  inputField: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    marginBottom: 16,
  },
  composeFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btnSecondary: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  btnPrimary: {
    flex: 2,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14.5,
  },
});
