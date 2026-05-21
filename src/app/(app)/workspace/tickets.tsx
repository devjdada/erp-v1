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
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Ticket, AlertTriangle, CheckCircle, Clock, X, MessageSquare, Plus, ChevronDown, Send } from 'lucide-react-native';
import { ticketService, CreateTicketPayload } from '@/services/ticketService';

interface StaffTicket {
  id: number;
  staff_id: number;
  department_id: number;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | string;
  status: string;
  created_at: string;
  department?: {
    id: number;
    name: string;
  };
  conversations?: Array<{
    id: number;
    sender: { name: string };
    message: string;
    created_at: string;
  }>;
}

// Mock departments for the creation form since we don't have a departments API endpoint listed
const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Human Resources' },
  { id: 2, name: 'IT Support' },
  { id: 3, name: 'Facilities' },
  { id: 4, name: 'Finance' },
];

export default function TicketsScreen() {
  const theme = useTheme();
  const router = useRouter();

  // State
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<StaffTicket | null>(null);
  
  // Modals
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Message State
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchTickets = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const result = await ticketService.getTickets();
      if (result.success && result.data) {
        setTickets(result.data);
      }
    } catch (error) {
      console.error('Error fetching staff tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(true);
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets(false);
  };

  const handleViewDetails = async (ticket: StaffTicket) => {
    setSelectedTicket(ticket);
    setDetailModalVisible(true);
    
    // Attempt to fetch full details to get conversations if any
    try {
      const result = await ticketService.getTicket(ticket.id);
      if (result.success && result.data) {
        setSelectedTicket(result.data);
      }
    } catch (e) {
      console.error('Error fetching ticket details:', e);
    }
  };

  const submitTicket = async () => {
    if (!subject.trim() || !description.trim() || !departmentId) {
      Alert.alert('Error', 'Please fill in all required fields (Subject, Description, Department).');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateTicketPayload = {
        subject: subject.trim(),
        description: description.trim(),
        department_id: departmentId,
        category: category.trim() || undefined,
        priority,
      };

      const result = await ticketService.createTicket(payload);
      if (result.success) {
        Alert.alert('Success', 'Ticket raised successfully.');
        setCreateModalVisible(false);
        resetForm();
        fetchTickets(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to create ticket.');
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const result = await ticketService.addMessage(selectedTicket.id, newMessage.trim());
      if (result.success) {
        setNewMessage('');
        // Refresh ticket details
        const refreshResult = await ticketService.getTicket(selectedTicket.id);
        if (refreshResult.success && refreshResult.data) {
          setSelectedTicket(refreshResult.data);
        }
      }
    } catch (e) {
      console.error('Error sending message:', e);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setCategory('');
    setPriority('medium');
    setDepartmentId(null);
    setShowDeptDropdown(false);
  };

  const getPriorityColor = (p: string) => {
    const val = p?.toLowerCase();
    if (val === 'high') return '#EF4444';
    if (val === 'medium') return '#F59E0B';
    return '#10B981';
  };

  const getStatusColor = (s: string) => {
    const val = s?.toLowerCase();
    if (val === 'closed' || val === 'resolved') return '#10B981';
    if (val === 'in-progress' || val === 'open') return '#0891B2'; // Using the primary design color
    return '#F59E0B';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Staff Tickets</Text>
        <Pressable
          onPress={() => { resetForm(); setCreateModalVisible(true); }}
          style={[styles.addButton, { backgroundColor: '#0891B2' }]} // Primary cyan from UI Pro Max
        >
          <Plus color="#FFFFFF" size={18} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0891B2" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0891B2']} />
          }
        >
          {tickets.length > 0 ? (
            <View style={styles.listContainer}>
              {tickets.map((ticket) => (
                <Pressable
                  key={ticket.id}
                  onPress={() => handleViewDetails(ticket)}
                  style={({ pressed }) => [
                    styles.ticketCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.priorityTag, { backgroundColor: `${getPriorityColor(ticket.priority)}15` }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
                          {ticket.priority?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.status)}15` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                        {ticket.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.ticketTitle, { color: theme.text }]} numberOfLines={2}>
                    {ticket.subject}
                  </Text>
                  
                  <Text style={[styles.ticketDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {ticket.description}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.categoryText, { color: '#0891B2' }]}>
                      {ticket.department?.name || 'Department'} • {ticket.category || 'General'}
                    </Text>
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ticket color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No tickets found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                You haven't created any support tickets yet.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Ticket Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Support Ticket</Text>
              <Pressable onPress={() => setCreateModalVisible(false)} style={{ padding: 4 }}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              
              {/* Department */}
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Department *</Text>
              <Pressable
                onPress={() => setShowDeptDropdown(!showDeptDropdown)}
                style={[styles.inputContainer, { borderColor: showDeptDropdown ? '#0891B2' : theme.border, backgroundColor: theme.background }]}
              >
                <Text style={{ color: departmentId ? theme.text : theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium' }}>
                  {departmentId ? MOCK_DEPARTMENTS.find(d => d.id === departmentId)?.name : 'Select Department'}
                </Text>
                <ChevronDown color={theme.textSecondary} size={18} />
              </Pressable>

              {showDeptDropdown && (
                <View style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  {MOCK_DEPARTMENTS.map((dept) => (
                    <Pressable
                      key={dept.id}
                      onPress={() => { setDepartmentId(dept.id); setShowDeptDropdown(false); }}
                      style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.text }]}>{dept.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Subject */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Subject *</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief summary of the issue"
                placeholderTextColor={theme.textSecondary}
                style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              />

              {/* Category */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Category</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Hardware, Software, Network"
                placeholderTextColor={theme.textSecondary}
                style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              />

              {/* Priority */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Priority</Text>
              <View style={styles.prioritySelector}>
                {(['low', 'medium', 'high'] as const).map((p) => {
                  const isSel = priority === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[
                        styles.priorityPill,
                        { 
                          backgroundColor: isSel ? '#0891B2' : theme.background, 
                          borderColor: isSel ? '#0891B2' : theme.border 
                        }
                      ]}
                    >
                      <Text style={[styles.priorityPillText, { color: isSel ? '#FFFFFF' : theme.textSecondary }]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Description */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 16 }]}>Description *</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Provide detailed information about your request..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={5}
                style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <Pressable
                onPress={submitTicket}
                disabled={submitting}
                style={[styles.submitBtn, { backgroundColor: '#0891B2', opacity: submitting ? 0.7 : 1 }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Ticket</Text>
                )}
              </Pressable>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Ticket Details Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement, height: '90%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Ticket Details</Text>
              <Pressable onPress={() => { setDetailModalVisible(false); setSelectedTicket(null); }} style={{ padding: 4 }}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            {selectedTicket ? (
              <>
                <ScrollView contentContainerStyle={styles.modalForm}>
                  <View style={styles.detailHeaderBlock}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.priorityTag, { backgroundColor: `${getPriorityColor(selectedTicket.priority)}15` }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(selectedTicket.priority) }]}>
                          {selectedTicket.priority?.toUpperCase()} PRIORITY
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedTicket.status)}15` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(selectedTicket.status) }]}>
                          {selectedTicket.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.detailSubject, { color: theme.text }]}>{selectedTicket.subject}</Text>
                    <Text style={[styles.detailCategory, { color: theme.textSecondary }]}>
                      Department: <Text style={{ color: '#0891B2' }}>{selectedTicket.department?.name || `ID: ${selectedTicket.department_id}`}</Text>
                      {selectedTicket.category ? ` • ${selectedTicket.category}` : ''}
                    </Text>
                  </View>

                  <View style={[styles.descSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={[styles.descLabel, { color: theme.textSecondary }]}>DESCRIPTION</Text>
                    <Text style={[styles.descBody, { color: theme.text }]}>{selectedTicket.description}</Text>
                  </View>

                  {/* Conversations */}
                  <Text style={[styles.sectionTitleModal, { color: theme.text }]}>Conversation</Text>
                  {selectedTicket.conversations && selectedTicket.conversations.length > 0 ? (
                    <View style={styles.conversationsList}>
                      {selectedTicket.conversations.map((conv) => (
                        <View key={conv.id} style={[styles.convBubble, { backgroundColor: theme.background, borderColor: theme.border }]}>
                          <View style={styles.convHeader}>
                            <Text style={[styles.convSender, { color: '#0891B2' }]}>{conv.sender?.name || 'Staff'}</Text>
                            <Text style={[styles.convDate, { color: theme.textSecondary }]}>
                              {new Date(conv.created_at).toLocaleDateString()}
                            </Text>
                          </View>
                          <Text style={[styles.convMsg, { color: theme.text }]}>{conv.message}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noConvBox}>
                      <MessageSquare size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>
                        No replies yet.
                      </Text>
                    </View>
                  )}
                </ScrollView>
                
                {/* Message Input Footer */}
                <View style={[styles.messageFooter, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
                  <TextInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.messageInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                    multiline
                  />
                  <Pressable 
                    onPress={handleSendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    style={[
                      styles.sendButton, 
                      { backgroundColor: newMessage.trim() ? '#0891B2' : theme.border }
                    ]}
                  >
                    {sendingMessage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Send size={16} color="#FFFFFF" />
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    marginLeft: -8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 16,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
  },
  ticketTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 6,
  },
  ticketDesc: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 12,
  },
  categoryText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  modalForm: {
    padding: 20,
  },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  priorityPillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
  submitBtn: {
    marginTop: 32,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  
  // Detail styles
  detailHeaderBlock: {
    marginBottom: 20,
    gap: 10,
  },
  detailSubject: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20,
    lineHeight: 28,
  },
  detailCategory: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  descSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  descLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descBody: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitleModal: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    marginBottom: 12,
  },
  conversationsList: {
    gap: 12,
    marginBottom: 20,
  },
  convBubble: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  convSender: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
  },
  convDate: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
  },
  convMsg: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  noConvBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 48,
    maxHeight: 100,
    marginRight: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
