import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Modal,
  TextInput,
  Image,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../src/components/MapViewSafe';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { ridesAPI } from '../../src/api/rides';
import { placesAPI } from '../../src/api/places';
import useRideStore from '../../src/store/rideStore';
import { decodePolyline, formatCurrency, formatDuration, formatDistance } from '../../src/utils/helpers';
import { subscribeToBooking, unsubscribeFromBooking, initWebSocket } from '../../src/services/socket';
import CancelModal from '../../src/components/ride/CancelModal';
import DriverDetailModal from '../../src/components/ride/DriverDetailModal';
import ChatModal from '../../src/components/ride/ChatModal';
import * as Location from 'expo-location';

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
  const [showDestChange, setShowDestChange] = useState(false);
  const [destQuery, setDestQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destLoading, setDestLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDriverDetail, setShowDriverDetail] = useState(false);
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
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 60, bottom: 300, left: 60 },
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

  const startPolling = (bookingId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    // Polling is ONLY a safety net for missed WebSocket events
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
    }, 60000); // 60s extreme fallback — WebSocket handles everything
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

  // Destination change search
  const searchDestination = async (text) => {
    setDestQuery(text);
    if (text.length < 3) { setDestSuggestions([]); return; }
    try {
      const res = await placesAPI.autocomplete(text, pickup?.lat, pickup?.lng);
      if (res.data.success) setDestSuggestions(res.data.predictions || []);
    } catch (e) { /* silent */ }
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
        setShowDestChange(false);
        setDestQuery('');
        setDestSuggestions([]);
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
          {/* Dark header banner */}
          <View style={s.searchDarkBar}>
            <Text style={s.searchDarkText}>Waiting for Captain to accept</Text>
            <View style={s.searchProgressBg}>
              <View style={s.searchProgressFill} />
            </View>
          </View>

          {/* Captain status */}
          {total > 0 && (
            <View style={s.captainStatus}>
              <Text style={s.captainStatusNum}>{Math.min(attempt, total)} of {total}</Text>
              <Text style={s.captainStatusText}> captains didn't accept your ride</Text>
            </View>
          )}

          {/* Fare card */}
          <View style={s.fareCard}>
            <Ionicons name={getVehicleIcon(selectedVehicle)} size={28} color={COLORS.textSecondary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.fareCardLabel}>Total Fare</Text>
              <Text style={s.fareCardValue}>{formatCurrency(currentBooking?.fare_total || fare)}</Text>
            </View>
            <TouchableOpacity style={s.tripDetailsBtn} onPress={() => setShowDriverDetail(true)}>
              <Text style={s.tripDetailsBtnText}>Trip Details</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel */}
          <TouchableOpacity style={s.cancelOutlineBtn} onPress={handleCancel}>
            <Text style={s.cancelOutlineBtnText}>Cancel Ride</Text>
          </TouchableOpacity>
        </>
      );
    }

    // DRIVER ENROUTE / ARRIVED
    if (['driver_enroute', 'arrived_at_pickup'].includes(bookingStatus)) {
      const isArrived = bookingStatus === 'arrived_at_pickup';
      return (
        <>
          <View style={[s.statusChip, { backgroundColor: isArrived ? '#06D6A015' : COLORS.primary + '10' }]}>
            <Ionicons name={isArrived ? 'checkmark-circle' : 'navigate'} size={16} color={isArrived ? COLORS.success : COLORS.primary} />
            <Text style={[s.statusChipText, { color: isArrived ? COLORS.success : COLORS.primary }]}>
              {isArrived ? 'Captain arrived at pickup' : `Arriving in ${driverETA || '...'} min`}
            </Text>
          </View>
          {currentBooking?.otp_code && (
            <View style={s.otpBigCard}>
              <Text style={s.otpBigLabel}>OTP</Text>
              <View style={s.otpDigitsRow}>
                {String(currentBooking.otp_code).split('').map((d, i) => (
                  <View key={i} style={s.otpDigitBox}><Text style={s.otpDigitText}>{d}</Text></View>
                ))}
              </View>
            </View>
          )}
          <TouchableOpacity style={s.driverCardRapido} onPress={() => setShowDriverDetail(true)} activeOpacity={0.7}>
            <View style={s.driverAvatarRapido}><Ionicons name="person" size={22} color={COLORS.white} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.driverNameRapido}>{currentBooking?.driver?.name || currentBooking?.driver_name || 'Captain'}</Text>
              <Text style={s.driverVehicleText}>{driverInfo?.vehicle_name || ''} {driverInfo?.number_plate ? '• ' + driverInfo.number_plate : ''}</Text>
            </View>
            <View style={s.ratingBadge}><Ionicons name="star" size={11} color="#F59E0B" /><Text style={s.ratingBadgeText}>{driverInfo?.rating || '5.0'}</Text></View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={() => {
              const phone = currentBooking?.driver?.phone || currentBooking?.driver_phone;
              if (phone) Linking.openURL(`tel:${phone}`);
            }}>
              <Ionicons name="call-outline" size={18} color={COLORS.success} />
              <Text style={[s.actionBtnText, { color: COLORS.success }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => setShowChat(true)}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              <Text style={s.actionBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={handleCancel}>
              <Ionicons name="close-outline" size={18} color={COLORS.error} />
              <Text style={[s.actionBtnText, { color: COLORS.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    // RIDE STARTED
    if (bookingStatus === 'ride_started' || bookingStatus === 'otp_verified') {
      const etaMin = liveETA || currentBooking?.duration_min || '--';
      return (
        <>
          {/* Rapido-style ETA header */}
          <View style={s.rideHeaderSection}>
            <Text style={s.rideHeaderTitle}>
              Reaching drop location in <Text style={{ color: COLORS.success }}>{etaMin} min</Text>
            </Text>
            <Text style={s.rideHeaderSub}>Reaching {currentBooking?.drop_location?.split(',')[0] || ''}</Text>
          </View>

          {/* Drop address + Trip Details */}
          <View style={s.dropRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.dropLabel}>Drop to</Text>
              <Text style={s.dropAddr} numberOfLines={1}>{currentBooking?.drop_location || drop?.address}</Text>
            </View>
            <TouchableOpacity style={s.tripDetailsBtn} onPress={() => setShowDriverDetail(true)}>
              <Text style={s.tripDetailsBtnText}>Trip Details</Text>
            </TouchableOpacity>
          </View>

          {/* Driver card — Rapido style compact */}
          <TouchableOpacity style={s.driverCardRapido} onPress={() => setShowDriverDetail(true)} activeOpacity={0.7}>
            <View style={s.driverAvatarRapido}><Ionicons name="person" size={22} color={COLORS.white} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.driverNameRapido}>{currentBooking?.driver?.name || currentBooking?.driver_name || 'Captain'}</Text>
              <Text style={[s.driverVehicleText, { fontWeight: '800', fontSize: SIZES.md }]}>{driverInfo?.number_plate || ''}</Text>
              <Text style={s.driverVehicleText}>Speaks english, hindi</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={s.ratingBadge}><Text style={s.ratingBadgeText}>{driverInfo?.rating || '4.5'}</Text><Ionicons name="star" size={11} color="#F59E0B" /></View>
            </View>
          </TouchableOpacity>

          {/* Quick actions */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={() => setShowChat(true)}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              <Text style={s.actionBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => setShowDestChange(true)}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              <Text style={s.actionBtnText}>Change Drop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={handleSOS}>
              <Ionicons name="shield-outline" size={18} color={COLORS.success} />
              <Text style={[s.actionBtnText, { color: COLORS.success }]}>Safety</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    // RIDE COMPLETED
    if (bookingStatus === 'ride_completed') {
      return (
        <>
          <View style={s.completedSection}>
            <View style={s.completedIcon}>
              <Ionicons name="checkmark" size={32} color={COLORS.white} />
            </View>
            <Text style={s.completedTitle}>Ride Completed!</Text>
            <Text style={s.completedFare}>{formatCurrency(currentBooking?.fare_total)}</Text>
            <Text style={s.completedPayment}>{currentBooking?.payment_method === 'cash' ? 'Pay via Cash' : 'Paid Online'}</Text>
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
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={async () => {
            if (rating > 0) { try { await ridesAPI.review(currentBooking.id, rating, ''); } catch (e) { } }
            clearRide(); router.replace('/(main)/(tabs)/home');
          }}>
            <Text style={s.primaryBtnText}>{rating > 0 ? 'Submit & Done' : 'Skip'}</Text>
          </TouchableOpacity>
        </>
      );
    }

    // NO DRIVER / CANCELLED
    if (bookingStatus === 'no_driver_available' || bookingStatus === 'canceled') {
      return (
        <>
          <View style={s.completedSection}>
            <View style={[s.completedIcon, { backgroundColor: COLORS.error }]}>
              <Ionicons name="close" size={36} color={COLORS.white} />
            </View>
            <Text style={s.completedTitle}>
              {bookingStatus === 'no_driver_available' ? 'No drivers available' : 'Ride Cancelled'}
            </Text>
            <Text style={s.completedPayment}>Please try again</Text>
          </View>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => { clearRide(); router.replace('/(main)/(tabs)/home'); }}
          >
            <Text style={s.primaryBtnText}>Go Home</Text>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };
  // ── Ad Banners ──
  const renderAds = () => (
    <View style={{ marginTop: 14 }}>
      {[
        { bg: '#E63946', title: '🎉 50% OFF next ride!', sub: 'Use code LEKAR50' },
        { bg: '#1D3557', title: '👥 Refer & Earn ₹100', sub: 'Invite friends to Lekar' },
        { bg: '#2D6A4F', title: '🛡️ Safety matters', sub: 'Share ride with family' },
      ].map((ad, i) => (
        <View key={i} style={[s.adBanner, { backgroundColor: ad.bg }]}>
          <View style={s.adImageSlot}><Ionicons name="image-outline" size={32} color="#ffffff50" /></View>
          <Text style={s.adTitle}>{ad.title}</Text>
          <Text style={s.adSub}>{ad.sub}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
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

        <View style={s.topOverlay}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM HALF: CONTENT */}
      <View style={s.contentContainer}>
        {bookingStatus ? (
          <ScrollView contentContainerStyle={s.statusPanelInner} showsVerticalScrollIndicator={false}>
            {renderStatusUI()}
            {renderAds()}
          </ScrollView>
        ) : (
          <>
            <ScrollView contentContainerStyle={s.sheetContent} showsVerticalScrollIndicator={false}>
              {(estimates.length > 0 ? estimates : [
                { vehicle: { name: 'Bike' }, fare: 0, eta_min: null },
                { vehicle: { name: 'Auto' }, fare: 0, eta_min: null },
                { vehicle: { name: 'Cab' }, fare: 0, eta_min: null },
              ]).map((est, i) => {
                const name = est.vehicle?.name || 'Bike';
                const isSelected = name.toLowerCase() === selectedVehicle.toLowerCase();
                return (
                  <TouchableOpacity key={i} style={[s.vRow, isSelected && s.vRowSelected]} onPress={() => setSelectedVehicle(name.toLowerCase())} activeOpacity={0.7}>
                    <View style={s.vIconWrap}><Ionicons name={getVehicleIcon(name)} size={26} color={isSelected ? COLORS.primary : COLORS.textSecondary} /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[s.vName, isSelected && { color: COLORS.primary }]}>{name}</Text>
                      <Text style={s.vSub}>{est.eta_min ? `${est.eta_min} min` : 'Quick rides'} • {formatDuration(duration)}</Text>
                    </View>
                    <Text style={[s.vFare, isSelected && { color: COLORS.primary }]}>{est.fare ? formatCurrency(est.fare) : '--'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={s.bookBar}>
              <TouchableOpacity style={s.cashBtn}>
                <Ionicons name="cash-outline" size={16} color={COLORS.text} />
                <Text style={s.cashBtnText}>Cash</Text>
                <Ionicons name="chevron-forward" size={12} color={COLORS.textLight} />
              </TouchableOpacity>
              <TouchableOpacity style={s.bookBtn} onPress={handleBook} disabled={booking || !drop?.lat} activeOpacity={0.8}>
                {booking ? <ActivityIndicator color="#fff" /> : (
                  <Text style={s.bookBtnText}>Book {selectedVehicle.charAt(0).toUpperCase() + selectedVehicle.slice(1)}</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Destination Change Modal */}
      <Modal visible={showDestChange} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle}><View style={s.modalHandleBar} /></View>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Change Destination</Text>
              <TouchableOpacity onPress={() => { setShowDestChange(false); setDestQuery(''); setDestSuggestions([]); }}>
                <Ionicons name="close-circle" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <TextInput style={s.modalInput} placeholder="Search new destination..." placeholderTextColor={COLORS.textLight} value={destQuery} onChangeText={searchDestination} autoFocus />
            {destLoading && <ActivityIndicator style={{ marginTop: 14 }} color={COLORS.primary} />}
            <ScrollView style={s.modalSuggestions}>
              {destSuggestions.map((sg, i) => (
                <TouchableOpacity key={i} style={s.modalSuggItem} onPress={() => handleDestinationChange(sg)}>
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.modalSuggMain} numberOfLines={1}>{sg.structured_formatting?.main_text || sg.description}</Text>
                    <Text style={s.modalSuggSub} numberOfLines={1}>{sg.structured_formatting?.secondary_text || ''}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Destination History Modal */}
      <Modal visible={showHistory} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle}><View style={s.modalHandleBar} /></View>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Destination History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
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
          </View>
        </View>
      </Modal>

      {/* Cancel Reason Modal */}
      <CancelModal visible={showCancel} onClose={() => setShowCancel(false)} onConfirm={confirmCancel} />

      {/* Driver/Trip Detail Modal */}
      <DriverDetailModal visible={showDriverDetail} onClose={() => setShowDriverDetail(false)} booking={currentBooking} driverInfo={driverInfo} />

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
  mapContainer: { height: '50%', width: '100%' },
  contentContainer: { height: '50%', width: '100%', backgroundColor: '#fff' },
  pickupMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#06D6A020', justifyContent: 'center', alignItems: 'center' },
  pickupDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: '#fff' },
  dropMarker: { alignItems: 'center' },
  driverMapMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', ...SHADOWS.medium },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginLeft: 16, marginTop: 10, ...SHADOWS.medium },

  // Status panel (full view after booking)
  statusPanelInner: { padding: 20, paddingBottom: 30 },

  // Content (pre-booking)
  sheetContent: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 16 },

  // Vehicle rows
  vRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 2 },
  vRowSelected: { borderColor: COLORS.primary, backgroundColor: '#fff' },
  vIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center' },
  vName: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  vSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  vFare: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },

  // Book bar (fixed at bottom)
  bookBar: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 10 : 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border + '50', backgroundColor: '#fff' },
  cashBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start', marginBottom: 10 },
  cashBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  bookBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: SIZES.lg, fontWeight: '700' },

  // Searching status
  searchDarkBar: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, marginBottom: 14 },
  searchDarkText: { color: '#fff', fontSize: SIZES.md, fontWeight: '700' },
  searchProgressBg: { height: 3, backgroundColor: '#333', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  searchProgressFill: { width: '35%', height: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  captainStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  captainStatusNum: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.primary },
  captainStatusText: { fontSize: SIZES.md, fontWeight: '500', color: COLORS.text },
  fareCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  fareCardLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  fareCardValue: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  tripDetailsBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  tripDetailsBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },

  // Driver enroute
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 10 },
  statusChipText: { fontSize: SIZES.sm, fontWeight: '700' },
  otpBigCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.primary + '30' },
  otpBigLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  otpDigitsRow: { flexDirection: 'row', gap: 10 },
  otpDigitBox: { width: 46, height: 54, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  otpDigitText: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  driverCardRapido: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  driverAvatarRapido: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  driverNameRapido: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  driverVehicleText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500', marginTop: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  ratingBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.text },

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

  // Completed
  completedSection: { alignItems: 'center', paddingVertical: 16 },
  completedIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  completedTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  completedFare: { fontSize: 38, fontWeight: '900', color: COLORS.primary, marginTop: 4 },
  completedPayment: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 4 },
  ratingSection: { alignItems: 'center', marginBottom: 14 },
  ratingLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 8 },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: SIZES.lg, fontWeight: '700' },

  // Ad banners
  adBanner: { borderRadius: 12, padding: 16, marginBottom: 10, minHeight: 120, justifyContent: 'flex-end' },
  adImageSlot: { position: 'absolute', top: 12, right: 16, width: 80, height: 60, borderRadius: 8, backgroundColor: '#ffffff15', justifyContent: 'center', alignItems: 'center' },
  adTitle: { color: '#fff', fontSize: SIZES.md, fontWeight: '700' },
  adSub: { color: '#ffffffCC', fontSize: SIZES.sm, marginTop: 3 },

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
