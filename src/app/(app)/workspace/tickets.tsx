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
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Ticket, AlertTriangle, CheckCircle, Clock, X, MessageSquare } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface ICTTicket {
  id: number;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | string;
  status: 'open' | 'in-progress' | 'closed' | string;
  description: string;
  created_at: string;
  conversations?: Array<{
    id: number;
    sender: { name: string };
    message: string;
    created_at: string;
  }>;
}

export default function TicketsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [tickets, setTickets] = useState<ICTTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ICTTicket | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTickets = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ict/tickets`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTickets(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching ICT tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchTickets(true);
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets(false);
  };

  const handleViewDetails = async (ticketId: number) => {
    setDetailModalVisible(true);
    setDetailLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ict/tickets/${ticketId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSelectedTicket(result.data);
        }
      }
    } catch (e) {
      console.error('Error fetching ticket details:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === 'high') return '#EF4444';
    if (p === 'medium') return '#F59E0B';
    return '#10B981';
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'closed') return '#10B981';
    if (s === 'in-progress') return '#3B82F6';
    return '#F59E0B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'closed') return 'rgba(16, 185, 129, 0.08)';
    if (s === 'in-progress') return 'rgba(59, 130, 246, 0.08)';
    return 'rgba(245, 158, 11, 0.08)';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>ICT Helpdesk</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
        >
          {tickets.length > 0 ? (
            <View style={styles.listContainer}>
              {tickets.map((ticket) => (
                <Pressable
                  key={ticket.id}
                  onPress={() => handleViewDetails(ticket.id)}
                  style={({ pressed }) => [
                    styles.ticketCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && { backgroundColor: theme.backgroundSelected }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.priorityTag, { backgroundColor: `${getPriorityColor(ticket.priority)}15` }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
                          {ticket.priority?.toUpperCase()} PRIORITY
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(ticket.status) }]}>
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
                    <Text style={[styles.categoryText, { color: theme.primary }]}>
                      Category: {ticket.category}
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
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No support tickets found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Your helpdesk requests and technical issues will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Ticket Details Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Ticket Details</Text>
              <Pressable onPress={() => { setDetailModalVisible(false); setSelectedTicket(null); }}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            {detailLoading ? (
              <View style={styles.modalCentered}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : selectedTicket ? (
              <ScrollView contentContainerStyle={styles.modalForm}>
                <View style={styles.detailHeaderBlock}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.priorityTag, { backgroundColor: `${getPriorityColor(selectedTicket.priority)}15` }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(selectedTicket.priority) }]}>
                        {selectedTicket.priority?.toUpperCase()} PRIORITY
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedTicket.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedTicket.status) }]}>
                        {selectedTicket.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.detailSubject, { color: theme.text }]}>{selectedTicket.subject}</Text>
                  <Text style={[styles.detailCategory, { color: theme.textSecondary }]}>
                    Category: <Text style={{ color: theme.primary }}>{selectedTicket.category}</Text>
                  </Text>
                </View>

                <View style={[styles.descSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={[styles.descLabel, { color: theme.textSecondary }]}>DESCRIPTION</Text>
                  <Text style={[styles.descBody, { color: theme.text }]}>{selectedTicket.description}</Text>
                </View>

                {/* Conversation/Replies */}
                <Text style={[styles.sectionTitleModal, { color: theme.text }]}>Replies</Text>
                {selectedTicket.conversations && selectedTicket.conversations.length > 0 ? (
                  <View style={styles.conversationsList}>
                    {selectedTicket.conversations.map((conv) => (
                      <View key={conv.id} style={[styles.convBubble, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <View style={styles.convHeader}>
                          <Text style={[styles.convSender, { color: theme.primary }]}>{conv.sender.name}</Text>
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
                      No replies yet on this ticket.
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
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
  backButton: {
    padding: 8,
    marginLeft: -8,
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
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
  },
  ticketTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15.5,
    marginBottom: 6,
  },
  ticketDesc: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
    paddingTop: 10,
  },
  categoryText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
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
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
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
    paddingBottom: 24,
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
    fontSize: 17.5,
  },
  modalForm: {
    padding: 20,
  },
  modalCentered: {
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderBlock: {
    marginBottom: 16,
    gap: 8,
  },
  detailSubject: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18.5,
  },
  detailCategory: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13.5,
  },
  descSection: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  descLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  descBody: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14.5,
    lineHeight: 20,
  },
  sectionTitleModal: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  conversationsList: {
    gap: 10,
  },
  convBubble: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  convSender: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12.5,
  },
  convDate: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
  },
  convMsg: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    lineHeight: 18,
  },
  noConvBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
