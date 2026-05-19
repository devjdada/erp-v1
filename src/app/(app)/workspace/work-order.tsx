import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu, Wrench, CheckCircle2, ChevronRight } from 'lucide-react-native';

type TabType = 'All' | 'Active' | 'Completed';

export default function WorkOrderScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const workOrders = [
    { id: 'WO-2026-089', title: 'Main Engine Maintenance', priority: 'High', status: 'Active', fleet: 'Truck 12 (Ford F-750)', date: 'May 19, 2026' },
    { id: 'WO-2026-090', title: 'Brake Pad Replacement', priority: 'Medium', status: 'Active', fleet: 'Van 04 (Chevrolet Express)', date: 'May 18, 2026' },
    { id: 'WO-2026-085', title: 'Routine Safety Inspection', priority: 'Low', status: 'Completed', fleet: 'Trailer 02 (Utility Cargo)', date: 'May 15, 2026' },
    { id: 'WO-2026-082', title: 'AC System Compressor Swap', priority: 'Medium', status: 'Completed', fleet: 'Truck 07 (Freightliner)', date: 'May 12, 2026' },
  ];

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const filteredOrders = workOrders.filter(order => {
    if (activeTab === 'All') return true;
    return order.status === activeTab;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={handleToggleDrawer} style={styles.headerButton}>
          <Menu color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Work Orders</Text>
        <View style={{ width: 40 }} /> {/* balance layout */}
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        {(['All', 'Active', 'Completed'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButton,
                isActive && { borderBottomColor: theme.primary }
              ]}
            >
              <Text style={[
                styles.tabText, 
                { color: isActive ? theme.primary : theme.textSecondary },
                isActive && styles.activeTabText
              ]}>
                {tab.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {filteredOrders.map((wo) => {
            const isCompleted = wo.status === 'Completed';
            const isHigh = wo.priority === 'High';
            const isMedium = wo.priority === 'Medium';
            const priorityColor = isHigh ? '#EF4444' : isMedium ? '#F59E0B' : '#10B981';
            
            return (
              <Pressable key={wo.id} style={[styles.woCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.woHeader}>
                  <View style={styles.woHeaderLeft}>
                    <Text style={[styles.woId, { color: theme.textSecondary }]}>{wo.id}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
                      <Text style={[styles.priorityText, { color: priorityColor }]}>{wo.priority}</Text>
                    </View>
                  </View>
                  {isCompleted ? (
                    <CheckCircle2 size={16} color="#10B981" />
                  ) : (
                    <Wrench size={16} color={theme.primary} />
                  )}
                </View>
                <Text style={[styles.woTitle, { color: theme.text }]}>{wo.title}</Text>
                <View style={styles.woDivider} />
                <View style={styles.woFooter}>
                  <View style={styles.footerDetails}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>Asset: {wo.fleet}</Text>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>Date: {wo.date}</Text>
                  </View>
                  <ChevronRight size={18} color={theme.textSecondary} />
                </View>
              </Pressable>
            );
          })}
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
  headerButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 48,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  activeTabText: {
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 16,
  },
  woCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  woHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  woHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  woId: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  woTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 14,
  },
  woDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  woFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerDetails: {
    gap: 4,
  },
  footerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
  },
});
