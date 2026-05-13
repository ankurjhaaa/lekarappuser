import { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import { ridesAPI } from '../../../src/api/rides';
import useRideStore from '../../../src/store/rideStore';
import useAuthStore from '../../../src/store/authStore';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.015;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { nearbyDrivers, setNearbyDrivers, setPickup } = useRideStore();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCurrentLocation(coords);
      setLoading(false);

      // Fetch nearby drivers
      try {
        const res = await ridesAPI.nearbyDrivers(coords.latitude, coords.longitude);
        if (res.data.success) setNearbyDrivers(res.data.drivers || []);
      } catch (e) { /* silent */ }

      // Check active ride
      try {
        const res = await ridesAPI.getActive();
        if (res.data.booking) setActiveBooking(res.data.booking);
      } catch (e) { /* silent */ }
    })();
  }, []);

  // Animate bottom card
  useEffect(() => {
    if (!loading) {
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
    }
  }, [loading]);

  // Refresh nearby drivers periodically
  useEffect(() => {
    if (!currentLocation) return;
    const interval = setInterval(async () => {
      try {
        const res = await ridesAPI.nearbyDrivers(currentLocation.latitude, currentLocation.longitude);
        if (res.data.success) setNearbyDrivers(res.data.drivers || []);
      } catch (e) { /* silent */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [currentLocation]);

  const handleWhereToPress = () => {
    if (currentLocation) {
      setPickup({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        address: 'Current Location',
      });
    }
    router.push('/(main)/search-location');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentLocation ? {
          ...currentLocation,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        } : {
          latitude: 25.6117, longitude: 85.1441, // Patna fallback
          latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={mapStyle}
      >
        {/* Nearby Driver Markers */}
        {nearbyDrivers.map((driver, index) => (
          <Marker
            key={`driver-${driver.user_id || index}`}
            coordinate={{ latitude: driver.lat, longitude: driver.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <Ionicons
                name={driver.vehicle_type === 'cab' ? 'car' : driver.vehicle_type === 'auto' ? 'car-sport' : 'bicycle'}
                size={16} color={COLORS.white}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Header */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.headerRow}>
          <View style={styles.greeting}>
            <Text style={styles.greetingHi}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
            <Text style={styles.greetingSubtext}>Where are you going?</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationBtn}
        onPress={() => {
          if (currentLocation && mapRef.current) {
            mapRef.current.animateToRegion({
              ...currentLocation,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }, 500);
          }
        }}
      >
        <Ionicons name="locate" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Bottom Card */}
      <Animated.View style={[styles.bottomCard, { transform: [{ translateY: slideAnim }] }]}>
        {/* Active ride banner */}
        {activeBooking && (
          <TouchableOpacity
            style={styles.activeRideBanner}
            onPress={() => router.push({ pathname: '/(main)/ride-detail', params: { bookingId: activeBooking.id } })}
          >
            <Ionicons name="navigate" size={18} color={COLORS.white} />
            <Text style={styles.activeRideText}>Active ride in progress • Tap to view</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Where to? Search bar */}
        <TouchableOpacity style={styles.searchBar} onPress={handleWhereToPress} activeOpacity={0.8}>
          <View style={styles.searchDot} />
          <Text style={styles.searchText}>Where to?</Text>
          <View style={styles.searchTimeTag}>
            <Ionicons name="time" size={14} color={COLORS.textSecondary} />
            <Text style={styles.searchTimeText}>Now</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn}>
            <View style={[styles.quickIcon, { backgroundColor: '#EBF5FF' }]}>
              <Ionicons name="home" size={18} color="#1877F2" />
            </View>
            <Text style={styles.quickLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn}>
            <View style={[styles.quickIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="briefcase" size={18} color="#E65100" />
            </View>
            <Text style={styles.quickLabel}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn}>
            <View style={[styles.quickIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="star" size={18} color="#2E7D32" />
            </View>
            <Text style={styles.quickLabel}>Saved</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// Minimal clean map style
const mapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: SIZES.md, color: COLORS.textSecondary },

  // Top bar
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'transparent' },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingTop: Platform.OS === 'android' ? 44 : 8, paddingBottom: 8,
  },
  greeting: {},
  greetingHi: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  greetingSubtext: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.small,
  },

  // My location button
  myLocationBtn: {
    position: 'absolute', right: 16, bottom: 260,
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium,
  },

  // Driver markers
  driverMarker: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white,
  },

  // Bottom card
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.padding, paddingTop: SIZES.paddingLg, paddingBottom: 30,
    ...SHADOWS.large,
  },

  // Active ride
  activeRideBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: SIZES.radius, marginBottom: 16, gap: 8,
  },
  activeRideText: { flex: 1, color: COLORS.white, fontSize: SIZES.sm, fontWeight: '600' },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg,
    paddingHorizontal: 16, paddingVertical: 18, borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginRight: 12 },
  searchText: { flex: 1, fontSize: SIZES.base, color: COLORS.textSecondary, fontWeight: '500' },
  searchTimeTag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: SIZES.radiusSm, gap: 4,
  },
  searchTimeText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
});
