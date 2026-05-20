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
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Calendar, ShieldCheck, Clock, UserCheck } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface VisitorLog {
  id: number;
  name: string;
  phone?: string;
  company?: string;
  purpose?: string;
  check_in: string;
  check_out?: string | null;
  status: 'active' | 'checked-out' | string;
  host_staff?: {
    first_name: string;
    surname: string;
  } | null;
}

export default function VisitorsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVisitors = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/security/visitors`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setVisitors(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchVisitors(true);
  }, [fetchVisitors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitors(false);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'checked-out') return '#64748B';
    return '#10B981'; // active
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'checked-out') return 'rgba(100, 116, 139, 0.08)';
    return 'rgba(16, 185, 129, 0.08)';
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Visitor Logs</Text>
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
          {visitors.length > 0 ? (
            <View style={styles.listContainer}>
              {visitors.map((log) => {
                const statusColor = getStatusColor(log.status);
                const statusBg = getStatusBg(log.status);
                const isCheckOut = !!log.check_out;

                return (
                  <View
                    key={log.id}
                    style={[styles.visitorCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.visitorIdentity}>
                        <View style={[styles.avatarBox, { backgroundColor: `${theme.primary}12` }]}>
                          <UserCheck color={theme.primary} size={18} />
                        </View>
                        <View>
                          <Text style={[styles.visitorName, { color: theme.text }]}>{log.name}</Text>
                          {log.company && (
                            <Text style={[styles.visitorCompany, { color: theme.textSecondary }]}>
                              from {log.company}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {log.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.detailsSection, { borderColor: theme.border }]}>
                      {log.purpose && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>PURPOSE:</Text>
                          <Text style={[styles.detailValue, { color: theme.text }]}>{log.purpose}</Text>
                        </View>
                      )}
                      
                      {log.host_staff && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>HOST STAFF:</Text>
                          <Text style={[styles.detailValue, { color: theme.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                            {log.host_staff.first_name} {log.host_staff.surname}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.timeBlock}>
                        <Clock size={12} color={theme.textSecondary} />
                        <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                          In: {formatDateTime(log.check_in)}
                        </Text>
                      </View>
                      
                      {isCheckOut && (
                        <View style={styles.timeBlock}>
                          <Clock size={12} color={theme.textSecondary} />
                          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                            Out: {formatDateTime(log.check_out)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Users color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No visitor logs found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Security check-in logs for your office visitors will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
  visitorCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  visitorIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitorName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  visitorCompany: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
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
  detailsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    width: 80,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
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
});
