import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { Image } from 'expo-image';
import { ArrowLeft, Send, Paperclip, Smile, Check, CheckCheck, MessageSquare } from 'lucide-react-native';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface Message {
  id: number;
  subject: string;
  body: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  read_at: string | null;
  type: string;
  thread_id?: string | null;
  sender: {
    id: number;
    name: string;
  };
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { authToken, user } = useAuth();
  
  const threadIdParam = params.threadId as string;
  const recipientIdParam = params.recipientId as string;
  const recipientName = (params.recipientName as string) || 'Conversation';
  const recipientAvatar = params.recipientAvatar as string;
  const initialSubject = (params.subject as string) || 'Internal Message';

  const [threadId, setThreadId] = useState<string | null>(
    threadIdParam && threadIdParam !== 'null' ? threadIdParam : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // WhatsApp theme colors
  const whatsappGreen = '#128C7E';
  const whatsappAccent = '#25D366';
  const whatsappBubbleRightLight = '#DCF8C6';
  const whatsappBubbleRightDark = '#056162';
  const whatsappBubbleLeftLight = '#FFFFFF';
  const whatsappBubbleLeftDark = '#1F2C34';
  const whatsappWallpaperLight = '#E5DDD5';
  const whatsappWallpaperDark = '#0B141A';

  // Fetch messages from thread
  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: number) => {
    if (!authToken) return;
    try {
      await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
    } catch (error) {
      console.error(`Error marking message ${messageId} as read:`, error);
    }
  }, [authToken]);

  // Fetch messages from thread
  const fetchMessages = useCallback(async (showLoader = false) => {
    if (!authToken || !threadId) {
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/thread/${threadId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const fetchedMsgs: Message[] = result.data;
          setMessages(fetchedMsgs);
          
          // Mark unread messages as read
          const unreadMsgs = fetchedMsgs.filter(
            (msg) => msg.sender_id !== user?.id && !msg.read_at
          );
          if (unreadMsgs.length > 0) {
            unreadMsgs.forEach((msg) => markMessageAsRead(msg.id));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chat thread:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [authToken, threadId, user?.id, markMessageAsRead]);

  // Polling for new messages
  useEffect(() => {
    fetchMessages(true);
    
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 8000); // Poll every 8 seconds

    return () => clearInterval(interval);
  }, [threadId, authToken, fetchMessages]);

  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !authToken) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Calculate receiver ID. If not direct param, find it from active messages
    let receiverId = recipientIdParam ? parseInt(recipientIdParam, 10) : null;
    if (!receiverId && messages.length > 0) {
      // Find the first message that is not sent by us to get the other participant's ID
      const otherMsg = messages.find((m) => m.sender_id !== user?.id);
      if (otherMsg) {
        receiverId = otherMsg.sender_id;
      } else {
        // If all messages sent by us, get receiver_id from first message
        receiverId = messages[0].receiver_id;
      }
    }

    if (!receiverId) {
      console.error('No receiver ID available');
      setSending(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          target_type: 'individual',
          receiver_id: receiverId,
          subject: initialSubject,
          body: messageText,
          type: 'message',
          thread_id: threadId || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const newMsg: Message = result.data;
          
          // Update thread ID if it was generated by the backend
          if (!threadId && newMsg.thread_id) {
            setThreadId(newMsg.thread_id);
          }

          // Add to local state immediately
          setMessages((prev) => [...prev, newMsg]);
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isDarkMode = theme.background === '#070A13';
  const wallpaperColor = isDarkMode ? whatsappWallpaperDark : whatsappWallpaperLight;

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    const bubbleBg = isMe
      ? (isDarkMode ? whatsappBubbleRightDark : whatsappBubbleRightLight)
      : (isDarkMode ? whatsappBubbleLeftDark : whatsappBubbleLeftLight);
    
    const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
    const textSecondaryColor = isDarkMode ? '#A5B4FC' : '#64748B';

    return (
      <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, { backgroundColor: bubbleBg }]}>
          <Text style={[styles.messageText, { color: textColor }]}>
            {item.body}
          </Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.timeText, { color: textSecondaryColor }]}>
              {formatMessageTime(item.created_at)}
            </Text>
            {isMe && (
              <View style={styles.statusContainer}>
                {item.read_at ? (
                  <CheckCheck size={14} color="#34B7F1" />
                ) : (
                  <Check size={14} color={isDarkMode ? '#94A3B8' : '#8A91A5'} />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? theme.backgroundElement : whatsappGreen }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </Pressable>

        <View style={styles.profileWrapper}>
          {recipientAvatar ? (
            <Image source={recipientAvatar} style={styles.avatar} transition={200} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#1E293B' : '#075E54' }]}>
              <Text style={styles.avatarLetter}>
                {recipientName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {recipientName}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {initialSubject}
            </Text>
          </View>
        </View>
      </View>

      {/* Message List Area */}
      <View style={[styles.chatArea, { backgroundColor: wallpaperColor }]}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={isDarkMode ? theme.primary : whatsappGreen} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <View style={[styles.emptyBox, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
              <MessageSquare size={32} color={isDarkMode ? '#94A3B8' : '#64748B'} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyText, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
                No messages yet
              </Text>
              <Text style={[styles.emptySubtext, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                Send a message to start the conversation.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
      </View>

      {/* Input Panel */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#0F1524' : '#F0F0F0' }]}
      >
        <View style={styles.inputWrapper}>
          <View style={[styles.inputFieldBox, { backgroundColor: isDarkMode ? '#1F2C34' : '#FFFFFF' }]}>
            <Pressable style={styles.iconButton}>
              <Smile color={isDarkMode ? '#8596A0' : '#8A91A5'} size={22} />
            </Pressable>
            
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={isDarkMode ? '#8596A0' : '#8A91A5'}
              style={[styles.input, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}
              multiline
            />

            <Pressable style={styles.iconButton}>
              <Paperclip color={isDarkMode ? '#8596A0' : '#8A91A5'} size={20} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            style={[
              styles.sendButton,
              { backgroundColor: isDarkMode ? whatsappAccent : whatsappGreen },
              !inputText.trim() && { opacity: 0.8 },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send color="#FFFFFF" size={18} style={{ marginLeft: 2 }} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  profileWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    marginTop: 1,
  },
  chatArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 280,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 8,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
  },
  messageText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
    lineHeight: 19.5,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    padding: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFieldBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 6,
    maxHeight: 100,
  },
  iconButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
});
