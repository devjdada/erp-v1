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
import { ArrowLeft, ShoppingCart, Calendar, DollarSign, Receipt, Info } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface RequisitionItem {
  id: number;
  requisition_no: string;
  title: string;
  estimated_cost: number;
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'completed' | string;
  created_at: string;
  requested_by_user?: {
    name: string;
  } | null;
}

export default function RequisitionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequisitions = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/procurement/requisitions`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setRequisitions(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchRequisitions(true);
  }, [fetchRequisitions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequisitions(false);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed' || s === 'ordered') return '#10B981';
    if (s === 'rejected') return '#EF4444';
    return '#F59E0B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed' || s === 'ordered') return 'rgba(16, 185, 129, 0.08)';
    if (s === 'rejected') return 'rgba(239, 68, 68, 0.08)';
    return 'rgba(245, 158, 11, 0.08)';
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null) return '₦0.00';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const totalCost = requisitions.reduce((sum, r) => sum + r.estimated_cost, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Purchase Requisitions</Text>
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
          {/* Total Stats Banner */}
          <View style={[styles.statsBanner, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.bannerLeft}>
              <Receipt size={24} color={theme.primary} />
              <View>
                <Text style={[styles.bannerTitle, { color: theme.text }]}>Estimated Budget</Text>
                <Text style={[styles.bannerLabel, { color: theme.textSecondary }]}>Total value of requested items</Text>
              </View>
            </View>
            <Text style={[styles.bannerCost, { color: theme.text }]}>{formatCurrency(totalCost)}</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Requisitions</Text>
          {requisitions.length > 0 ? (
            <View style={styles.listContainer}>
              {requisitions.map((req) => {
                const statusColor = getStatusColor(req.status);
                const statusBg = getStatusBg(req.status);

                return (
                  <View
                    key={req.id}
                    style={[styles.requisitionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={[styles.reqNo, { color: theme.primary }]}>
                          {req.requisition_no}
                        </Text>
                        <Text style={[styles.reqTitle, { color: theme.text }]} numberOfLines={2}>
                          {req.title}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {req.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.detailsSection, { borderColor: theme.border }]}>
                      <View style={styles.detailRow}>
                        <DollarSign size={14} color={theme.textSecondary} />
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>ESTIMATED COST:</Text>
                        <Text style={[styles.detailValue, { color: theme.text, fontFamily: 'PlusJakartaSans_700Bold' }]}>
                          {formatCurrency(req.estimated_cost)}
                        </Text>
                      </View>
                      
                      {req.requested_by_user && (
                        <View style={styles.detailRow}>
                          <Info size={14} color={theme.textSecondary} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>REQUESTED BY:</Text>
                          <Text style={[styles.detailValue, { color: theme.text }]}>
                            {req.requested_by_user.name}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Calendar size={12} color={theme.textSecondary} />
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        Date: {new Date(req.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ShoppingCart color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No requisitions found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Materials and procurement requests for project sites will appear here.
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
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bannerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14.5,
  },
  bannerLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
  },
  bannerCost: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16,
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
  requisitionCard: {
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
  reqNo: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    marginBottom: 2,
  },
  reqTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14.5,
    maxWidth: 180,
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
    width: 100,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
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
