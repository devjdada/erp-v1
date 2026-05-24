import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { hrService } from '@/services/hrService';
import { Wrench, Shield } from 'lucide-react-native';

export default function HRTools() {
  const theme = useTheme();
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const res = await hrService.getTools();
      setTools(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Company Tools</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage and assign physical tools</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <View style={styles.listContainer}>
            {tools.map((tool: any, index: number) => (
              <View 
                key={tool.id || index} 
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
                  <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSelected }]}>
                    <Wrench color={theme.primary} size={24} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: theme.text }]}>{tool.name}</Text>
                    <Text style={[styles.serial, { color: theme.textSecondary }]}>
                      Serial: {tool.serial_number || 'N/A'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <Text style={[styles.statusText, { color: theme.text }]}>{tool.status || 'Available'}</Text>
                  </View>
                </View>

                {tool.assigned_to && (
                  <>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.cardFooter}>
                      <Shield color={theme.textSecondary} size={14} />
                      <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                        Assigned to: {tool.assigned_user?.name || `User ID ${tool.assigned_to}`}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            ))}
            {tools.length === 0 && (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No tools found.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, marginBottom: 4 },
  subtitle: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16 },
  listContainer: { gap: 16 },
  card: { padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, marginBottom: 4 },
  serial: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  statusText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, textTransform: 'capitalize' },
  divider: { height: 1, marginVertical: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
});
