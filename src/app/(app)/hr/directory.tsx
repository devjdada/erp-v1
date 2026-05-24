import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Users, Mail, Phone } from 'lucide-react-native';
import { hrService } from '@/services/hrService';

export default function HRDirectory() {
  const theme = useTheme();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDirectory();
  }, []);

  const loadDirectory = async () => {
    try {
      setLoading(true);
      const res = await hrService.getDirectory();
      setStaff(res.data?.data || res.data || []);
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
          <Text style={[styles.title, { color: theme.text }]}>Staff Directory</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Company-wide employee directory</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <View style={styles.listContainer}>
            {staff.map((employee: any, index: number) => (
              <View 
                key={employee.id || index} 
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
                    <Text style={[styles.name, { color: theme.text }]}>{employee.full_name || employee.name}</Text>
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
                  {employee.phone && (
                    <View style={styles.contactRow}>
                      <Phone color={theme.textSecondary} size={14} />
                      <Text style={[styles.contactText, { color: theme.textSecondary }]}>{employee.phone}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {staff.length === 0 && (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No staff found.</Text>
            )}
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  listContainer: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
});
