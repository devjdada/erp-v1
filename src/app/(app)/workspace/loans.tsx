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
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wallet, ShieldAlert, BadgeDollarSign, Calendar, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface LoanRecord {
  id: number;
  amount: number;
  interest_rate: number;
  repayment_term: number; // months
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | string;
  monthly_deduction?: number;
  paid_amount?: number;
  balance_amount?: number;
  created_at: string;
}

export default function LoansScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoans = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setLoans(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchLoans(true);
  }, [fetchLoans]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoans(false);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed') return '#10B981';
    if (s === 'rejected') return '#EF4444';
    return '#F59E0B';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed') return 'rgba(16, 185, 129, 0.08)';
    if (s === 'rejected') return 'rgba(239, 68, 68, 0.08)';
    return 'rgba(245, 158, 11, 0.08)';
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null) return '₦0.00';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  // Compute summary stats
  const totalLoanAmount = loans
    .filter((l) => l.status === 'approved' || l.status === 'completed')
    .reduce((sum, l) => sum + l.amount, 0);

  const totalBalance = loans
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + (l.balance_amount !== undefined ? l.balance_amount : l.amount), 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Loans & Advances</Text>
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
          {/* Summary Stats */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <TrendingUp size={20} color={theme.primary} style={{ marginBottom: 6 }} />
              <Text style={[styles.summaryVal, { color: theme.text }]}>{formatCurrency(totalLoanAmount)}</Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Approved</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Wallet size={20} color="#F59E0B" style={{ marginBottom: 6 }} />
              <Text style={[styles.summaryVal, { color: theme.text }]}>{formatCurrency(totalBalance)}</Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Outstanding Balance</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Loan Request History</Text>
          {loans.length > 0 ? (
            <View style={styles.listContainer}>
              {loans.map((loan) => {
                const statusColor = getStatusColor(loan.status);
                const statusBg = getStatusBg(loan.status);
                const paid = loan.paid_amount || 0;
                const outstanding = loan.balance_amount !== undefined ? loan.balance_amount : loan.amount - paid;
                const progress = loan.amount > 0 ? paid / loan.amount : 0;

                return (
                  <View
                    key={loan.id}
                    style={[styles.loanCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={[styles.loanAmount, { color: theme.text }]}>
                          {formatCurrency(loan.amount)}
                        </Text>
                        <Text style={[styles.loanPurpose, { color: theme.textSecondary }]}>
                          {loan.purpose}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {loan.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.detailsSection, { borderColor: theme.border }]}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>INTEREST RATE:</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                          {loan.interest_rate}%
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>REPAYMENT TERM:</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                          {loan.repayment_term} Months
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>MONTHLY DEDUCTION:</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                          {formatCurrency(loan.monthly_deduction || (loan.amount * (1 + loan.interest_rate / 100)) / loan.repayment_term)}
                        </Text>
                      </View>
                    </View>

                    {loan.status === 'approved' && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                            Paid: {formatCurrency(paid)}
                          </Text>
                          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                            Left: {formatCurrency(outstanding)}
                          </Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { backgroundColor: theme.primary, width: `${Math.min(100, progress * 100)}%` },
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <Calendar size={12} color={theme.textSecondary} />
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        Requested: {new Date(loan.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <BadgeDollarSign color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No loans found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Your company loan applications and salary advance logs will appear here.
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryVal: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 15.5,
    marginBottom: 2,
  },
  summaryLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10.5,
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
  loanCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanAmount: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    marginBottom: 2,
  },
  loanPurpose: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
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
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
  progressContainer: {
    marginBottom: 12,
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
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
