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
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Link as LinkIcon,
  Check,
  CheckCheck,
  MessageSquare,
  FileText,
  FileSpreadsheet,
  Download,
  Image as ImageIcon,
  X,
  FileCode,
} from 'lucide-react-native';
import { ChatMessage, ChatThread, ChatAttachment, EntityLink } from './types';
import { messageService } from '@/services/messageService';

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
  
  // Local States
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Modals & Forms state
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  // Selected attachment/link states
  const [selectedAttachments, setSelectedAttachments] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<EntityLink[]>([]);
  
  // New link form states
  const [linkType, setLinkType] = useState<EntityLink['type']>('Task');
  const [linkLabel, setLinkLabel] = useState('');

  const flatListRef = useRef<FlatList>(null);
  
  // Custom Spec Theme Settings
  const isDarkMode = theme.background === '#070A13';
  const primaryAccent = isDarkMode ? '#3b82f6' : '#003399'; // Corporate Blue
  const deptAccent = isDarkMode ? '#10b981' : '#059669';    // Emerald Green
  const groupAccent = isDarkMode ? '#a78bfa' : '#7c3aed';   // Purple

  const whatsappBubbleRightLight = '#DCF8C6';
  const whatsappBubbleRightDark = '#005c4b';
  const whatsappBubbleLeftLight = '#FFFFFF';
  const whatsappBubbleLeftDark = '#1e293b';
  const whatsappWallpaperLight = '#efeae2';
  const whatsappWallpaperDark = '#020617';

  const wallpaperColor = isDarkMode ? whatsappWallpaperDark : whatsappWallpaperLight;

  // Mark whole thread as read
  const markThreadAsRead = useCallback(async () => {
    if (!authToken || !threadId) return;
    try {
      await messageService.markThreadRead(threadId);
    } catch (error) {
      console.error(`Error marking thread ${threadId} as read:`, error);
    }
  }, [authToken, threadId]);

  // Fetch messages from thread
  const fetchMessages = useCallback(async (showLoader = false) => {
    if (!authToken || !threadId) {
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    try {
      const result = await messageService.getThread(threadId);

      if (result.success && result.data) {
        setThread(result.data.thread);
        const fetchedMsgs: ChatMessage[] = result.data.messages || [];
        setMessages(fetchedMsgs);
        
        // Mark thread as read if there are unread messages
        if (result.data.thread?.unread_count > 0) {
          markThreadAsRead();
        }
      }
    } catch (error) {
      console.error('Error fetching chat thread:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [authToken, threadId, markThreadAsRead]);

  // Sync state threadId when parameter changes from navigation
  useEffect(() => {
    const tid = threadIdParam && threadIdParam !== 'null' ? threadIdParam : null;
    setThreadId(tid);
    
    // Reset state when switching chats
    setMessages([]);
    setThread(null);
    setSelectedAttachments([]);
    setSelectedLinks([]);
    setInputText('');
  }, [threadIdParam]);

  // Polling for new messages
  useEffect(() => {
    fetchMessages(true);
    
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 8000); // Poll every 8 seconds

    return () => clearInterval(interval);
  }, [threadId, authToken, fetchMessages]);

  // Send message using Multipart FormData
  const handleSendMessage = async () => {
    const hasAttachments = selectedAttachments.length > 0;
    const hasLinks = selectedLinks.length > 0;
    const hasText = inputText.trim().length > 0;

    if (!hasText && !hasAttachments && !hasLinks) return;
    if (!authToken || !user) return;

    setSending(true);
    const messageText = inputText.trim();

    // Determine receiver ID or routing parameters
    let receiverId = recipientIdParam ? parseInt(recipientIdParam, 10) : null;
    if (!receiverId && messages.length > 0) {
      const otherMsg = messages.find((m) => m.user_id !== user.id);
      if (otherMsg) receiverId = otherMsg.user_id;
    }

    try {
      const formData = new FormData();
      
      if (threadId) {
        formData.append('thread_id', threadId);
      } else {
        // Start a new thread if it doesn't exist
        formData.append('target_type', 'individual');
        formData.append('receiver_id', receiverId ? receiverId.toString() : '0');
        formData.append('subject', initialSubject);
      }

      if (hasText) {
        formData.append('body', messageText);
      }

      // Attachments appending
      selectedAttachments.forEach((file, index) => {
        const fileObj: any = {
          uri: file.uri,
          name: file.name,
          type: file.type,
        };
        formData.append(`attachments[${index}]`, fileObj);
      });

      // Links metadata appending
      selectedLinks.forEach((link, idx) => {
        formData.append(`metadata[links][${idx}][type]`, link.type);
        formData.append(`metadata[links][${idx}][label]`, link.label);
      });

      const result = await messageService.sendMessage(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (result.success && result.data) {
          const newMsg: ChatMessage = result.data.message;
          
          if (!threadId && result.data.thread?.id) {
            setThreadId(result.data.thread.id.toString());
            setThread(result.data.thread);
          }

          // Clear inputs
          setInputText('');
          setSelectedAttachments([]);
          setSelectedLinks([]);

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg]);
          } else {
            // Fetch latest messages if only the thread was created
            fetchMessages(false);
          }

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
      } else {
        Alert.alert('Send Error', result.message || 'Failed to send message.');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errResult = error.response?.data;
      Alert.alert('Error', errResult?.message || 'Could not send message. Check network.');
    } finally {
      setSending(false);
    }
  };

  const simulateAddAttachment = (type: 'image' | 'pdf' | 'xlsx' | 'txt') => {
    setAttachmentModalVisible(false);
    let mockFile = { uri: '', name: '', type: '' };

    if (type === 'image') {
      mockFile = {
        uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', // mock small jpeg base64
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };
    } else if (type === 'pdf') {
      mockFile = {
        uri: 'data:application/pdf;base64,JVBERi0xLjQK...',
        name: `spec_sheet_${Date.now().toString().slice(-4)}.pdf`,
        type: 'application/pdf',
      };
    } else if (type === 'xlsx') {
      mockFile = {
        uri: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,...',
        name: `maintenance_schedule.xlsx`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } else if (type === 'txt') {
      mockFile = {
        uri: 'data:text/plain;base64,U3lzdGVtIExvZ3M=',
        name: `system_logs.txt`,
        type: 'text/plain',
      };
    }

    setSelectedAttachments((prev) => [...prev, mockFile]);
  };

  const handleAddLink = () => {
    if (!linkLabel.trim()) {
      Alert.alert('Input Required', 'Please enter a name for the entity.');
      return;
    }
    const newLink: EntityLink = {
      type: linkType,
      label: linkLabel.trim(),
    };
    setSelectedLinks((prev) => [...prev, newLink]);
    setLinkLabel('');
    setLinkModalVisible(false);
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeLink = (index: number) => {
    setSelectedLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDownload = (attach: ChatAttachment) => {
    const fullUrl = `https://oki.wchapel.com${attach.url}`;
    Alert.alert(
      'Download Attachment',
      `Download "${attach.name}"?\nUrl: ${fullUrl}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Link', 
          onPress: () => {
            Alert.alert('Download Started', 'The attachment has been opened in your browser.');
          } 
        }
      ]
    );
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isMessageRead = (msg: ChatMessage) => {
    if (!thread) return false;
    const otherParticipants = (thread.participants || []).filter((p) => p.user_id !== user?.id);
    if (otherParticipants.length === 0) return false;
    
    return otherParticipants.every((p) => {
      if (!p.read_at) return false;
      return new Date(p.read_at).getTime() >= new Date(msg.created_at).getTime();
    });
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.user_id === user?.id;
    const bubbleBg = isMe
      ? (isDarkMode ? whatsappBubbleRightDark : whatsappBubbleRightLight)
      : (isDarkMode ? whatsappBubbleLeftDark : whatsappBubbleLeftLight);
    
    const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
    const textSecondaryColor = isMe 
      ? (isDarkMode ? '#93c5fd' : '#1e3a8a') // outgoing low opacity label
      : (isDarkMode ? '#94a3b8' : '#64748b');

    // Accent for sender name
    let senderNameColor = primaryAccent;
    if (thread?.type === 'department') {
      senderNameColor = deptAccent;
    } else if (thread?.type === 'group') {
      senderNameColor = groupAccent;
    }

    const showSenderName = !isMe && (thread?.type === 'group' || thread?.type === 'department');

    return (
      <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, { backgroundColor: bubbleBg }]}>
          {/* Sender Name in group/department */}
          {showSenderName && (
            <Text style={[styles.senderNameText, { color: senderNameColor }]}>
              {item.sender?.staff
                ? `${item.sender.staff.first_name} ${item.sender.staff.surname}`
                : (item.sender?.name || 'System / External')}
            </Text>
          )}

          {/* Text Body */}
          {item.body && (
            <Text style={[styles.messageText, { color: textColor }]}>
              {item.body}
            </Text>
          )}

          {/* Attachments rendering */}
          {item.attachments && item.attachments.map((attach, idx) => {
            const isImage = attach.mime.startsWith('image/') || attach.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
            
            if (isImage) {
              const fullUrl = `https://oki.wchapel.com${attach.url}`;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setExpandedImage(fullUrl)}
                  style={styles.imageAttachmentBox}
                >
                  <Image
                    source={fullUrl}
                    style={styles.imageAttachment}
                    contentFit="cover"
                    transition={200}
                  />
                </Pressable>
              );
            }

            // Document Card rendering
            let ExtensionIcon = FileText;
            if (attach.name.toLowerCase().endsWith('.xlsx') || attach.name.toLowerCase().endsWith('.xls')) {
              ExtensionIcon = FileSpreadsheet;
            } else if (attach.name.toLowerCase().match(/\.(js|ts|tsx|json|html|css|php)$/)) {
              ExtensionIcon = FileCode;
            }

            return (
              <View
                key={idx}
                style={[
                  styles.documentCard,
                  {
                    backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <View style={styles.docInfoRow}>
                  <View style={[styles.docIconWrapper, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                    <ExtensionIcon color={primaryAccent} size={20} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.docNameText, { color: textColor }]} numberOfLines={1}>
                      {attach.name}
                    </Text>
                    <Text style={[styles.docSubtitleText, { color: textSecondaryColor }]}>
                      Document File
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDownload(attach)}
                    style={[styles.downloadBtn, { backgroundColor: primaryAccent }]}
                  >
                    <Download color="#FFFFFF" size={14} />
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* Entity links metadata tags */}
          {item.metadata?.links && item.metadata.links.map((link, idx) => (
            <View
              key={idx}
              style={[
                styles.entityLinkBadge,
                {
                  backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 51, 153, 0.08)',
                  borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 51, 153, 0.15)',
                },
              ]}
            >
              <LinkIcon size={12} color={primaryAccent} style={{ marginRight: 4 }} />
              <Text style={[styles.entityLinkText, { color: primaryAccent }]}>
                [{link.type}] {link.label}
              </Text>
            </View>
          ))}

          {/* Footer timestamp */}
          <View style={styles.bubbleFooter}>
            <Text style={[styles.timeText, { color: textSecondaryColor }]}>
              {formatMessageTime(item.created_at)}
            </Text>
            {isMe && (
              <View style={styles.statusContainer}>
                {isMessageRead(item) ? (
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
      <View style={[styles.header, { backgroundColor: isDarkMode ? theme.backgroundElement : primaryAccent }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </Pressable>

        <View style={styles.profileWrapper}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: (thread?.type === 'department' ? deptAccent : thread?.type === 'group' ? groupAccent : primaryAccent) + '20' }]}>
            <Text style={[styles.avatarLetter, { color: '#FFFFFF' }]}>
              {recipientName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {recipientName}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {thread?.type ? `${thread.type.toUpperCase()} chat` : initialSubject}
            </Text>
          </View>
        </View>
      </View>

      {/* Message Feed Wallpaper Area */}
      <View style={[styles.chatArea, { backgroundColor: wallpaperColor }]}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primaryAccent} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <View style={[styles.emptyBox, { backgroundColor: isDarkMode ? '#0f172a' : '#FFFFFF', borderColor: theme.border }]}>
              <MessageSquare size={32} color={theme.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No messages yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Send a message, link a task or attach a file to start the team sync.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
      </View>

      {/* Linked entities and Attachments Preview Row */}
      {(selectedAttachments.length > 0 || selectedLinks.length > 0) && (
        <View style={[styles.previewsRow, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderTopColor: theme.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {selectedAttachments.map((file, idx) => (
              <View key={`file-${idx}`} style={[styles.previewPill, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}>
                <Paperclip size={12} color={theme.text} style={{ marginRight: 4 }} />
                <Text style={[styles.previewText, { color: theme.text }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Pressable onPress={() => removeAttachment(idx)} style={styles.pillCloseBtn}>
                  <X size={12} color={theme.textSecondary} />
                </Pressable>
              </View>
            ))}

            {selectedLinks.map((link, idx) => (
              <View key={`link-${idx}`} style={[styles.previewPill, { backgroundColor: primaryAccent + '15', borderColor: primaryAccent + '30', borderWidth: 1 }]}>
                <LinkIcon size={12} color={primaryAccent} style={{ marginRight: 4 }} />
                <Text style={[styles.previewText, { color: primaryAccent }]} numberOfLines={1}>
                  [{link.type}] {link.label}
                </Text>
                <Pressable onPress={() => removeLink(idx)} style={styles.pillCloseBtn}>
                  <X size={12} color={primaryAccent} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input panel container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#FFFFFF', borderTopColor: theme.border }]}
      >
        <View style={styles.inputWrapper}>
          <View style={[styles.inputFieldBox, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
            
            <Pressable onPress={() => setLinkModalVisible(true)} style={styles.iconButton}>
              <LinkIcon color={primaryAccent} size={20} />
            </Pressable>
            
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              multiline
            />

            <Pressable onPress={() => setAttachmentModalVisible(true)} style={styles.iconButton}>
              <Paperclip color={theme.textSecondary} size={20} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleSendMessage}
            disabled={(!inputText.trim() && selectedAttachments.length === 0 && selectedLinks.length === 0) || sending}
            style={[
              styles.sendButton,
              { backgroundColor: primaryAccent },
              (!inputText.trim() && selectedAttachments.length === 0 && selectedLinks.length === 0) && { opacity: 0.6 },
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

      {/* Simulated Attachment Picker Modal */}
      <Modal
        visible={attachmentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAttachmentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.bottomModalSheet, { backgroundColor: isDarkMode ? '#0f172a' : '#FFFFFF' }]}>
            <View style={[styles.bottomSheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.bottomSheetTitle, { color: theme.text }]}>Add Attachment</Text>
              <Pressable onPress={() => setAttachmentModalVisible(false)}>
                <X size={20} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.bottomSheetOptions}>
              <Pressable onPress={() => simulateAddAttachment('image')} style={styles.optionRow}>
                <View style={[styles.optionIcon, { backgroundColor: '#3b82f620' }]}>
                  <ImageIcon size={20} color="#3b82f6" />
                </View>
                <Text style={[styles.optionLabel, { color: theme.text }]}>Image / Camera Roll</Text>
              </Pressable>

              <Pressable onPress={() => simulateAddAttachment('pdf')} style={styles.optionRow}>
                <View style={[styles.optionIcon, { backgroundColor: '#ef444420' }]}>
                  <FileText size={20} color="#ef4444" />
                </View>
                <Text style={[styles.optionLabel, { color: theme.text }]}>PDF Document</Text>
              </Pressable>

              <Pressable onPress={() => simulateAddAttachment('xlsx')} style={styles.optionRow}>
                <View style={[styles.optionIcon, { backgroundColor: '#10b98120' }]}>
                  <FileSpreadsheet size={20} color="#10b981" />
                </View>
                <Text style={[styles.optionLabel, { color: theme.text }]}>Spreadsheet (Excel)</Text>
              </Pressable>

              <Pressable onPress={() => simulateAddAttachment('txt')} style={styles.optionRow}>
                <View style={[styles.optionIcon, { backgroundColor: '#6b728020' }]}>
                  <FileCode size={20} color="#6b7280" />
                </View>
                <Text style={[styles.optionLabel, { color: theme.text }]}>Text Logs (.txt)</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Link Entity Modal */}
      <Modal
        visible={linkModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLinkModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.bottomModalSheet, { backgroundColor: isDarkMode ? '#0f172a' : '#FFFFFF' }]}>
            <View style={[styles.bottomSheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.bottomSheetTitle, { color: theme.text }]}>Link Entity Reference</Text>
              <Pressable onPress={() => setLinkModalVisible(false)}>
                <X size={20} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalFormContent}>
              <Text style={[styles.label, { color: theme.text }]}>Reference Type</Text>
              <View style={styles.pillSelectionList}>
                {['Task', 'Asset', 'Equipment', 'Procurement'].map((t) => {
                  const isSel = linkType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setLinkType(t as any)}
                      style={[
                        styles.formPill,
                        {
                          backgroundColor: isSel ? primaryAccent : (isDarkMode ? '#1e293b' : '#f1f5f9'),
                          borderColor: isSel ? primaryAccent : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.formPillText, { color: isSel ? '#FFFFFF' : theme.textSecondary }]}>
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Label / Title *</Text>
              <TextInput
                value={linkLabel}
                onChangeText={setLinkLabel}
                placeholder="e.g. Repair Generator Gen-02"
                placeholderTextColor={theme.textSecondary}
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
              />

              <Pressable onPress={handleAddLink} style={[styles.submitLinkBtn, { backgroundColor: primaryAccent }]}>
                <Text style={styles.submitLinkBtnText}>Add Entity Link</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Expanded Image Viewer Modal */}
      <Modal visible={expandedImage !== null} transparent={true} animationType="fade">
        <View style={styles.imageViewerBackdrop}>
          <Pressable onPress={() => setExpandedImage(null)} style={styles.viewerCloseButton}>
            <X size={24} color="#FFFFFF" />
          </Pressable>
          {expandedImage && (
            <Image
              source={expandedImage}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
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
    borderWidth: 1,
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
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 10,
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
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
  },
  senderNameText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 3,
  },
  messageText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
    lineHeight: 20,
  },
  imageAttachmentBox: {
    marginTop: 6,
    borderRadius: 8,
    overflow: 'hidden',
    width: 220,
    height: 150,
  },
  imageAttachment: {
    width: '100%',
    height: '100%',
  },
  documentCard: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    width: 230,
  },
  docInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  docNameText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
  },
  docSubtitleText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    marginTop: 1,
  },
  downloadBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entityLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  entityLinkText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11.5,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewsRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    maxWidth: 200,
  },
  previewText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
  },
  pillCloseBtn: {
    marginLeft: 6,
    padding: 2,
  },
  inputContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    maxHeight: 120,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomModalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bottomSheetTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
  bottomSheetOptions: {
    padding: 16,
    gap: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14.5,
  },
  modalFormContent: {
    padding: 16,
  },
  label: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    marginBottom: 8,
  },
  pillSelectionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  formPillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12.5,
  },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    marginBottom: 20,
  },
  submitLinkBtn: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitLinkBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  imageViewerBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
});
