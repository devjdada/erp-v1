import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Compass, Navigation, MapPin, Truck } from 'lucide-react-native';

export default function FleetMap() {
  const theme = useTheme();

  const locations = [
    { id: '1', vehicle: 'Volvo FH16', lat: '40.7128° N', lng: '74.0060° W', speed: '55 mph', status: 'En Route to Boston' },
    { id: '2', vehicle: 'Ford Transit', lat: '34.0522° N', lng: '118.2437° W', speed: '25 mph', status: 'Delivering Package' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>GPS Tracking</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Real-time location monitoring of active dispatch.</Text>
        </View>

        {/* Map Placeholder Container */}
        <View style={[styles.mapContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={[styles.mapGrid, { borderColor: theme.border }]}>
            {/* Visual simulation of map tracks */}
            <View style={[styles.mapTrack, { borderColor: theme.primary, borderLeftWidth: 2, borderBottomWidth: 2, top: 40, left: 40, width: '70%', height: '40%' }]} />
            <View style={[styles.mapTrackSecondary, { borderColor: theme.textSecondary, borderTopWidth: 1, borderRightWidth: 1, top: 100, left: 20, width: '50%', height: '30%', borderStyle: 'dashed' }]} />
            
            {/* Markers */}
            <View style={[styles.marker, { top: 40, left: 40, backgroundColor: theme.backgroundElement, borderColor: theme.primary }]}>
              <Truck color={theme.primary} size={16} />
            </View>
            <View style={[styles.marker, { top: 120, left: 200, backgroundColor: theme.backgroundElement, borderColor: theme.primary }]}>
              <Navigation color={theme.primary} size={16} style={{ transform: [{ rotate: '45deg' }] }} />
            </View>
            
            <View style={styles.compassOverlay}>
              <Compass color={theme.text} size={28} />
            </View>
          </View>
          <Text style={[styles.mapFooterText, { color: theme.textSecondary }]}>GPS Simulator Mode • Map API Connected</Text>
        </View>

        {/* Details List */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Dispatches</Text>
          <View style={styles.detailsList}>
            {locations.map(loc => (
              <View 
                key={loc.id} 
                style={[
                  styles.detailsCard, 
                  { 
                    backgroundColor: theme.backgroundElement, 
                    borderColor: theme.border, 
                    borderWidth: 1 
                  }
                ]}
              >
                <View style={styles.detailsHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MapPin color={theme.primary} size={18} />
                    <Text style={[styles.vehicleName, { color: theme.text }]}>{loc.vehicle}</Text>
                  </View>
                  <Text style={[styles.speedText, { color: theme.primary }]}>{loc.speed}</Text>
                </View>
                <View style={styles.detailsBody}>
                  <Text style={[styles.locCoords, { color: theme.textSecondary }]}>
                    Coords: {loc.lat}, {loc.lng}
                  </Text>
                  <Text style={[styles.locStatus, { color: theme.text }]}>
                    Status: {loc.status}
                  </Text>
                </View>
              </View>
            ))}
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
  mapContainer: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    justifyContent: 'space-between',
    padding: 12,
  },
  mapGrid: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  mapTrack: {
    position: 'absolute',
    opacity: 0.6,
  },
  mapTrackSecondary: {
    position: 'absolute',
    opacity: 0.3,
  },
  marker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compassOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    opacity: 0.8,
  },
  mapFooterText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 20,
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
  speedText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  detailsBody: {
    gap: 4,
  },
  locCoords: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
  },
  locStatus: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
});
