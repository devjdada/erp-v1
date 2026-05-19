import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react-native';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  plateNumber: string;
  status: 'Active' | 'In Service' | 'Offline';
  fuel: string;
}

export default function FleetVehicles() {
  const theme = useTheme();

  const vehicles: Vehicle[] = [
    { id: '1', name: 'Volvo FH16 Heavy Duty', type: 'Truck', plateNumber: 'TX-892-PL', status: 'Active', fuel: '82%' },
    { id: '2', name: 'Scania R500 Cargo', type: 'Truck', plateNumber: 'NY-442-KK', status: 'In Service', fuel: '45%' },
    { id: '3', name: 'Ford Transit Custom', type: 'Van', plateNumber: 'SF-109-AA', status: 'Active', fuel: '95%' },
    { id: '4', name: 'Mercedes-Benz Actros', type: 'Truck', plateNumber: 'LA-992-ZZ', status: 'Offline', fuel: '12%' },
  ];

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Active':
        return theme.primary;
      case 'In Service':
        return '#EAB308';
      case 'Offline':
        return theme.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Fleet Inventory</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Monitor and manage all company vehicles.</Text>
        </View>

        <View style={styles.listContainer}>
          {vehicles.map(vehicle => (
            <View 
              key={vehicle.id} 
              style={[
                styles.vehicleCard, 
                { 
                  backgroundColor: theme.backgroundElement, 
                  borderColor: theme.border, 
                  borderWidth: 1 
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.vehicleName, { color: theme.text }]}>{vehicle.name}</Text>
                  <Text style={[styles.vehicleDetails, { color: theme.textSecondary }]}>
                    {vehicle.type} • {vehicle.plateNumber}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: theme.backgroundSelected }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(vehicle.status) }]} />
                  <Text style={[styles.statusText, { color: theme.text }]}>{vehicle.status}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.cardFooter}>
                <Text style={[styles.footerInfo, { color: theme.textSecondary }]}>
                  Fuel Level: <Text style={{ color: theme.text, fontWeight: '600' }}>{vehicle.fuel}</Text>
                </Text>
                {vehicle.status === 'Active' ? (
                  <View style={styles.actionIndicator}>
                    <ShieldCheck color={theme.primary} size={16} />
                    <Text style={[styles.actionText, { color: theme.primary }]}>Operational</Text>
                  </View>
                ) : vehicle.status === 'In Service' ? (
                  <View style={styles.actionIndicator}>
                    <RefreshCw color="#EAB308" size={16} />
                    <Text style={[styles.actionText, { color: '#EAB308' }]}>Maintenance</Text>
                  </View>
                ) : (
                  <View style={styles.actionIndicator}>
                    <AlertCircle color={theme.textSecondary} size={16} />
                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>Resting</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
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
  vehicleCard: {
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  vehicleDetails: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfo: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
});
