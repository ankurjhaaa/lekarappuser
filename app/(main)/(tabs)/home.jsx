import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ridesAPI } from '../../../src/api/rides';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../../src/components/MapViewSafe';
import SavedLocationModal from '../../../src/components/SavedLocationModal';
import { COLORS, SHADOWS, SIZES } from '../../../src/constants/theme';
import useAuthStore from '../../../src/store/authStore';
import useRideStore from '../../../src/store/rideStore';
import useUserStore from '../../../src/store/userStore';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.015;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { nearbyDrivers, setNearbyDrivers, setPickup, setDrop } = useRideStore();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  const { savedPlaces, fetchSavedPlaces, addSavedPlace } = useUserStore();
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Fetch saved places on mount
  useEffect(() => {
    fetchSavedPlaces();
  }, []);

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

      // Get Address for current location
      try {
        const res = await placesAPI.reverseGeocode(coords.latitude, coords.longitude);
        if (res.data.success) setCurrentAddress(res.data.address);
      } catch (e) { /* silent */ }
    })();
  }, []);

  // Animate map to current location once fetched
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000);
    }
  }, [currentLocation]);

  // No longer need a separate loading effect for the slide animation if initialized to 0

  // Refresh nearby drivers periodically — but NOT during active rides
  useEffect(() => {
    if (!currentLocation || activeBooking) return;
    const interval = setInterval(async () => {
      try {
        const res = await ridesAPI.nearbyDrivers(currentLocation.latitude, currentLocation.longitude);
        if (res.data.success) setNearbyDrivers(res.data.drivers || []);
      } catch (e) { /* silent */ }
    }, 30000); // 30s is enough for nearby drivers
    return () => clearInterval(interval);
  }, [currentLocation, activeBooking]);

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

  const handleQuickAction = (type) => {
    if (type === 'saved') {
      router.push('/(main)/search-location');
      return;
    }

    const place = savedPlaces.find(p => p.label.toLowerCase() === type.toLowerCase());
    if (place) {
      // Initiate ride to saved place
      if (currentLocation) {
        setPickup({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          address: 'Current Location',
        });
        setDrop({
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lng),
          address: place.address,
        });
        router.push('/(main)/ride-detail');
      }
    } else {
      // Set the location with current address as default
      setModalInitialData({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        address: currentAddress || 'Current Location',
        lat: currentLocation?.latitude,
        lng: currentLocation?.longitude,
        locked: true // Flag to indicate address shouldn't be edited
      });
      setModalVisible(true);
    }
  };

  const onSaveLocation = async (data) => {
    try {
      await addSavedPlace(data);
      setModalVisible(false);
    } catch (e) {
      alert('Failed to save location');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mapWrapper}>
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
          {/* Nearby Driver Markers — hide during active ride */}
          {!activeBooking && nearbyDrivers.map((driver, index) => (
            <Marker
              key={`driver-${driver.user_id || index}`}
              coordinate={{ latitude: driver.lat, longitude: driver.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.driverMarker}>
                <Ionicons
                  name={driver.vehicle_type === 'cab' ? 'car' : driver.vehicle_type === 'auto' ? 'car-sport' : 'bicycle'}
                  size={14} color={COLORS.white}
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Map Loading Overlay (Transparent) */}
        {loading && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.mapLoadingText}>Fetching your location...</Text>
          </View>
        )}
      </View>

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
          <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickAction('home')}>
            <View style={[styles.quickIcon, { backgroundColor: COLORS.primary + '12' }]}>
              <Ionicons name="home" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.quickLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickAction('work')}>
            <View style={[styles.quickIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="briefcase" size={18} color="#E65100" />
            </View>
            <Text style={styles.quickLabel}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickAction('saved')}>
            <View style={[styles.quickIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="star" size={18} color="#2E7D32" />
            </View>
            <Text style={styles.quickLabel}>Saved</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <SavedLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={onSaveLocation}
        initialData={modalInitialData}
      />
    </SafeAreaView>
  );
}

// Minimal clean map style
const mapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  mapWrapper: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white instead of solid gray
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapLoadingText: { marginTop: 10, fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: SIZES.md, color: COLORS.textSecondary },

  // Lekar Header
  lekarHeader: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 10,
    paddingBottom: 14,
    zIndex: 100, // Ensure header is always on top
  },
  menuBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lekarLogo: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    fontStyle: 'italic',
  },
  notifBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // My location button
  myLocationBtn: {
    position: 'absolute', right: 16, bottom: 260,
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium,
  },

  // Driver markers
  driverMarker: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.text,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white,
  },

  // Bottom card
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.padding, paddingTop: SIZES.paddingLg, paddingBottom: 30,
    ...SHADOWS.large,
    zIndex: 100, // Ensure bottom card is always on top of map loading overlay
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
