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
import { ArrowLeft, Hammer, Calendar, ClipboardList, Info, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface Tool {
  id: number;
  name: string;
  code: string;
  category: string;
  status: 'available' | 'in-use' | 'maintenance' | string;
}

interface ToolRequest {
  id: number;
  tool: {
    name: string;
    code: string;
  };
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | string;
  created_at: string;
}

export default function ToolsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');
  const [tools, setTools] = useState<Tool[]>([]);
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchToolsData = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      if (activeTab === 'inventory') {
        const response = await fetch(`${API_BASE_URL}/tools`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setTools(result.data);
          }
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/tools/requests`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setRequests(result.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tools details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken, activeTab]);

  useEffect(() => {
    fetchToolsData(true);
  }, [fetchToolsData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchToolsData(false);
  };

  const getToolStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'available') return '#10B981';
    if (s === 'in-use') return '#3B82F6';
    return '#F59E0B';
  };

  const getRequestStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'returned') return '#10B981';
    if (s === 'rejected') return '#EF4444';
    return '#F59E0B';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Tools & Equipment</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => setActiveTab('inventory')}
          style={[styles.tabItem, activeTab === 'inventory' && { borderBottomColor: theme.primary }]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'inventory' ? theme.primary : theme.textSecondary,
                fontFamily: activeTab === 'inventory' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold',
              },
            ]}
          >
            Inventory List
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('requests')}
          style={[styles.tabItem, activeTab === 'requests' && { borderBottomColor: theme.primary }]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'requests' ? theme.primary : theme.textSecondary,
                fontFamily: activeTab === 'requests' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold',
              },
            ]}
          >
            My Requests
          </Text>
        </Pressable>
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
          {activeTab === 'inventory' ? (
            tools.length > 0 ? (
              <View style={styles.listContainer}>
                {tools.map((tool) => (
                  <View
                    key={tool.id}
                    style={[styles.toolCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.toolIdentity}>
                        <View style={[styles.avatarBox, { backgroundColor: 'rgba(30, 111, 253, 0.08)' }]}>
                          <Hammer color={theme.primary} size={18} />
                        </View>
                        <View>
                          <Text style={[styles.toolName, { color: theme.text }]}>{tool.name}</Text>
                          <Text style={[styles.toolCode, { color: theme.textSecondary }]}>
                            Code: {tool.code} • Category: {tool.category}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${getToolStatusColor(tool.status)}15` }]}>
                        <Text style={[styles.statusText, { color: getToolStatusColor(tool.status) }]}>
                          {tool.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Hammer color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No tools found</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Tools list in the central store is currently empty.
                </Text>
              </View>
            )
          ) : requests.length > 0 ? (
            <View style={styles.listContainer}>
              {requests.map((req) => {
                const statusColor = getRequestStatusColor(req.status);

                return (
                  <View
                    key={req.id}
                    style={[styles.toolCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.toolIdentity}>
                        <View style={[styles.avatarBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                          <ClipboardList color="#10B981" size={18} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.toolName, { color: theme.text }]} numberOfLines={1}>
                            {req.tool?.name || 'Unknown Tool'}
                          </Text>
                          <Text style={[styles.toolCode, { color: theme.textSecondary }]}>
                            Code: {req.tool?.code || 'N/A'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {req.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.detailsSection, { borderColor: theme.border }]}>
                      <View style={styles.detailRow}>
                        <Calendar size={12} color={theme.textSecondary} />
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DURATION:</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                          {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Calendar size={12} color={theme.textSecondary} />
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        Requested: {new Date(req.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ClipboardList color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No requests found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Your tool and equipment checkout requests will appear here.
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
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13.5,
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
  toolCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toolIdentity: {
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
  toolName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
  },
  toolCode: {
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
    marginTop: 14,
    marginBottom: 10,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    width: 75,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
});
