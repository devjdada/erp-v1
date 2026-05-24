import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Users, Mail, Phone, Search, ArrowDownAZ, ArrowUpAZ, X } from 'lucide-react-native';
import { hrService } from '@/services/hrService';

export default function HRDirectory() {
  const theme = useTheme();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 4 || searchQuery.length === 0) {
        setDebouncedQuery(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadDirectory(1, true);
  }, [debouncedQuery, sortOrder]);

  const loadDirectory = async (pageNumber: number, reset: boolean = false) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page: pageNumber,
        search: debouncedQuery,
        sort: sortOrder === 'asc' ? 'name' : '-name',
        per_page: 20
      };

      const res = await hrService.getDirectory(params);
      
      const responseData = res.data?.data || res.data || [];
      const newStaff = Array.isArray(responseData) ? responseData : [];
      
      if (reset) {
        setStaff(newStaff);
      } else {
        setStaff(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const uniqueNew = newStaff.filter(s => !existingIds.has(s.id));
          return [...prev, ...uniqueNew];
        });
      }
      
      if (res.data?.last_page && res.data?.current_page) {
        setHasMore(res.data.current_page < res.data.last_page);
      } else {
        setHasMore(newStaff.length >= 20); // Fallback
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadDirectory(nextPage);
    }
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderItem = ({ item: employee }: { item: any }) => (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.backgroundElement, 
          borderColor: theme.border, 
          borderWidth: 1 
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
          <Users color={theme.primary} size={24} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>
            {employee.user?.name || `${employee.first_name || ''} ${employee.surname || ''}`.trim() || 'Unknown'}
          </Text>
          <Text style={[styles.role, { color: theme.textSecondary }]}>
            {employee.designation || 'Staff'} • {employee.department?.name || 'No Dept'}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.cardFooter}>
        {employee.user?.email && (
          <View style={styles.contactRow}>
            <Mail color={theme.textSecondary} size={14} />
            <Text style={[styles.contactText, { color: theme.textSecondary }]}>{employee.user.email}</Text>
          </View>
        )}
        {(employee.phone || employee.phone_number) && (
          <View style={styles.contactRow}>
            <Phone color={theme.textSecondary} size={14} />
            <Text style={[styles.contactText, { color: theme.textSecondary }]}>{employee.phone || employee.phone_number}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Staff Directory</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Company-wide employee directory</Text>
      </View>

      <View style={styles.filtersContainer}>
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Search color={theme.textSecondary} size={20} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search staff..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <X color={theme.textSecondary} size={16} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.sortButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} 
          onPress={toggleSort}
        >
          {sortOrder === 'asc' ? (
            <ArrowDownAZ color={theme.text} size={20} />
          ) : (
            <ArrowUpAZ color={theme.text} size={20} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40 }}>
        No staff found matching your criteria.
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {loading && page === 1 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  sortButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    marginBottom: 2,
  },
  role: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  cardFooter: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
