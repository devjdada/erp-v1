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
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ShieldAlert, Truck, User, Calendar } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface MovementRecord {
  id: number;
  movement_type: 'inward' | 'outward' | string;
  item_description: string;
  vehicle_no?: string;
  driver_name?: string;
  gate_pass_no?: string;
  origin?: string;
  destination?: string;
  status: 'pending' | 'approved' | 'dispatched' | 'completed' | string;
  created_at: string;
}

export default function MovementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovements = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/security/movements`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setMovements(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchMovements(true);
  }, [fetchMovements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovements(false);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return '#10B981';
    if (s === 'dispatched') return '#3B82F6';
    return '#F59E0B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'rgba(16, 185, 129, 0.08)';
    if (s === 'dispatched') return 'rgba(59, 130, 246, 0.08)';
    return 'rgba(245, 158, 11, 0.08)';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Security Movements</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Gate Logs</Text>
          {movements.length > 0 ? (
            <View style={styles.listContainer}>
              {movements.map((move) => {
                const statusColor = getStatusColor(move.status);
                const statusBg = getStatusBg(move.status);
                const isInward = move.movement_type?.toLowerCase() === 'inward';

                return (
                  <View
                    key={move.id}
                    style={[styles.movementCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.movementIdentity}>
                        <View style={[styles.avatarBox, { backgroundColor: isInward ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
                          {isInward ? (
                            <ArrowDownLeft color="#10B981" size={18} />
                          ) : (
                            <ArrowUpRight color="#3B82F6" size={18} />
                          )}
                        </View>
                        <View>
                          <Text style={[styles.moveItem, { color: theme.text }]} numberOfLines={1}>
                            {move.item_description}
                          </Text>
                          <Text style={[styles.moveTypeLabel, { color: isInward ? '#10B981' : '#3B82F6' }]}>
                            {move.movement_type?.toUpperCase()} MOVEMENT
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {move.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.detailsSection, { borderColor: theme.border }]}>
                      {move.vehicle_no && (
                        <View style={styles.detailRow}>
                          <Truck size={12} color={theme.textSecondary} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>VEHICLE NO:</Text>
                          <Text style={[styles.detailValue, { color: theme.text }]}>{move.vehicle_no}</Text>
                        </View>
                      )}
                      
                      {move.driver_name && (
                        <View style={styles.detailRow}>
                          <User size={12} color={theme.textSecondary} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DRIVER:</Text>
                          <Text style={[styles.detailValue, { color: theme.text }]}>{move.driver_name}</Text>
                        </View>
                      )}

                      {move.gate_pass_no && (
                        <View style={styles.detailRow}>
                          <ShieldAlert size={12} color={theme.textSecondary} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>GATE PASS:</Text>
                          <Text style={[styles.detailValue, { color: theme.text }]}>{move.gate_pass_no}</Text>
                        </View>
                      )}

                      {(move.origin || move.destination) && (
                        <View style={styles.detailRow}>
                          <Truck size={12} color={theme.textSecondary} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>ROUTE:</Text>
                          <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                            {move.origin || 'Site'} ➔ {move.destination || 'Site'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Calendar size={12} color={theme.textSecondary} />
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        Log Time: {new Date(move.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Truck color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No movements found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Material transport, project tools dispatch, and vehicle gate check-ins will appear here.
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
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  listContainer: {
    gap: 16,
  },
  movementCard: {
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
  movementIdentity: {
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
  moveItem: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14.5,
    maxWidth: 180,
  },
  moveTypeLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9.5,
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
    gap: 6,
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
