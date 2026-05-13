import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { ridesAPI } from '../../src/api/rides';
import { placesAPI } from '../../src/api/places';
import useRideStore from '../../src/store/rideStore';
import { decodePolyline, formatCurrency, formatDuration, formatDistance } from '../../src/utils/helpers';
import { subscribeToBooking, unsubscribeFromBooking, initWebSocket } from '../../src/services/socket';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

export default function RideDetailScreen() {
  const params = useLocalSearchParams();
  const {
    pickup, drop, distance, duration, fare, vehicleType,
    setRoute, setVehicleType, setActiveBooking, setEstimates,
    estimates, clearRide, rideStatus, activeBooking, otpCode,
    driver, driverLocation, setDriverLocation, updateFromEvent,
  } = useRideStore();

  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleType || 'bike');
  const [currentBooking, setCurrentBooking] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [driverHeading, setDriverHeading] = useState(0);
  const mapRef = useRef(null);
  const pollRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(200)).current;

  // Load directions + estimates on mount
  useEffect(() => {
    loadRoute();
    loadVehicles();
    if (params.bookingId) loadBooking(params.bookingId);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (params.bookingId) unsubscribeFromBooking(params.bookingId);
    };
  }, []);

  // Animate bottom sheet
  useEffect(() => {
    if (!loading) {
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
    }
  }, [loading]);

  const loadRoute = async () => {
    if (!pickup?.lat || !drop?.lat) { setLoading(false); return; }
    try {
      const res = await placesAPI.directions(pickup.lat, pickup.lng, drop.lat, drop.lng);
      if (res.data.success) {
        setRoute(res.data.distance_km, res.data.duration_min, res.data.geometry);
        if (res.data.geometry) {
          const coords = decodePolyline(res.data.geometry);
          setRouteCoords(coords);
          // Fit map to route
          setTimeout(() => {
            if (mapRef.current && coords.length > 0) {
              mapRef.current.fitToCoordinates(coords, {
                edgePadding: { top: 100, right: 60, bottom: 300, left: 60 },
                animated: true,
              });
            }
          }, 500);
        }
      }
    } catch (e) { console.error('Directions error:', e); }
    setLoading(false);
  };

  const loadVehicles = async () => {
    try {
      const res = await ridesAPI.getVehicles();
      if (res.data.success) setVehicles(res.data.vehicles || []);
    } catch (e) { /* silent */ }

    if (pickup?.lat && drop?.lat) {
      try {
        const res = await ridesAPI.estimate({
          pickup_lat: pickup.lat, pickup_lng: pickup.lng,
          drop_lat: drop.lat, drop_lng: drop.lng,
          distance_km: distance || 5,
        });
        if (res.data.success) setEstimates(res.data.estimates || []);
      } catch (e) { /* silent */ }
    }
  };

  const loadBooking = async (id) => {
    try {
      const res = await ridesAPI.getStatus(id);
      if (res.data.success) {
        setCurrentBooking(res.data.booking);
        setBookingStatus(res.data.booking.status);
        setDriverInfo(res.data.driver_profile);
        if (res.data.driver_location) setDriverLoc(res.data.driver_location);
        startPolling(id);
        startWebSocket(id);
      }
    } catch (e) { /* silent */ }
  };

  const startPolling = (bookingId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await ridesAPI.getStatus(bookingId);
        if (res.data.success) {
          setBookingStatus(res.data.booking.status);
          setCurrentBooking(res.data.booking);
          setDriverInfo(res.data.driver_profile);
          if (res.data.driver_location) setDriverLoc(res.data.driver_location);
          if (['ride_completed', 'canceled', 'no_driver_available'].includes(res.data.booking.status)) {
            clearInterval(pollRef.current);
          }
        }
      } catch (e) { /* silent */ }
    }, 5000);
  };

  const startWebSocket = async (bookingId) => {
    await initWebSocket();
    subscribeToBooking(
      bookingId,
      // Status updates (accept, arrive, OTP, start, complete, cancel)
      (data) => {
        console.log('[WS] Status update:', data.status);
        setBookingStatus(data.status);
        setCurrentBooking((prev) => ({ ...prev, ...data }));
        updateFromEvent(data);
        // Update driver location from status event if available
        if (data.driver_lat && data.driver_lng) {
          setDriverLoc({ lat: data.driver_lat, lng: data.driver_lng });
        }
        // Stop polling on terminal states
        if (['ride_completed', 'canceled', 'no_driver_available'].includes(data.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      },
      // Live driver GPS location (every ~5-8s)
      (locData) => {
        setDriverLoc({ lat: locData.lat, lng: locData.lng });
        setDriverHeading(locData.heading || 0);
      }
    );
  };

  const handleBook = async () => {
    if (!pickup?.lat || !drop?.lat) {
      Alert.alert('Error', 'Please select pickup and drop locations.');
      return;
    }
    setBooking(true);
    try {
      const res = await ridesAPI.book({
        pickup_location: pickup.address,
        drop_location: drop.address,
        pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        drop_lat: drop.lat, drop_lng: drop.lng,
        distance_km: distance, duration_min: duration,
        vehicle_type: selectedVehicle,
        route_geometry: useRideStore.getState().routeGeometry,
      });
      if (res.data.success) {
        const bk = res.data.booking;
        setCurrentBooking(bk);
        setBookingStatus(bk.status);
        setActiveBooking(bk);
        startPolling(bk.id);
        startWebSocket(bk.id);
      } else {
        Alert.alert('Error', res.data.message || 'Booking failed.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Booking failed.');
    }
    setBooking(false);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Ride', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await ridesAPI.cancel(currentBooking.id, 'Changed my mind');
          clearRide();
          router.replace('/(main)/(tabs)/home');
        } catch (e) { Alert.alert('Error', 'Failed to cancel.'); }
      }},
    ]);
  };

  // ── SOS Emergency ──
  const handleSOS = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will alert our safety team immediately. Are you in danger?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Send SOS', style: 'destructive', onPress: async () => {
            try {
              let loc = null;
              try {
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              } catch (e) { /* location not available */ }

              await ridesAPI.triggerSos({
                booking_id: currentBooking.id,
                lat: loc?.lat || null,
                lng: loc?.lng || null,
              });
              Alert.alert('SOS Sent ✓', 'Our safety team has been alerted. Stay safe.');
            } catch (e) {
              Alert.alert('Error', 'Failed to send SOS. Please call emergency services directly.');
            }
          },
        },
      ]
    );
  };

  const getSelectedFare = () => {
    const est = estimates.find(e => (e.vehicle?.name || '').toLowerCase() === selectedVehicle.toLowerCase());
    return est?.fare || fare || 0;
  };

  const getVehicleIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'cab') return 'car';
    if (t === 'auto') return 'car-sport';
    return 'bicycle';
  };

  // Status-specific UI
  const renderStatusUI = () => {
    if (!bookingStatus) return null;

    if (bookingStatus === 'searching_driver') {
      return (
        <View style={styles.statusCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.statusTitle}>Looking for your driver...</Text>
          <Text style={styles.statusSubtext}>This usually takes 1-3 minutes</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (['driver_enroute', 'arrived_at_pickup', 'driver_assigned'].includes(bookingStatus)) {
      return (
        <View style={styles.statusCard}>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={24} color={COLORS.white} />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{currentBooking?.driver?.name || 'Driver'}</Text>
              <Text style={styles.driverVehicle}>{driverInfo?.vehicle_name || ''} • {driverInfo?.number_plate || ''}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={COLORS.accent} />
                <Text style={styles.ratingText}>{driverInfo?.rating || '5.0'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={20} color={COLORS.success} />
            </TouchableOpacity>
          </View>
          <View style={styles.statusBanner}>
            <Ionicons
              name={bookingStatus === 'arrived_at_pickup' ? 'checkmark-circle' : 'navigate'}
              size={18} color={COLORS.white}
            />
            <Text style={styles.statusBannerText}>
              {bookingStatus === 'arrived_at_pickup' ? 'Driver has arrived!' : 'Driver is on the way'}
            </Text>
          </View>
          {bookingStatus === 'arrived_at_pickup' && currentBooking?.otp_code && (
            <View style={styles.otpCard}>
              <Text style={styles.otpLabel}>Share this OTP with driver</Text>
              <Text style={styles.otpCode}>{currentBooking.otp_code}</Text>
            </View>
          )}
        </View>
      );
    }

    if (bookingStatus === 'ride_started') {
      return (
        <View style={styles.statusCard}>
          <View style={styles.ridingBanner}>
            <Ionicons name="navigate" size={20} color={COLORS.white} />
            <Text style={styles.ridingText}>Ride in progress</Text>
          </View>
          <View style={styles.ridingInfo}>
            <View style={styles.ridingInfoItem}>
              <Text style={styles.ridingLabel}>Destination</Text>
              <Text style={styles.ridingValue} numberOfLines={1}>{drop?.address || currentBooking?.drop_location}</Text>
            </View>
            <View style={styles.ridingInfoItem}>
              <Text style={styles.ridingLabel}>Fare</Text>
              <Text style={styles.ridingValue}>{formatCurrency(currentBooking?.fare_total)}</Text>
            </View>
          </View>
          {/* SOS Button */}
          <TouchableOpacity style={styles.sosBtn} onPress={handleSOS} activeOpacity={0.7}>
            <Ionicons name="warning" size={18} color={COLORS.white} />
            <Text style={styles.sosBtnText}>SOS Emergency</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (bookingStatus === 'ride_completed') {
      return (
        <View style={styles.statusCard}>
          <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
          <Text style={styles.statusTitle}>Ride Completed!</Text>
          <Text style={styles.completedFare}>{formatCurrency(currentBooking?.fare_total)}</Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => { clearRide(); router.replace('/(main)/(tabs)/home'); }}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (bookingStatus === 'no_driver_available' || bookingStatus === 'canceled') {
      return (
        <View style={styles.statusCard}>
          <Ionicons name="close-circle" size={48} color={COLORS.error} />
          <Text style={styles.statusTitle}>
            {bookingStatus === 'no_driver_available' ? 'No drivers available' : 'Ride Cancelled'}
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => { clearRide(); router.replace('/(main)/(tabs)/home'); }}
          >
            <Text style={styles.doneBtnText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: pickup?.lat || 25.6117, longitude: pickup?.lng || 85.1441,
          latitudeDelta: 0.03, longitudeDelta: 0.03,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Pickup/Vehicle Marker */}
        {pickup?.lat && (
          <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}>
            <View style={styles.driverMapMarker}>
              <Ionicons name={getVehicleIcon(selectedVehicle)} size={20} color={COLORS.white} />
            </View>
          </Marker>
        )}

        {/* Drop Marker */}
        {drop?.lat && (
          <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }}>
            <View style={styles.dropMarker}><Ionicons name="location" size={24} color={COLORS.primary} /></View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor={COLORS.primary} strokeWidth={4} />
        )}

        {/* Driver Marker with heading */}
        {driverLoc && (
          <Marker
            coordinate={{ latitude: driverLoc.lat, longitude: driverLoc.lng }}
            rotation={driverHeading}
            flat
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMapMarker}>
              <Ionicons name="car" size={18} color={COLORS.white} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Back button */}
      <SafeAreaView style={styles.topOverlay}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Panel */}
      <Animated.View style={[styles.bottomPanel, { transform: [{ translateY: slideAnim }] }]}>
        {bookingStatus ? (
          renderStatusUI()
        ) : (
          <>
            {/* Route info */}
            <View style={styles.routeInfo}>
              <View style={styles.routeItem}>
                <Text style={styles.routeValue}>{formatDistance(distance)}</Text>
                <Text style={styles.routeLabel}>Distance</Text>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.routeItem}>
                <Text style={styles.routeValue}>{formatDuration(duration)}</Text>
                <Text style={styles.routeLabel}>Duration</Text>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.routeItem}>
                <Text style={[styles.routeValue, { color: COLORS.primary }]}>{formatCurrency(getSelectedFare())}</Text>
                <Text style={styles.routeLabel}>Fare</Text>
              </View>
            </View>

            {/* Vehicle Selection */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
              {(estimates.length > 0 ? estimates : [
                { vehicle: { name: 'Bike' }, fare: 0 },
                { vehicle: { name: 'Auto' }, fare: 0 },
                { vehicle: { name: 'Cab' }, fare: 0 },
              ]).map((est, i) => {
                const name = est.vehicle?.name || 'Bike';
                const isSelected = name.toLowerCase() === selectedVehicle.toLowerCase();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                    onPress={() => setSelectedVehicle(name.toLowerCase())}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={getVehicleIcon(name)} size={28} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.vehicleName, isSelected && styles.vehicleNameSelected]}>{name}</Text>
                    <Text style={[styles.vehicleFare, isSelected && styles.vehicleFareSelected]}>
                      {est.fare ? formatCurrency(est.fare) : '--'}
                    </Text>
                    {est.eta_min && <Text style={styles.vehicleEta}>{est.eta_min} min</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Book Button */}
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={handleBook}
              disabled={booking || !drop?.lat}
              activeOpacity={0.8}
            >
              {booking ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.bookBtnText}>Book {selectedVehicle.charAt(0).toUpperCase() + selectedVehicle.slice(1)} • {formatCurrency(getSelectedFare())}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', marginLeft: 16, marginTop: 8, ...SHADOWS.medium,
  },

  pickupMarker: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.success + '30',
    justifyContent: 'center', alignItems: 'center',
  },
  pickupDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  dropMarker: { alignItems: 'center' },
  driverMapMarker: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white,
  },

  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl, paddingHorizontal: SIZES.padding,
    paddingTop: 20, paddingBottom: 34, ...SHADOWS.large,
  },

  routeInfo: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  routeItem: { alignItems: 'center' },
  routeValue: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  routeLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  routeDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  vehicleScroll: { marginTop: 16, marginBottom: 16 },
  vehicleCard: {
    width: 100, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8,
    borderRadius: SIZES.radius, borderWidth: 2, borderColor: COLORS.border,
    marginRight: 10, backgroundColor: COLORS.white,
  },
  vehicleCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  vehicleName: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: 6 },
  vehicleNameSelected: { color: COLORS.primary },
  vehicleFare: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  vehicleFareSelected: { color: COLORS.primary },
  vehicleEta: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },

  bookBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: SIZES.radius,
    alignItems: 'center', ...SHADOWS.medium,
  },
  bookBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },

  // Status UI
  statusCard: { alignItems: 'center', paddingVertical: 20 },
  statusTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  statusSubtext: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  cancelBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.error },
  cancelBtnText: { color: COLORS.error, fontWeight: '600' },

  driverCard: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    padding: 16, backgroundColor: COLORS.inputBg, borderRadius: SIZES.radius, marginBottom: 12,
  },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  driverDetails: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  driverVehicle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.success + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%',
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: SIZES.radius,
  },
  statusBannerText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '600' },

  otpCard: {
    alignItems: 'center', marginTop: 12, backgroundColor: COLORS.inputBg,
    paddingVertical: 16, paddingHorizontal: 24, borderRadius: SIZES.radius, width: '100%',
  },
  otpLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  otpCode: { fontSize: 32, fontWeight: '800', color: COLORS.primary, letterSpacing: 8, marginTop: 4 },

  ridingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%',
    backgroundColor: COLORS.success, paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: SIZES.radius,
  },
  ridingText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
  ridingInfo: { width: '100%', marginTop: 12, gap: 8 },
  ridingInfoItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  ridingLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  ridingValue: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },

  completedFare: { fontSize: 36, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
  doneBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: SIZES.radius, marginTop: 20,
  },
  doneBtnText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },

  // SOS
  sosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DC2626', paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: SIZES.radius, marginTop: 16, width: '100%',
  },
  sosBtnText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700', letterSpacing: 1 },
});
