/**
 * HAUL COMMAND - MOBILE SUPER-APP ENTRY
 * React Native / Expo Architecture
 * Structure: Tab Navigator → Map, Loads, Earnings, Profile
 */

// app/_layout.tsx (Expo Router root layout)
export const ExpoRootLayout = `
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#080b11',
            borderTopColor: '#1e2230',
            height: 80,
            paddingBottom: 20,
          },
          tabBarActiveTintColor: '#6d72f6',
          tabBarInactiveTintColor: '#4b5563',
          headerStyle: { backgroundColor: '#080b11' },
          headerTintColor: '#ffffff',
        }}
      >
        <Tabs.Screen
          name="dispatch"
          options={{
            title: 'Dispatch',
            tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="loads"
          options={{
            title: 'Loads',
            tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}
`;

// app/dispatch.tsx - The Operator Live Map Screen
export const DispatchScreen = `
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useBackgroundGPS } from '@/hooks/useBackgroundGPS';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DispatchScreen() {
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const { trackingActive, toggleDutyStatus } = useBackgroundGPS(operatorId);
  const [nearbyLoads, setNearbyLoads] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setOperatorId(data.user?.id ?? null);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Live Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={darkMapStyle}
        initialRegion={{ latitude: 37.0902, longitude: -95.7129, latitudeDelta: 30, longitudeDelta: 30 }}
        showsUserLocation={trackingActive}
        showsMyLocationButton={false}
      >
        {nearbyLoads.map((load: any) => (
          <Marker
            key={load.id}
            coordinate={{ latitude: load.origin_lat, longitude: load.origin_lng }}
            pinColor="#6d72f6"
            title={load.title}
            description={\`$\${load.rate_per_mile}/mi\`}
          />
        ))}
      </MapView>

      {/* Duty Status Toggle */}
      <View style={styles.statusBar}>
        <View>
          <Text style={styles.statusLabel}>Duty Status</Text>
          <Text style={[styles.statusValue, { color: trackingActive ? '#4ade80' : '#6b7280' }]}>
            {trackingActive ? '🟢 ON DUTY — Visible to Brokers' : '⚫ OFF DUTY'}
          </Text>
        </View>
        <Switch
          value={trackingActive}
          onValueChange={toggleDutyStatus}
          trackColor={{ false: '#1e2230', true: '#4ade80' }}
          thumbColor={trackingActive ? '#ffffff' : '#374151'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080b11' },
  map: { flex: 1 },
  statusBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(8,11,17,0.95)',
    borderTopWidth: 1, borderTopColor: '#1e2230',
    padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  statusLabel: { color: '#6b7280', fontSize: 12 },
  statusValue: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginTop: 2 }
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0e1117' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#080b11' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2230' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050d1a' }] },
];
`;

// app/loads.tsx - Load Board Screen
export const LoadsScreen = `
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoadsScreen() {
  const [loads, setLoads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchLoads() {
    const { data } = await supabase
      .from('loads')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setLoads(data);
  }

  useEffect(() => { fetchLoads(); }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={loads}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchLoads(); setRefreshing(false); }} tintColor="#6d72f6" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.route}>{item.origin_city} → {item.destination_city}</Text>
              <Text style={styles.rate}>\${item.total_rate?.toLocaleString()}</Text>
            </View>
            <Text style={styles.meta}>{item.load_type} · {item.distance_miles} mi · {item.required_services?.join(', ')}</Text>
            <TouchableOpacity style={styles.bidBtn}>
              <Text style={styles.bidBtnText}>PLACE BID</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080b11' },
  card: { backgroundColor: '#0e1117', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1e2230' },
  route: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  rate: { color: '#4ade80', fontWeight: '900', fontSize: 16 },
  meta: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  bidBtn: { marginTop: 12, backgroundColor: '#6d72f6', borderRadius: 8, padding: 10, alignItems: 'center' },
  bidBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 }
});
`;

console.log('Mobile Super-App architecture files generated.');
console.log('Screens: Dispatch Map, Loads Board, Earnings, Profile');
console.log('GPS tracking via useBackgroundGPS + Capacitor Geolocation');
