import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, MapPin, Building2, Calendar, FileText, PackageOpen } from 'lucide-react-native';
import requisitionService, { Requisition } from '@/services/requisitionService';

export default function RequisitionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [requisition, setRequisition] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRequisition(Number(id));
    }
  }, [id]);

  const fetchRequisition = async (reqId: number) => {
    try {
      const result = await requisitionService.getRequisition(reqId);
      if (result.status === 'success') {
        setRequisition(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch requisition details:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading || !requisition) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const statusColor = getStatusColor(requisition.status);
  const statusBg = getStatusBg(requisition.status);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Req Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.reqNo, { color: theme.primary }]}>{requisition.requisition_number}</Text>
              <Text style={[styles.reqTitle, { color: theme.text }]}>{requisition.type} Requisition</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{requisition.status?.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>REQUIRED DATE</Text>
              <View style={styles.infoValueRow}>
                <Calendar size={14} color={theme.text} />
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {new Date(requisition.required_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>PRIORITY</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{requisition.priority}</Text>
            </View>
            
            {requisition.project && (
              <View style={[styles.infoItem, { width: '100%' }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>PROJECT</Text>
                <View style={styles.infoValueRow}>
                  <MapPin size={14} color={theme.text} />
                  <Text style={[styles.infoValue, { color: theme.text }]}>{requisition.project.name}</Text>
                </View>
              </View>
            )}

            {requisition.department && (
              <View style={[styles.infoItem, { width: '100%' }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>DEPARTMENT</Text>
                <View style={styles.infoValueRow}>
                  <Building2 size={14} color={theme.text} />
                  <Text style={[styles.infoValue, { color: theme.text }]}>{requisition.department.name}</Text>
                </View>
              </View>
            )}

            {requisition.justification && (
              <View style={[styles.infoItem, { width: '100%', marginTop: 8 }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>JUSTIFICATION</Text>
                <View style={[styles.infoValueRow, { alignItems: 'flex-start' }]}>
                  <FileText size={14} color={theme.textSecondary} style={{ marginTop: 2 }} />
                  <Text style={[styles.infoValue, { color: theme.textSecondary, flex: 1 }]}>
                    {requisition.justification}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Workflow Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Workflow</Text>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.workflowRow}>
              <Text style={[styles.workflowRole, { color: theme.textSecondary }]}>Requested By:</Text>
              <Text style={[styles.workflowName, { color: theme.text }]}>
                {requisition.requester ? `${requisition.requester.first_name} ${requisition.requester.last_name}` : 'Unknown'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.workflowRow}>
              <Text style={[styles.workflowRole, { color: theme.textSecondary }]}>Approved By:</Text>
              <Text style={[styles.workflowName, { color: theme.text }]}>
                {requisition.approver ? `${requisition.approver.first_name} ${requisition.approver.last_name}` : 'Pending'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.workflowRow}>
              <Text style={[styles.workflowRole, { color: theme.textSecondary }]}>Processed By:</Text>
              <Text style={[styles.workflowName, { color: theme.text }]}>
                {requisition.storekeeper ? `${requisition.storekeeper.first_name} ${requisition.storekeeper.last_name}` : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
              Requested Items ({requisition.items?.length || 0})
            </Text>
          </View>

          <View style={styles.itemsList}>
            {requisition.items?.map((item, index) => {
              const itemStatusColor = getStatusColor(item.status);
              const itemStatusBg = getStatusBg(item.status);

              return (
                <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={[styles.itemBadge, { backgroundColor: itemStatusBg }]}>
                      <Text style={[styles.itemBadgeText, { color: itemStatusColor }]}>{item.status}</Text>
                    </View>
                  </View>

                  {item.stock && (
                    <Text style={[styles.itemStockText, { color: theme.primary }]}>
                      Stock Item: {item.stock.item_name}
                    </Text>
                  )}
                  {item.specification && (
                    <Text style={[styles.itemSpecText, { color: theme.textSecondary }]}>
                      Spec: {item.specification}
                    </Text>
                  )}

                  <View style={[styles.itemQtyBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <View style={styles.qtyCol}>
                      <Text style={[styles.qtyLabel, { color: theme.textSecondary }]}>REQUESTED</Text>
                      <Text style={[styles.qtyValue, { color: theme.text }]}>
                        {item.quantity_requested} {item.uom}
                      </Text>
                    </View>
                    <View style={[styles.qtyDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.qtyCol}>
                      <Text style={[styles.qtyLabel, { color: theme.textSecondary }]}>DISPENSED</Text>
                      <Text style={[styles.qtyValue, { color: theme.primary }]}>
                        {item.quantity_dispensed} {item.uom}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  reqNo: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    marginBottom: 4,
  },
  reqTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    width: '45%',
  },
  infoLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workflowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  workflowRole: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
  },
  workflowName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  itemTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  itemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
  },
  itemStockText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    marginBottom: 4,
  },
  itemSpecText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    marginBottom: 12,
  },
  itemQtyBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  qtyCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyDivider: {
    width: 1,
  },
  qtyLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  qtyValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14,
  },
});
