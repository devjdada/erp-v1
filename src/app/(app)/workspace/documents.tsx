import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, FileText, Download, ShieldAlert, Award, FileSpreadsheet, Eye } from 'lucide-react-native';

interface DocumentItem {
  id: string;
  title: string;
  category: 'policy' | 'form' | 'guide';
  size: string;
  updatedAt: string;
  version: string;
}

export default function DocumentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'policy' | 'form' | 'guide'>('all');

  const documents: DocumentItem[] = [
    { id: '1', title: 'Employee Code of Conduct 2026', category: 'policy', size: '2.4 MB', updatedAt: '2026-04-15', version: 'v2.1' },
    { id: '2', title: 'Leave Application Form (Offline)', category: 'form', size: '340 KB', updatedAt: '2026-01-10', version: 'v1.0' },
    { id: '3', title: 'Expense Reimbursement Template', category: 'form', size: '1.1 MB', updatedAt: '2026-03-02', version: 'v1.4' },
    { id: '4', title: 'Workplace Safety & Health Policy', category: 'policy', size: '1.8 MB', updatedAt: '2026-05-01', version: 'v3.0' },
    { id: '5', title: 'Mobile App User Guide for Staff', category: 'guide', size: '4.2 MB', updatedAt: '2026-05-19', version: 'v1.1' },
    { id: '6', title: 'ERP System Administration Manual', category: 'guide', size: '8.7 MB', updatedAt: '2025-12-15', version: 'v4.2' },
  ];

  const handleDownload = (title: string) => {
    Alert.alert(
      'Download Started',
      `"${title}" is downloading in the background. You will receive a notification when finished.`,
      [{ text: 'OK' }]
    );
  };

  const handleView = (title: string) => {
    Alert.alert(
      'Open Document',
      `Opening preview for "${title}"...`,
      [{ text: 'Close' }]
    );
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'policy':
        return <ShieldAlert color="#EF4444" size={20} />;
      case 'form':
        return <FileSpreadsheet color="#10B981" size={20} />;
      case 'guide':
        return <Award color="#1E6FFD" size={20} />;
      default:
        return <FileText color="#64748B" size={20} />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'policy':
        return 'rgba(239, 68, 68, 0.08)';
      case 'form':
        return 'rgba(16, 185, 129, 0.08)';
      case 'guide':
        return 'rgba(30, 111, 253, 0.08)';
      default:
        return 'rgba(100, 116, 139, 0.08)';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Document Hub</Text>
        <View style={{ width: 40 }} /> {/* Balancer */}
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Search color={theme.textSecondary} size={18} style={styles.searchIcon} />
          <TextInput
            placeholder="Search documents..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
      </View>

      {/* Category Filter Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {(['all', 'policy', 'form', 'guide'] as const).map((cat) => {
            const isActive = activeCategory === cat;
            const label = cat === 'all' ? 'All Files' : cat.charAt(0).toUpperCase() + cat.slice(1) + 's';
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isActive ? theme.primary : theme.backgroundElement,
                    borderColor: isActive ? theme.primary : theme.border,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isActive ? '#FFFFFF' : theme.textSecondary,
                      fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold',
                    }
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Documents List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredDocuments.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredDocuments.map((doc) => (
              <View
                key={doc.id}
                style={[styles.documentCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrapper, { backgroundColor: getCategoryBg(doc.category) }]}>
                    {getCategoryIcon(doc.category)}
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={[styles.typeBadge, { backgroundColor: theme.backgroundSelected }]}>
                      <Text style={[styles.typeText, { color: theme.textSecondary }]}>
                        {doc.category.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.versionText, { color: theme.textSecondary }]}>{doc.version}</Text>
                  </View>
                </View>

                <Text style={[styles.documentTitle, { color: theme.text }]} numberOfLines={2}>
                  {doc.title}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.docDetails}>
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>{doc.size}</Text>
                    <Text style={[styles.divider, { color: theme.border }]}>•</Text>
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                      {doc.updatedAt}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <Pressable
                      onPress={() => handleView(doc.title)}
                      style={[styles.iconActionButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                    >
                      <Eye color={theme.text} size={16} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDownload(doc.title)}
                      style={[styles.iconActionButton, { backgroundColor: theme.primary }]}
                    >
                      <Download color="#FFFFFF" size={16} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <FileText color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No documents found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Try searching with different keywords or changing the category filter.
            </Text>
          </View>
        )}
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
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  categoryContainer: {
    paddingVertical: 14,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 16,
  },
  documentCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  versionText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
  },
  documentTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
  },
  divider: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
