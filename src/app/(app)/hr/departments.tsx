import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { hrService } from '@/services/hrService';
import { Shield, Users } from 'lucide-react-native';

export default function HRDepartments() {
  const theme = useTheme();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await hrService.getDepartments();
      setDepartments(res.data?.data || res.data || []);
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
          <Text style={[styles.title, { color: theme.text }]}>Departments</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Company organizational units</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <View style={styles.listContainer}>
            {departments.map((dept: any, index: number) => (
              <View 
                key={dept.id || index} 
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
                    <Shield color={theme.primary} size={24} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: theme.text }]}>{dept.name}</Text>
                    {dept.hod && (
                      <Text style={[styles.hod, { color: theme.textSecondary }]}>
                        HOD: {dept.hod?.name || `ID ${dept.hod_id}`}
                      </Text>
                    )}
                  </View>
                </View>

                {dept.staff_count !== undefined && (
                  <>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.cardFooter}>
                      <View style={styles.statBlock}>
                        <Users color={theme.textSecondary} size={14} />
                        <Text style={[styles.statText, { color: theme.textSecondary }]}>
                          {dept.staff_count} members
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            ))}
            {departments.length === 0 && (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No departments found.</Text>
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
  hod: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  divider: { height: 1, marginVertical: 16 },
  cardFooter: { flexDirection: 'row' },
  statBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});
