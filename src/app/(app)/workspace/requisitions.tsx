import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ShoppingCart, Calendar, Plus, MapPin, Building2, PackageOpen, AlertTriangle } from 'lucide-react-native';
import requisitionService, { Requisition } from '@/services/requisitionService';

export default function RequisitionsScreen() {
  const theme = useTheme();
  const router = useRouter();

  // State
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchRequisitions = useCallback(async (pageNum = 1, showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const result = await requisitionService.getRequisitions(pageNum);
      if (result.status === 'success' && result.data) {
        if (pageNum === 1) {
          setRequisitions(result.data.data);
        } else {
          setRequisitions(prev => [...prev, ...result.data.data]);
        }
        setHasMore(result.data.current_page < result.data.last_page);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequisitions(1, true);
    }, [fetchRequisitions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequisitions(1, false);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed' || s === 'dispensed') return '#10B981';
    if (s === 'rejected') return '#EF4444';
    if (s === 'partially dispensed') return '#F59E0B';
    if (s === 'converted to pr') return '#3B82F6';
    return '#64748B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed' || s === 'dispensed') return 'rgba(16, 185, 129, 0.08)';
    if (s === 'rejected') return 'rgba(239, 68, 68, 0.08)';
    if (s === 'partially dispensed') return 'rgba(245, 158, 11, 0.08)';
    if (s === 'converted to pr') return 'rgba(59, 130, 246, 0.08)';
    return 'rgba(100, 116, 139, 0.08)';
  };

  const getPriorityColor = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === 'critical') return '#EF4444';
    if (p === 'high') return '#F97316';
    if (p === 'medium') return '#EAB308';
    return '#10B981';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Material Requisitions</Text>
        <Pressable onPress={() => router.push('/workspace/requisition/create')} style={styles.createButton}>
          <Plus color={theme.primary} size={24} />
        </Pressable>
      </View>

      {loading && requisitions.length === 0 ? (
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
          {requisitions.length > 0 ? (
            <View style={styles.listContainer}>
              {requisitions.map((req) => {
                const statusColor = getStatusColor(req.status);
                const statusBg = getStatusBg(req.status);
                const priorityColor = getPriorityColor(req.priority);

                return (
                  <Pressable
                    key={req.id}
                    onPress={() => router.push(`/workspace/requisition/${req.id}`)}
                    style={({ pressed }) => [
                      styles.requisitionCard,
                      { 
                        backgroundColor: theme.backgroundElement, 
                        borderColor: theme.border,
                        opacity: pressed ? 0.8 : 1
                      }
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reqNo, { color: theme.primary }]}>
                          {req.requisition_number}
                        </Text>
                        <Text style={[styles.reqTitle, { color: theme.text }]} numberOfLines={1}>
                          {req.type} Requisition
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {req.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.detailsSection, { borderColor: theme.border }]}>
                      {req.project && (
                        <View style={styles.detailRow}>
                          <MapPin size={14} color={theme.textSecondary} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>PROJECT:</Text>
                          <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                            {req.project.name}
                          </Text>
                        </View>
                      )}
                      
                      {req.department && (
                        <View style={styles.detailRow}>
                          <Building2 size={14} color={theme.textSecondary} />
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DEPARTMENT:</Text>
                          <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                            {req.department.name}
                          </Text>
                        </View>
                      )}

                      <View style={styles.detailRow}>
                        <AlertTriangle size={14} color={priorityColor} />
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>PRIORITY:</Text>
                        <Text style={[styles.detailValue, { color: priorityColor, fontFamily: 'PlusJakartaSans_700Bold' }]}>
                          {req.priority}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.footerItem}>
                        <Calendar size={12} color={theme.textSecondary} />
                        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                          Req: {new Date(req.required_date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.footerItem}>
                        <PackageOpen size={12} color={theme.textSecondary} />
                        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                          Type: {req.type}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}

              {hasMore && (
                <Pressable 
                  style={[styles.loadMoreBtn, { backgroundColor: theme.primary + '15' }]} 
                  onPress={() => fetchRequisitions(page + 1)}
                >
                  <Text style={[styles.loadMoreText, { color: theme.primary }]}>Load More</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <PackageOpen color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No requisitions found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Material requests you make will appear here. Tap the + icon to create one.
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
  createButton: {
    padding: 8,
    marginRight: -8,
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
    width: 90,
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
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  loadMoreBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
});
