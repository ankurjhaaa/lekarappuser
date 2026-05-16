import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { placesAPI } from '../../src/api/places';
import { ridesAPI } from '../../src/api/rides';
import CustomModal from '../../src/components/CustomModal';
import LekarHeader from '../../src/components/LekarHeader';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../src/components/MapViewSafe';
import CancelModal from '../../src/components/ride/CancelModal';
import ChatModal from '../../src/components/ride/ChatModal';
import DriverDetailModal from '../../src/components/ride/DriverDetailModal';
import TripDetailModal from '../../src/components/ride/TripDetailModal';
import SidebarMenu from '../../src/components/SidebarMenu';
import { COLORS, SHADOWS, SIZES } from '../../src/constants/theme';
import { initWebSocket, subscribeToBooking, unsubscribeFromBooking } from '../../src/services/socket';
import useRideStore from '../../src/store/rideStore';
import { decodePolyline, formatCurrency } from '../../src/utils/helpers';

const { width, height } = Dimensions.get('window');

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
  const [driverETA, setDriverETA] = useState(null); // Minutes until driver arrives
  const [driverDistanceKm, setDriverDistanceKm] = useState(null); // km driver is away
  const [liveDistanceKm, setLiveDistanceKm] = useState(null); // live distance during ride
  const [liveETA, setLiveETA] = useState(null); // live ETA during ride
  const [rating, setRating] = useState(0);
  const [destLoading, setDestLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDriverDetail, setShowDriverDetail] = useState(false);
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [routeFetchedForStatus, setRouteFetchedForStatus] = useState('');
  const mapRef = useRef(null);
  const pollRef = useRef(null);
  const chatMsgRef = useRef(null);
  const bottomSheetRef = useRef(null);

  // Dynamic snap points based on status
  const snapPoints = useMemo(() => {
    if (!bookingStatus) return ['35%', '60%', '90%'];
    if (['searching_driver', 'driver_assigned'].includes(bookingStatus)) return ['30%', '55%', '85%'];
    if (['driver_enroute', 'arrived_at_pickup'].includes(bookingStatus)) return ['35%', '65%', '90%'];
    if (bookingStatus === 'ride_started') return ['30%', '60%', '90%'];
    if (bookingStatus === 'ride_completed') return ['45%', '75%', '90%'];
    return ['30%', '55%', '85%'];
  }, [bookingStatus]);

  // Load directions first, then estimates with real distance
  useEffect(() => {
    (async () => {
      await loadRoute();
      await loadVehicles();
    })();
    if (params.bookingId) loadBooking(params.bookingId);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (params.bookingId) unsubscribeFromBooking(params.bookingId);
    };
  }, []);

  // Listen for destination changes from search-location screen
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('change_destination_selected', (place) => {
      handleDestinationChange(place);
    });
    return () => sub.remove();
  }, [currentBooking, driverLoc]);

  // Update route geometry based on ride status
  useEffect(() => {
    if (!bookingStatus || !currentBooking) return;
    if (routeFetchedForStatus === bookingStatus && bookingStatus !== 'driver_enroute') return;

    const updateGeometry = async () => {
      try {
        if (['driver_enroute', 'arrived_at_pickup'].includes(bookingStatus) && driverLoc) {
          // Show driver → pickup route with live ETA
          const pLat = pickup?.lat || currentBooking.pickup_lat;
          const pLng = pickup?.lng || currentBooking.pickup_lng;
          const res = await placesAPI.directions(driverLoc.lat, driverLoc.lng, pLat, pLng);
          if (res.data.success) {
            setDriverDistanceKm(res.data.distance_km);
            setDriverETA(res.data.duration_min);
            if (res.data.geometry) {
              const coords = decodePolyline(res.data.geometry);
              setRouteCoords(coords);
              fitMapToCoords(coords);
            }
          }
          setRouteFetchedForStatus(bookingStatus);
        } else if (['ride_started', 'otp_verified'].includes(bookingStatus)) {
          // Show driver → destination route
          const fromLat = driverLoc?.lat || currentBooking.pickup_lat;
          const fromLng = driverLoc?.lng || currentBooking.pickup_lng;
          const toLat = currentBooking.drop_lat;
          const toLng = currentBooking.drop_lng;
          if (fromLat && toLat) {
            const res = await placesAPI.directions(fromLat, fromLng, toLat, toLng);
            if (res.data.success) {
              setLiveDistanceKm(res.data.distance_km);
              setLiveETA(res.data.duration_min);
              if (res.data.geometry) {
                const coords = decodePolyline(res.data.geometry);
                setRouteCoords(coords);
                fitMapToCoords(coords);
              }
            }
          }
          setRouteFetchedForStatus(bookingStatus);
        }
      } catch (e) { console.warn('Geometry update error:', e); }
    };

    updateGeometry();
  }, [bookingStatus, driverLoc]);

  const fitMapToCoords = (coords) => {
    setTimeout(() => {
      if (mapRef.current && coords.length > 0) {
        // Use small bottom padding since map is only 50% of screen
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }, 500);
  };

  const loadRoute = async () => {
    if (!pickup?.lat || !drop?.lat) { setLoading(false); return; }
    try {
      const res = await placesAPI.directions(pickup.lat, pickup.lng, drop.lat, drop.lng);
      if (res.data.success) {
        setRoute(res.data.distance_km, res.data.duration_min, res.data.geometry);
        if (res.data.geometry) {
          const coords = decodePolyline(res.data.geometry);
          setRouteCoords(coords);
          fitMapToCoords(coords);
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

    const storeState = useRideStore.getState();
    if (storeState.pickup?.lat && storeState.drop?.lat) {
      try {
        const realDist = storeState.distance || 5;
        const res = await ridesAPI.estimate({
          pickup_lat: storeState.pickup.lat, pickup_lng: storeState.pickup.lng,
          drop_lat: storeState.drop.lat, drop_lng: storeState.drop.lng,
          distance_km: realDist,
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

  const startPolling = (bookingId, initialStatus) => {
    if (pollRef.current) clearInterval(pollRef.current);
    // Fast polling during search (5s), moderate during active ride (15s)
    const st = initialStatus || bookingStatus || 'searching_driver';
    const interval = ['searching_driver', 'driver_assigned'].includes(st) ? 5000 : 15000;
    const poll = async () => {
      try {
        const res = await ridesAPI.getStatus(bookingId);
        if (res.data.success) {
          const newStatus = res.data.booking.status;
          const oldStatus = bookingStatus;
          setBookingStatus(newStatus);
          setCurrentBooking(res.data.booking);
          setDriverInfo(res.data.driver_profile);
          if (res.data.driver_location) setDriverLoc(res.data.driver_location);
          if (['ride_completed', 'canceled', 'no_driver_available'].includes(newStatus)) {
            clearInterval(pollRef.current);
          }
          // Restart polling with new interval when status transitions
          if (oldStatus !== newStatus && !['ride_completed', 'canceled', 'no_driver_available'].includes(newStatus)) {
            startPolling(bookingId, newStatus);
          }
        }
      } catch (e) { /* silent */ }
    };
    pollRef.current = setInterval(poll, interval);
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
        if (data.driver_profile) {
          setDriverInfo(data.driver_profile);
        }
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
      },
      // Chat messages
      (msg) => {
        if (chatMsgRef.current) chatMsgRef.current(msg);
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
        // Use loadBooking which sets up polling + websocket + fetches latest state
        loadBooking(bk.id);
      } else {
        Alert.alert('Error', res.data.message || 'Booking failed.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Booking failed.');
    }
    setBooking(false);
  };

  const handleCancel = () => setShowCancel(true);

  const confirmCancel = async (reason) => {
    try {
      await ridesAPI.cancel(currentBooking.id, reason);
      setShowCancel(false);
      clearRide();
      router.replace('/(main)/(tabs)/home');
    } catch (e) { /* silent */ }
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
    if (t === 'bike') return 'bicycle';
    if (t === 'auto') return 'car-sport';
    if (t === 'toto') return 'bus';
    if (t === 'car' || t === 'cab') return 'car';
    return 'car';
  };


  const handleDestinationChange = async (place) => {
    setDestLoading(true);
    try {
      const detailRes = await placesAPI.details(place.place_id);
      if (!detailRes.data.success) throw new Error('Failed');
      const newLat = detailRes.data.lat;
      const newLng = detailRes.data.lng;
      // Distance from DRIVER'S CURRENT LOCATION to new destination
      // Backend will add distance_traveled for cumulative fare
      const fromLat = driverLoc?.lat || currentBooking?.pickup_lat || pickup?.lat;
      const fromLng = driverLoc?.lng || currentBooking?.pickup_lng || pickup?.lng;

      const dirRes = await placesAPI.directions(fromLat, fromLng, newLat, newLng);
      const newDist = dirRes.data.distance_km || 5;
      const newDur = dirRes.data.duration_min || 0;
      // Call API
      const res = await ridesAPI.changeDestination(currentBooking.id, {
        new_drop_address: place.description,
        new_drop_lat: newLat,
        new_drop_lng: newLng,
        new_distance_km: newDist,
        new_duration_min: newDur,
        new_route_geometry: dirRes.data.geometry || '',
      });
      if (res.data.success) {
        setCurrentBooking(prev => ({ ...prev, ...res.data.booking, drop_location: place.description }));

        // Update local store so the map marker reflects the new destination!
        useRideStore.getState().setDrop({
          address: place.description,
          lat: newLat,
          lng: newLng,
        });

        setRouteFetchedForStatus('');
        if (dirRes.data.geometry) {
          const coords = decodePolyline(dirRes.data.geometry);
          setRouteCoords(coords);
          setLiveDistanceKm(newDist);
          setLiveETA(newDur);
        }
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change destination.');
    }
    setDestLoading(false);
  };

  // ── Status-specific UI (clean Rapido style) ──
  const renderStatusUI = () => {
    if (!bookingStatus) return null;

    // SEARCHING
    if (bookingStatus === 'searching_driver' || bookingStatus === 'driver_assigned') {
      const attempt = currentBooking?.current_attempt || 0;
      const total = currentBooking?.total_drivers_in_queue || 0;
      return (
        <>
          {/* Search animation card */}
          <View style={s.searchCard}>
            <View style={s.searchPulseOuter}>
              <View style={s.searchPulseInner}>
                <Ionicons name={getVehicleIcon(selectedVehicle)} size={36} color={COLORS.primary} />
              </View>
            </View>
            <Text style={s.searchTitle}>Finding your captain...</Text>
            <Text style={s.searchSubtitle}>Hang tight! We are connecting you with a nearby driver</Text>
            <View style={s.searchProgressBg}>
              <View style={[s.searchProgressFill, { width: total > 0 ? `${Math.min((attempt / total) * 100, 95)}%` : '30%' }]} />
            </View>
            {total > 0 && (
              <Text style={s.searchAttemptText}>
                {Math.min(attempt, total)} of {total} captains didn&apos;t accept your ride
              </Text>
            )}
          </View>

          {/* Fare card */}
          <View style={s.fareCard}>
            <Ionicons name={getVehicleIcon(selectedVehicle)} size={28} color={COLORS.textSecondary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.fareCardLabel}>Total Fare</Text>
              <Text style={s.fareCardValue}>{formatCurrency(currentBooking?.fare_total || fare)}</Text>
            </View>
            <TouchableOpacity style={s.tripDetailsBtn} onPress={() => setShowTripDetail(true)}>
              <Text style={s.tripDetailsBtnText}>Trip Details</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    // DRIVER ENROUTE / ARRIVED
    if (['driver_enroute', 'arrived_at_pickup'].includes(bookingStatus)) {
      const isArrived = bookingStatus === 'arrived_at_pickup';
      const driverDistStr = driverDistanceKm ? (driverDistanceKm < 1 ? Math.round(driverDistanceKm * 1000) + ' m' : driverDistanceKm.toFixed(1) + ' Kms') : '...';
      const otpChars = currentBooking?.otp_code ? String(currentBooking.otp_code).split('') : ['-', '-', '-', '-'];

      return (
        <View style={s.enrouteContainer}>
          {/* Top Handle */}
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 }} />
          </View>

          {/* Header Text */}
          <Text style={s.enrouteHeaderTitle}>
            {isArrived ? 'Your driver has arrived' : `Your driver is ${driverDistStr} away`}
          </Text>

          {/* Compact OTP - inline row */}
          <View style={s.enrouteOtpRow}>
            <Text style={s.enrouteOtpLabel}>Start OTP</Text>
            <View style={s.enrouteOtpBoxes}>
              {otpChars.map((d, i) => (
                <View key={i} style={s.enrouteOtpBox}>
                  <Text style={s.enrouteOtpText}>{d}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.enrouteDivider} />

          {/* Driver Info Section */}
          <TouchableOpacity
            style={s.enrouteDriverRow}
            onPress={() => setShowDriverDetail(true)}
            activeOpacity={0.8}
          >
            <View style={s.enrouteCarAvatarWrap}>
              <View style={[s.enrouteCarBox, { width: 70, height: 45 }]}>
                <Ionicons name="car-sport" size={48} color={COLORS.textLight} />
              </View>
              <View style={[s.enrouteAvatarBox, { bottom: -2, right: -2 }]}>
                <Ionicons name="person" size={14} color={COLORS.white} />
              </View>
            </View>

            <View style={s.enrouteDriverDetails}>
              <View style={[s.enrouteLicensePlate, { paddingVertical: 2, paddingHorizontal: 6 }]}>
                <Text style={[s.enrouteLicenseText, { fontSize: 12 }]}>{driverInfo?.number_plate || 'TN 57 BM 7317'}</Text>
              </View>
              <Text style={[s.enrouteDriverName, { fontSize: 16 }]}>{currentBooking?.driver?.name || currentBooking?.driver_name || 'Captain'}</Text>
              <Text style={[s.enrouteVehicleName, { fontSize: 12 }]}>{driverInfo?.vehicle_name || 'DZIRE(C) - WHITE'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* Destination Box */}
          <View style={[s.enrouteDestBox, { marginTop: 12, padding: 12 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={s.enrouteDestLabel}>Destination</Text>
              <Text style={[s.enrouteDestText, { fontSize: 14 }]} numberOfLines={1}>
                {currentBooking?.drop_location || drop?.address || 'Your Destination'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowTripDetail(true)} style={{ padding: 4 }}>
              <Text style={[s.enrouteTripDetailsText, { fontSize: 13, fontWeight: '600' }]}>Trip Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // RIDE STARTED
    if (bookingStatus === 'ride_started' || bookingStatus === 'otp_verified') {
      const etaMin = liveETA || currentBooking?.duration_min || '--';
      const distKm = liveDistanceKm || currentBooking?.distance_km;
      const distDisplay = distKm ? (distKm < 1 ? Math.round(distKm * 1000) + ' m' : parseFloat(distKm).toFixed(1) + ' km') : '--';
      return (
        <View style={s.enrouteContainer}>
          {/* Top Handle */}
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 }} />
          </View>

          {/* ETA header - matching enroute style */}
          <Text style={s.enrouteHeaderTitle}>
            {distDisplay} away • {etaMin} mins to destination
          </Text>

          {/* Destination Box with edit icon */}
          <View style={s.enrouteDestBox}>
            <View style={{ marginRight: 10 }}>
              <Ionicons name="flag" size={20} color={COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.enrouteDestLabel}>Drop to</Text>
              <Text style={s.enrouteDestText} numberOfLines={1}>
                {currentBooking?.drop_location || drop?.address || 'Your Destination'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(main)/search-location', params: { mode: 'change_dest' } })} style={{ padding: 6 }}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTripDetail(true)} style={{ padding: 6 }}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={s.enrouteDivider} />

          {/* Driver Info - same as enroute */}
          <TouchableOpacity
            style={s.enrouteDriverRow}
            onPress={() => setShowDriverDetail(true)}
            activeOpacity={0.8}
          >
            <View style={s.enrouteCarAvatarWrap}>
              <View style={[s.enrouteCarBox, { width: 70, height: 45 }]}>
                <Ionicons name="car-sport" size={48} color={COLORS.textLight} />
              </View>
              <View style={[s.enrouteAvatarBox, { bottom: -2, right: -2 }]}>
                <Ionicons name="person" size={14} color={COLORS.white} />
              </View>
            </View>
            <View style={s.enrouteDriverDetails}>
              <View style={[s.enrouteLicensePlate, { paddingVertical: 2, paddingHorizontal: 6 }]}>
                <Text style={[s.enrouteLicenseText, { fontSize: 12 }]}>{driverInfo?.number_plate || ''}</Text>
              </View>
              <Text style={[s.enrouteDriverName, { fontSize: 16 }]}>{currentBooking?.driver?.name || currentBooking?.driver_name || 'Captain'}</Text>
              <Text style={[s.enrouteVehicleName, { fontSize: 12 }]}>{driverInfo?.vehicle_name || 'Vehicle'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>
      );
    }

    // RIDE COMPLETED — Lekar style
    if (bookingStatus === 'ride_completed') {
      const tripId = `LK${currentBooking?.id || ''}`;
      const pickupTime = currentBooking?.pickup_at ? new Date(currentBooking.pickup_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
      const dropTime = currentBooking?.completed_at ? new Date(currentBooking.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
      return (
        <>
          {/* Header */}
          <View style={s.completedSection}>
            <View style={s.completedIcon}>
              <Ionicons name="checkmark" size={32} color={COLORS.white} />
            </View>
            <View style={{ marginLeft: 14 }}>
              <Text style={s.completedTitle}>Ride Completed!</Text>
              <Text style={s.completedPayment}>Thanks for riding with Lekar</Text>
            </View>
          </View>

          {/* Fare Card */}
          <View style={s.fareBreakdownCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: SIZES.sm, color: COLORS.textSecondary }}>Total Paid</Text>
                <Text style={s.completedFare}>{formatCurrency(currentBooking?.fare_total)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text style={{ fontSize: SIZES.sm, color: COLORS.success, fontWeight: '600' }}>Paid Successfully</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: SIZES.xs, color: COLORS.textSecondary }}>Trip ID</Text>
                <Text style={{ fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text, marginTop: 2 }}>{tripId}</Text>
                <Text style={{ fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 6 }}>Payment Method</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="card-outline" size={14} color={COLORS.text} />
                  <Text style={{ fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text }}>Cash</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pickup / Drop Timeline */}
          <View style={s.tripTimeline}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ alignItems: 'center', marginRight: 12 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success }} />
                <View style={{ width: 2, height: 30, backgroundColor: COLORS.border, marginVertical: 4 }} />
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary }} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text }}>Pickup</Text>
                    <Text style={{ fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 1 }} numberOfLines={1}>{currentBooking?.pickup_location || pickup?.address}</Text>
                  </View>
                  <Text style={{ fontSize: SIZES.xs, color: COLORS.textSecondary }}>{pickupTime}</Text>
                </View>
                <View style={{ height: 20 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text }}>Drop</Text>
                    <Text style={{ fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 1 }} numberOfLines={1}>{currentBooking?.drop_location || drop?.address}</Text>
                  </View>
                  <Text style={{ fontSize: SIZES.xs, color: COLORS.textSecondary }}>{dropTime}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Star Rating */}
          <View style={s.ratingSection}>
            <Text style={s.ratingLabel}>How was your ride?</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={{ padding: 4 }}>
                  <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={38} color={star <= rating ? '#F59E0B' : COLORS.textLight} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 6 }}>Tap a star to rate your driver</Text>
          </View>

          {/* Buttons moved to sticky footer */}
        </>
      );
    }

    // NO DRIVER / CANCELLED
    if (bookingStatus === 'no_driver_available' || bookingStatus === 'canceled') {
      return (
        <View style={s.noDriverContainer}>
          <View style={s.noDriverIconWrap}>
            <Ionicons name={bookingStatus === 'no_driver_available' ? 'car-outline' : 'close-circle-outline'} size={64} color={COLORS.primary} />
          </View>
          <Text style={s.noDriverTitle}>
            {bookingStatus === 'no_driver_available' ? 'No Drivers Available' : 'Ride Cancelled'}
          </Text>
          <Text style={s.noDriverSubtitle}>
            {bookingStatus === 'no_driver_available'
              ? 'All nearby captains are busy right now. Please try again in a moment.'
              : 'Your ride has been cancelled successfully.'}
          </Text>
        </View>
      );
    }

    return null;
  };
  // ── Ad Banners (square image slots with clickable links) ──
  const AD_SLOTS = [
    { link: 'https://lekar.in/offers', placeholder: 'Ad Image 1' },
    { link: 'https://lekar.in/refer', placeholder: 'Ad Image 2' },
    { link: 'https://lekar.in/safety', placeholder: 'Ad Image 3' },
  ];
  const renderAds = () => (
    <View style={{ marginTop: 14, gap: 10 }}>
      {AD_SLOTS.map((ad, i) => (
        <TouchableOpacity key={i} style={s.adSquare} onPress={() => Linking.openURL(ad.link)} activeOpacity={0.8}>
          {/* Replace this View with <Image source={...} style={s.adImage} /> when you have real ad images */}
          <View style={s.adImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color={COLORS.textLight} />
            <Text style={s.adPlaceholderText}>{ad.placeholder}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Sticky Footer Buttons per status ──
  const renderStickyFooter = () => {
    if (bookingStatus === 'searching_driver' || bookingStatus === 'driver_assigned') {
      return (
        <View style={s.stickyFooter}>
          <TouchableOpacity style={s.cancelOutlineBtn} onPress={handleCancel}>
            <Text style={s.cancelOutlineBtnText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (['driver_enroute', 'arrived_at_pickup'].includes(bookingStatus)) {
      return (
        <View style={s.stickyFooter}>
          <View style={s.enrouteActionRow}>
            <TouchableOpacity style={s.enrouteBtnAction} onPress={() => setShowChat(true)}>
              <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
              <Text style={s.enrouteBtnText}>Send a message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.enrouteBtnAction} onPress={() => {
              const phone = currentBooking?.driver?.phone || currentBooking?.driver_phone;
              if (phone) Linking.openURL(`tel:${phone}`);
            }}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={s.enrouteBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (bookingStatus === 'ride_started' || bookingStatus === 'otp_verified') {
      return (
        <View style={s.stickyFooter}>
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={() => setShowChat(true)}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              <Text style={s.actionBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={handleSOS}>
              <Ionicons name="shield-outline" size={18} color={COLORS.success} />
              <Text style={[s.actionBtnText, { color: COLORS.success }]}>Safety</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (bookingStatus === 'ride_completed') {
      return (
        <View style={s.stickyFooter}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={s.outlineBtn} onPress={() => { }}>
              <Ionicons name="download-outline" size={18} color={COLORS.primary} />
              <Text style={s.outlineBtnText}>Download Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={async () => {
              if (rating > 0) { try { await ridesAPI.review(currentBooking.id, rating, ''); } catch (e) { } }
              clearRide(); router.replace('/(main)/(tabs)/home');
            }}>
              <Text style={s.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (bookingStatus === 'no_driver_available' || bookingStatus === 'canceled') {
      return (
        <View style={s.stickyFooter}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => { clearRide(); router.replace('/(main)/(tabs)/home'); }}>
            <Text style={s.primaryBtnText}>{bookingStatus === 'no_driver_available' ? 'Try Again' : 'Go Home'}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* TOP HALF: MAP */}
      <View style={s.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: pickup?.lat || 25.6117, longitude: pickup?.lng || 85.1441,
            latitudeDelta: 0.03, longitudeDelta: 0.03,
          }}
          showsUserLocation showsMyLocationButton={false}
        >
          {pickup?.lat && !['ride_started', 'ride_completed'].includes(bookingStatus) && (
            <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}>
              <View style={s.pickupMarker}><View style={s.pickupDot} /></View>
            </Marker>
          )}
          {drop?.lat && bookingStatus !== 'ride_completed' && (
            <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }}>
              <View style={s.dropMarker}><Ionicons name="location" size={28} color={COLORS.primary} /></View>
            </Marker>
          )}
          {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeColor={COLORS.primary} strokeWidth={4} />}
          {driverLoc && ['driver_enroute', 'arrived_at_pickup', 'ride_started'].includes(bookingStatus) && (
            <Marker coordinate={{ latitude: driverLoc.lat, longitude: driverLoc.lng }} rotation={driverHeading} flat anchor={{ x: 0.5, y: 0.5 }}>
              <View style={s.driverMapMarker}><Ionicons name={getVehicleIcon(driverInfo?.vehicle_type || selectedVehicle)} size={18} color={COLORS.white} /></View>
            </Marker>
          )}
        </MapView>

        {/* My Location Button */}
        <TouchableOpacity style={s.myLocBtn}>
          <Ionicons name="locate" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* BOTTOM HALF: CONTENT */}
      <View style={s.contentContainer}>
        {bookingStatus ? (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.statusPanelInner} showsVerticalScrollIndicator={false}>
              {renderStatusUI()}
              {renderAds()}
            </ScrollView>
            {renderStickyFooter()}
          </>
        ) : (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.sheetContent} showsVerticalScrollIndicator={false}>
              {(estimates.length > 0 ? estimates : [
                { vehicle: { name: 'LekarGo', seats: 4 }, fare: 0, eta_min: null },
                { vehicle: { name: 'LekarXL', seats: 4 }, fare: 0, eta_min: null },
                { vehicle: { name: 'LekarAuto', seats: 3 }, fare: 0, eta_min: null },
                { vehicle: { name: 'LekarBike', seats: 1 }, fare: 0, eta_min: null },
              ]).map((est, i) => {
                const name = est.vehicle?.name || 'LekarGo';
                const seats = est.vehicle?.seats || (name.includes('Bike') ? 1 : name.includes('Auto') ? 3 : 4);
                const isSelected = name.toLowerCase() === selectedVehicle.toLowerCase();
                const distKm = distance || 0;
                const calcMin = Math.round(distKm * 1.5) || 1;
                const arrivalDate = new Date();
                arrivalDate.setMinutes(arrivalDate.getMinutes() + calcMin);
                const arrivalStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <TouchableOpacity key={i} style={[s.vRow, isSelected && s.vRowSelected]} onPress={() => setSelectedVehicle(name.toLowerCase())} activeOpacity={0.7}>
                    <View style={s.vIconWrap}><Ionicons name={getVehicleIcon(name)} size={28} color={isSelected ? COLORS.primary : COLORS.textSecondary} /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[s.vName, isSelected && { color: COLORS.primary }]}>{name}</Text>
                        <Ionicons name="person" size={12} color={COLORS.textSecondary} />
                        <Text style={s.vSeats}>{seats}</Text>
                      </View>
                      <Text style={s.vSub}>{calcMin} mins • Drop at {arrivalStr}</Text>
                      {i === 0 && isSelected && <View style={s.fastestBadge}><Ionicons name="flash" size={10} color="#E65100" /><Text style={s.fastestText}>Fastest</Text></View>}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.vFare, isSelected && { color: COLORS.text }]}>{est.fare ? formatCurrency(est.fare) : '--'}</Text>
                      {est.fare > 0 && <Text style={s.vFareOld}>₹{Math.round(est.fare * 1.06)}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={s.bookBar}>
              <View style={s.bookBarTop}>
                <TouchableOpacity style={s.personalBtn}>
                  <Text style={s.personalText}>Personal</Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <View style={s.bookBarDivider} />
                <TouchableOpacity style={s.cashBtn}>
                  <Ionicons name="card-outline" size={16} color={COLORS.primary} />
                  <Text style={s.cashBtnText}>Cash</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={s.nowBtn}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                  <Text style={s.nowText}>Now</Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.bookBtn} onPress={handleBook} disabled={booking || !drop?.lat} activeOpacity={0.8}>
                {booking ? <ActivityIndicator color="#fff" /> : (
                  <Text style={s.bookBtnText}>Book {selectedVehicle.charAt(0).toUpperCase() + selectedVehicle.slice(1)}</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Destination History Modal */}
      <CustomModal visible={showHistory} onClose={() => setShowHistory(false)}>
        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
          <View style={s.modalHandle}><View style={s.modalHandleBar} /></View>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Destination History</Text>
          </View>
          <ScrollView style={{ maxHeight: 400, marginTop: 10 }}>
            {currentBooking?.segments?.map((seg, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ alignItems: 'center', marginRight: 12 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i === currentBooking.segments.length - 1 ? COLORS.primary : COLORS.textLight }} />
                  {i < currentBooking.segments.length - 1 && <View style={{ width: 2, height: 36, backgroundColor: COLORS.border, marginTop: 4 }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>{i === 0 ? 'Original' : `Change ${i}`}</Text>
                  <Text style={{ fontSize: SIZES.md, color: COLORS.text, fontWeight: '600', marginTop: 2 }}>{seg.to_address}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </CustomModal>

      {/* Cancel Reason Modal */}
      <CancelModal visible={showCancel} onClose={() => setShowCancel(false)} onConfirm={confirmCancel} />

      {/* Driver Profile Modal */}
      <DriverDetailModal visible={showDriverDetail} onClose={() => setShowDriverDetail(false)} booking={currentBooking} driverInfo={driverInfo} />

      {/* Trip Detail Modal */}
      <TripDetailModal visible={showTripDetail} onClose={() => setShowTripDetail(false)} booking={currentBooking} liveDistanceKm={liveDistanceKm} liveETA={liveETA} />

      {/* Chat Modal */}
      <ChatModal
        visible={showChat}
        onClose={() => setShowChat(false)}
        bookingId={currentBooking?.id}
        driverName={currentBooking?.driver?.name || currentBooking?.driver_name || 'Captain'}
        onNewMessage={chatMsgRef}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  lekarHeader: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 36 : 6, paddingBottom: 12 },
  headerBackBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  lekarLogo: { fontSize: 26, fontWeight: '800', color: COLORS.white, fontStyle: 'italic' },
  mapContainer: { flex: 1, width: '100%' },
  contentContainer: { flex: 1, width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, ...SHADOWS.large },
  floatingBack: { position: 'absolute', top: 80, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.small, zIndex: 10 },
  pickupMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#06D6A020', justifyContent: 'center', alignItems: 'center' },
  pickupDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: '#fff' },
  dropMarker: { alignItems: 'center' },
  driverMapMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', ...SHADOWS.medium },
  myLocBtn: { position: 'absolute', right: 12, bottom: 12, width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  statusPanelInner: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  sheetContent: { paddingHorizontal: 0, paddingBottom: 10, paddingTop: 0 },
  vRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderWidth: 2, borderColor: 'transparent', marginHorizontal: 12, marginVertical: 4, borderRadius: 16 },
  vRowSelected: { backgroundColor: '#FFF5F5', borderColor: COLORS.primary, ...SHADOWS.small },
  vIconWrap: { width: 60, height: 44, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  vName: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text },
  vSeats: { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '700' },
  vSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: '500' },
  vFare: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text },
  vFareOld: { fontSize: SIZES.xs, color: COLORS.textLight, textDecorationLine: 'line-through', marginTop: 2, textAlign: 'right' },
  fastestBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  fastestText: { fontSize: 10, fontWeight: '800', color: '#E65100', textTransform: 'uppercase' },
  bookBar: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 10 : 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border + '50', backgroundColor: '#fff' },
  bookBarTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  personalBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  personalText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  bookBarDivider: { width: 1, height: 20, backgroundColor: COLORS.border, marginHorizontal: 12 },
  cashBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cashBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  nowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nowText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  bookBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: SIZES.radiusXl, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: SIZES.lg, fontWeight: '700' },

  // Searching status - premium card
  searchCard: { alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  searchPulseOuter: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  searchPulseInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '25', justifyContent: 'center', alignItems: 'center' },
  searchTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  searchSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  searchProgressBg: { height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, width: '100%', overflow: 'hidden', marginBottom: 8 },
  searchProgressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  searchAttemptText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },

  // No driver / cancelled
  noDriverContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  noDriverIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  noDriverTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  noDriverSubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Sticky footer
  stickyFooter: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border + '40', backgroundColor: '#fff' },
  fareCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  fareCardLabel: { fontSize: 11, color: COLORS.textSecondary },
  fareCardValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  tripDetailsBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  tripDetailsBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },

  // DRIVER ENROUTE UI (Figma matching)
  enrouteContainer: { paddingTop: 4, paddingBottom: 16 },
  enrouteHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 12 },
  enrouteOtpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, backgroundColor: '#FFF5F5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FFE4E4' },
  enrouteOtpLabel: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.primary },
  enrouteOtpBoxes: { flexDirection: 'row', gap: 6 },
  enrouteOtpBox: { width: 34, height: 38, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  enrouteOtpText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  enrouteDivider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 14 },
  enrouteDriverRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  enrouteCarAvatarWrap: { position: 'relative', width: 120, height: 70, justifyContent: 'center' },
  enrouteCarBox: { width: 120, height: 60, justifyContent: 'center', alignItems: 'center' },
  enrouteAvatarBox: { position: 'absolute', left: -10, top: 10, width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
  enrouteDriverDetails: { flex: 1, alignItems: 'flex-end' },
  enrouteLicensePlate: { backgroundColor: '#FFC107', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#FFA000' },
  enrouteLicenseText: { fontSize: SIZES.sm, fontWeight: '800', color: '#000' },
  enrouteDriverName: { fontSize: SIZES.md, fontWeight: '700', color: '#1A1A1A' },
  enrouteVehicleName: { fontSize: 11, fontWeight: '600', color: '#666', marginTop: 2, textTransform: 'uppercase' },

  enrouteDestBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, marginBottom: 16 },
  enrouteDestLabel: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 2 },
  enrouteDestText: { fontSize: SIZES.sm, fontWeight: '700', color: '#1A1A1A' },
  enrouteTripDetailsText: { fontSize: SIZES.sm, fontWeight: '800', color: COLORS.primary },

  enrouteActionRow: { flexDirection: 'row', gap: 12 },
  enrouteBtnAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFF5F5', paddingVertical: 12, borderRadius: 12 },
  enrouteBtnText: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primary },

  // Ride started
  rideHeaderSection: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '50', marginBottom: 10 },
  rideHeaderTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  rideHeaderSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  dropRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '50', marginBottom: 10 },
  dropLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  dropAddr: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginTop: 2 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, gap: 3 },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  cancelOutlineBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.error + '40', marginBottom: 10 },
  cancelOutlineBtnText: { color: COLORS.error, fontWeight: '700', fontSize: SIZES.sm },

  // Completed — Lekar style
  completedSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  completedIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  completedTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  completedFare: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginTop: 2 },
  completedPayment: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  fareBreakdownCard: { backgroundColor: '#F9F9F9', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  tripTimeline: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginBottom: 12 },
  ratingSection: { alignItems: 'center', marginBottom: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  ratingLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 8 },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: SIZES.radiusXl, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: SIZES.lg, fontWeight: '700' },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15, borderRadius: SIZES.radiusXl, borderWidth: 1.5, borderColor: COLORS.primary, marginBottom: 10 },
  outlineBtnText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.primary },

  // Ad banners (square image slots)
  adSquare: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: COLORS.border },
  adImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  adPlaceholderText: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 6 },
  adImage: { width: '100%', height: '100%', borderRadius: 12 },

  // Modals — clean white sheet from bottom
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 34, maxHeight: '80%' },
  modalHandle: { alignItems: 'center', paddingVertical: 10 },
  modalHandleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  modalInput: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: SIZES.md, fontWeight: '500', borderWidth: 1, borderColor: COLORS.border },
  modalSuggestions: { marginTop: 10 },
  modalSuggItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border + '50' },
  modalSuggMain: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  modalSuggSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
});
