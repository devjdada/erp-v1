import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Megaphone, Bell, Calendar, User, ChevronRight, ChevronDown, Sparkles } from 'lucide-react-native';

interface AnnouncementItem {
  id: string;
  title: string;
  category: 'hr' | 'operations' | 'general' | 'social';
  date: string;
  author: string;
  authorRole: string;
  summary: string;
  content: string;
  isImportant?: boolean;
}

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>('1'); // Default first item expanded

  const announcements: AnnouncementItem[] = [
    {
      id: '1',
      title: 'Company Q2 Town Hall & Performance Review',
      category: 'general',
      date: 'May 19, 2026',
      author: 'Sarah Jenkins',
      authorRole: 'Chief Executive Officer',
      summary: 'Join us this Thursday at 3 PM EST for our quarterly town hall session where we will discuss key performance targets and milestones.',
      content: 'We will be highlighting our operational growth in Q2, introducing several new enterprise clients, and laying out our roadmap for the remainder of the year. The meeting link has been shared via email, and a Q&A session will be held during the final 20 minutes. All departments are requested to attend.',
      isImportant: true,
    },
    {
      id: '2',
      title: 'New Health Insurance Benefits Package',
      category: 'hr',
      date: 'May 15, 2026',
      author: 'Marcus Vance',
      authorRole: 'HR Director',
      summary: 'Our updated company insurance policy offers enhanced vision and dental coverage options starting June 1st.',
      content: 'The new coverage details and opt-in instructions are available in the Document Hub under Policies. If you wish to adjust your coverage tiers or add dependents, please submit your choice before May 25th. For any questions, please schedule a time with the HR benefits team.',
    },
    {
      id: '3',
      title: 'Scheduled Server Maintenance Downtime',
      category: 'operations',
      date: 'May 12, 2026',
      author: 'David Chen',
      authorRole: 'IT Operations Lead',
      summary: 'ERP portal and databases will be offline for system upgrades on Saturday, May 23rd, from 2:00 AM to 6:00 AM UTC.',
      content: 'During this period, access to database records, fleet status maps, and work orders will be temporarily suspended. Please ensure you sync all local progress and submit active timesheets prior to Friday evening. Thank you for your cooperation as we implement these security improvements.',
    },
    {
      id: '4',
      title: 'Annual Team-Building Weekend Picnic',
      category: 'social',
      date: 'May 08, 2026',
      author: 'Lily Adams',
      authorRole: 'Social Committee Coordinator',
      summary: 'Get ready for our summer family picnic on June 14th at Sunnyvale Recreational Park! RSVP by end of month.',
      content: 'This year we will have food trucks, team sports tournaments, and live music! Family members are welcome. Please fill out the RSVP form sent via internal message to indicate diet preferences and head counts.',
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'hr':
        return '#EF4444'; // Red
      case 'operations':
        return '#F59E0B'; // Amber
      case 'social':
        return '#10B981'; // Green
      default:
        return '#1E6FFD'; // Blue
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'hr':
        return 'rgba(239, 68, 68, 0.08)';
      case 'operations':
        return 'rgba(245, 158, 11, 0.08)';
      case 'social':
        return 'rgba(16, 185, 129, 0.08)';
      default:
        return 'rgba(30, 111, 253, 0.08)';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Company Bulletins</Text>
        <View style={styles.headerRight}>
          <Bell color={theme.textSecondary} size={20} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <View style={[styles.announcementBanner, { backgroundColor: theme.primary }]}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Stay Informed</Text>
            <Text style={styles.bannerSubtitle}>Get the latest organizational announcements and general bulletins.</Text>
          </View>
          <View style={styles.bannerIconWrapper}>
            <Megaphone color="#FFFFFF" size={40} style={styles.bannerIcon} />
          </View>
        </View>

        {/* Bulletins List */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Bulletins</Text>
        
        <View style={styles.listContainer}>
          {announcements.map((item) => {
            const isExpanded = expandedId === item.id;
            const categoryColor = getCategoryColor(item.category);
            const categoryBg = getCategoryBg(item.category);

            return (
              <Pressable
                key={item.id}
                onPress={() => toggleExpand(item.id)}
                style={[
                  styles.announcementCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: item.isImportant ? theme.primary : theme.border,
                    borderWidth: item.isImportant ? 1.5 : 1,
                  }
                ]}
              >
                {/* Ribbon for important announcement */}
                {item.isImportant && (
                  <View style={[styles.importantRibbon, { backgroundColor: theme.primary }]}>
                    <Sparkles color="#FFFFFF" size={10} style={{ marginRight: 4 }} />
                    <Text style={styles.importantText}>IMPORTANT</Text>
                  </View>
                )}

                {/* Card Top Details */}
                <View style={styles.cardHeader}>
                  <View style={[styles.tagBadge, { backgroundColor: categoryBg }]}>
                    <Text style={[styles.tagText, { color: categoryColor }]}>
                      {item.category.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.dateContainer}>
                    <Calendar color={theme.textSecondary} size={12} style={{ marginRight: 4 }} />
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>{item.date}</Text>
                  </View>
                </View>

                {/* Card Title */}
                <Text style={[styles.titleText, { color: theme.text }]}>{item.title}</Text>

                {/* Card Summary */}
                <Text style={[styles.summaryText, { color: theme.textSecondary }]} numberOfLines={isExpanded ? undefined : 2}>
                  {item.summary}
                </Text>

                {/* Expanded Content */}
                {isExpanded && (
                  <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                    <Text style={[styles.contentText, { color: theme.text }]}>
                      {item.content}
                    </Text>

                    {/* Author Meta Section */}
                    <View style={[styles.authorMeta, { backgroundColor: theme.backgroundSelected }]}>
                      <View style={[styles.authorAvatar, { backgroundColor: theme.primary }]}>
                        <User color="#FFFFFF" size={16} />
                      </View>
                      <View>
                        <Text style={[styles.authorName, { color: theme.text }]}>{item.author}</Text>
                        <Text style={[styles.authorRole, { color: theme.textSecondary }]}>{item.authorRole}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Accordion Footer */}
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <Text style={[styles.readTime, { color: theme.textSecondary }]}>
                    {isExpanded ? 'Show less' : 'Read announcement'}
                  </Text>
                  {isExpanded ? (
                    <ChevronDown color={theme.textSecondary} size={16} />
                  ) : (
                    <ChevronRight color={theme.textSecondary} size={16} />
                  )}
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  headerRight: {
    padding: 8,
    marginRight: -8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  announcementBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    overflow: 'hidden',
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  bannerIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIcon: {
    transform: [{ rotate: '-15deg' }],
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
  },
  announcementCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  importantRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  importantText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
  },
  titleText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
    paddingRight: 60, // Avoid overlapping with important badge
  },
  summaryText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  expandedContent: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  contentText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
  },
  authorRole: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readTime: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },
});
