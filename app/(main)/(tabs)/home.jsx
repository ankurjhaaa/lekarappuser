import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ScrollView as GestureHandlerScrollView } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ridesAPI } from '../../../src/api/rides';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../../src/components/MapViewSafe';
import SavedLocationModal from '../../../src/components/SavedLocationModal';
import { COLORS, SHADOWS } from '../../../src/constants/theme';
import useAuthStore from '../../../src/store/authStore';
import useRideStore from '../../../src/store/rideStore';
import useUserStore from '../../../src/store/userStore';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.015;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Sheet snap percentages → bottom padding for map so marker stays visible-center
const SNAP_PERCENTS = [0.35, 0.70, 0.92];

const CAROUSEL_CARD_WIDTH = width - 40;
const AUTO_SCROLL_INTERVAL = 3500;

// Carousel placeholder slides (with placeholder links)
const CAROUSEL_SLIDES = [
  { id: '1', icon: 'car', color: '#D32F2F', bg: '#FFEBEE', label: 'Ride Anywhere', link: 'https://google.com' },
  { id: '2', icon: 'shield-checkmark', color: '#2E7D32', bg: '#E8F5E9', label: 'Safe Rides', link: 'https://google.com' },
  { id: '3', icon: 'time', color: '#1565C0', bg: '#E3F2FD', label: 'On-Time Promise', link: 'https://google.com' },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { nearbyDrivers, setNearbyDrivers, setPickup, setDrop } = useRideStore();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [sheetIndex, setSheetIndex] = useState(1);
  const [activeBooking, setActiveBooking] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [recentPlaces, setRecentPlaces] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const { savedPlaces, fetchSavedPlaces, addSavedPlace } = useUserStore();
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const carouselRef = useRef(null);
  const autoScrollTimer = useRef(null);

  const snapPoints = useMemo(() => ['35%', '70%', '92%'], []);

  useEffect(() => { fetchSavedPlaces(); }, []);

  useEffect(() => {
    if (savedPlaces?.length > 0) setRecentPlaces(savedPlaces.slice(0, 3));
  }, [savedPlaces]);

  // ── Auto-scroll carousel ──
  useEffect(() => {
    autoScrollTimer.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % CAROUSEL_SLIDES.length;
        carouselRef.current?.scrollTo({ x: next * CAROUSEL_CARD_WIDTH, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(autoScrollTimer.current);
  }, []);

  const onCarouselScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_CARD_WIDTH);
    if (idx !== activeSlide && idx >= 0 && idx < CAROUSEL_SLIDES.length) {
      setActiveSlide(idx);
    }
  }, [activeSlide]);

  // Reset auto-scroll timer on manual interaction
  const onScrollBeginDrag = useCallback(() => {
    clearInterval(autoScrollTimer.current);
  }, []);

  const onScrollEndDrag = useCallback(() => {
    autoScrollTimer.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % CAROUSEL_SLIDES.length;
        carouselRef.current?.scrollTo({ x: next * CAROUSEL_CARD_WIDTH, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, []);

  // Get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setMapLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCurrentLocation(coords);
      setMapLoading(false);

      try {
        const res = await ridesAPI.nearbyDrivers(coords.latitude, coords.longitude);
        if (res.data.success) setNearbyDrivers(res.data.drivers || []);
      } catch (e) { /* silent */ }

      try {
        const res = await ridesAPI.getActive();
        if (res.data.booking) setActiveBooking(res.data.booking);
      } catch (e) { /* silent */ }

      try {
        const [address] = await Location.reverseGeocodeAsync(coords);
        if (address) {
          const parts = [address.name, address.street, address.city].filter(Boolean);
          setCurrentAddress(parts.join(', '));
        }
      } catch (e) { /* silent */ }
    })();
  }, []);

  // Animate map to offset center based on current sheet height
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      const offset = (LATITUDE_DELTA * SNAP_PERCENTS[sheetIndex]) / 2;
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude - offset,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 500);
    }
  }, [currentLocation, sheetIndex]);

  useEffect(() => {
    if (!currentLocation || activeBooking) return;
    const interval = setInterval(async () => {
      try {
        const res = await ridesAPI.nearbyDrivers(currentLocation.latitude, currentLocation.longitude);
        if (res.data.success) setNearbyDrivers(res.data.drivers || []);
      } catch (e) { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentLocation, activeBooking]);

  const handleWhereToPress = () => {
    if (currentLocation) {
      setPickup({ lat: currentLocation.latitude, lng: currentLocation.longitude, address: currentAddress || 'Current Location' });
    }
    router.push('/(main)/search-location');
  };

  const handleQuickAction = (type) => {
    if (type === 'saved') { router.push('/(main)/search-location'); return; }
    const place = savedPlaces.find(p => p.label.toLowerCase() === type.toLowerCase());
    if (place) {
      if (currentLocation) {
        setPickup({ lat: currentLocation.latitude, lng: currentLocation.longitude, address: currentAddress || 'Current Location' });
        setDrop({ lat: parseFloat(place.lat), lng: parseFloat(place.lng), address: place.address });
        router.push('/(main)/ride-detail');
      }
    } else {
      setModalInitialData({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        address: currentAddress || 'Current Location',
        lat: currentLocation?.latitude, lng: currentLocation?.longitude, locked: true,
      });
      setModalVisible(true);
    }
  };

  const handleRecentPress = (place) => {
    if (currentLocation) {
      setPickup({ lat: currentLocation.latitude, lng: currentLocation.longitude, address: currentAddress || 'Current Location' });
      setDrop({ lat: parseFloat(place.lat), lng: parseFloat(place.lng), address: place.address });
      router.push('/(main)/ride-detail');
    }
  };

  const onSaveLocation = async (data) => {
    try { await addSavedPlace(data); setModalVisible(false); } catch (e) { alert('Failed to save location'); }
  };

  // Recenter map when sheet snaps to a new position
  const handleSheetChange = useCallback((index) => {
    setSheetIndex(index);
  }, []);

  const renderHandle = useCallback(() => (
    <View style={styles.handleContainer}>
      <View style={styles.handleBar} />
    </View>
  ), []);

  return (
    <View style={styles.container}>
      {/* ── Full-screen Map ── */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={currentLocation ? {
            ...currentLocation, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA,
          } : {
            latitude: 25.6117, longitude: 85.1441,
            latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          showsBuildings={false}
          showsIndoors={false}
          mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
          customMapStyle={cleanMapStyle}
        >
          {/* Pickup Point marker */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              anchor={{ x: 0.5, y: 0.95 }}
              tracksViewChanges={true}
              style={{ zIndex: 999 }}
            >
              <View style={{ width: 200, height: 70, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, gap: 5 }}>
                  <Ionicons name="location" size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Pickup Point</Text>
                </View>
                <View style={{ width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#2E7D32' }} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#2E7D32', borderWidth: 2.5, borderColor: '#fff', marginTop: 2 }} />
              </View>
            </Marker>
          )}

          {/* Nearby Drivers */}
          {!activeBooking && nearbyDrivers.map((driver, index) => (
            <Marker
              key={`driver-${driver.user_id || index}`}
              coordinate={{ latitude: driver.lat, longitude: driver.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.driverMarker}>
                <Ionicons
                  name={driver.vehicle_type === 'cab' ? 'car' : driver.vehicle_type === 'auto' ? 'car-sport' : 'bicycle'}
                  size={13} color={COLORS.white}
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Map-only loader — small pill */}
        {mapLoading && (
          <View style={styles.mapLoader}>
            <View style={styles.mapLoaderBox}>
              <ActivityIndicator size="small" color="#2E7D32" />
              <Text style={styles.mapLoaderText}>Locating you...</Text>
            </View>
          </View>
        )}

        {/* Recenter btn */}
        <TouchableOpacity
          style={styles.myLocationBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (currentLocation && mapRef.current) {
              const offset = (LATITUDE_DELTA * SNAP_PERCENTS[sheetIndex]) / 2;
              mapRef.current.animateToRegion({
                latitude: currentLocation.latitude - offset,
                longitude: currentLocation.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              }, 500);
            }
          }}
        >
          <Ionicons name="navigate" size={18} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {/* ── Sliding Panel ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        handleComponent={renderHandle}
        backgroundStyle={styles.sheetBg}
        enablePanDownToClose={false}
        overDragResistanceFactor={4}
        animateOnMount
        style={styles.sheetShadow}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>

          {/* ── Current address bar ── */}
          <TouchableOpacity style={styles.addressBar} onPress={handleWhereToPress} activeOpacity={0.8}>
            <View style={styles.addressDot} />
            <Text style={styles.addressText} numberOfLines={2}>
              {currentAddress || 'Fetching your current address...'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* Active ride */}
          {activeBooking && (
            <TouchableOpacity
              style={styles.rideBanner}
              onPress={() => router.push({ pathname: '/(main)/ride-detail', params: { bookingId: activeBooking.id } })}
              activeOpacity={0.85}
            >
              <View style={styles.rideBannerDot} />
              <Text style={styles.rideBannerText}>Ride in progress • Tap to track</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          )}

          {/* ── Premium "Where to?" ── */}
          <TouchableOpacity style={styles.searchBar} onPress={handleWhereToPress} activeOpacity={0.75}>
            <View style={styles.searchIconBox}>
              <Ionicons name="search" size={18} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={styles.searchTitle}>Where to?</Text>
            </View>
            <View style={styles.searchNowTag}>
              <Ionicons name="time-outline" size={13} color={COLORS.primary} />
              <Text style={styles.searchNowText}>Now</Text>
            </View>
          </TouchableOpacity>



          {/* ── Recent (max 3) ── */}
          {recentPlaces.length > 0 ? (
            recentPlaces.map((place, i) => (
              <TouchableOpacity
                key={place.id || i}
                style={[styles.recentRow, i === recentPlaces.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => handleRecentPress(place)}
                activeOpacity={0.7}
              >
                <View style={styles.recentDot}>
                  <Ionicons name="time-outline" size={15} color={COLORS.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentName} numberOfLines={1}>{place.label || place.address?.split(',')[0]}</Text>
                  <Text style={styles.recentAddr} numberOfLines={1}>{place.address}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={COLORS.textLight} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyRecent}>
              <Ionicons name="location-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.emptyRecentText}>Recent trips will show here</Text>
            </View>
          )}

          <View style={styles.sep} />

          {/* ── Auto-sliding Carousel (Using GestureHandlerScrollView for perfect manual swipe inside BottomSheet) ── */}
          <GestureHandlerScrollView
            ref={carouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={onScrollBeginDrag}
            onScrollEndDrag={onScrollEndDrag}
            onMomentumScrollEnd={onCarouselScroll}
            snapToInterval={CAROUSEL_CARD_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
          >
            {CAROUSEL_SLIDES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.slideCard}
                activeOpacity={0.9}
                onPress={() => item.link ? Linking.openURL(item.link) : null}
              >
                <View style={[styles.slideImageArea, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={40} color={item.color} />
                  {/* Replace with actual image when available */}
                </View>
              </TouchableOpacity>
            ))}
          </GestureHandlerScrollView>
          {/* Carousel dots */}
          <View style={styles.dotsRow}>
            {CAROUSEL_SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, activeSlide === i && styles.dotActive]} />
            ))}
          </View>

          {/* ── Offer Banner ── */}
          <TouchableOpacity style={styles.bannerWrap} activeOpacity={0.85} onPress={() => Linking.openURL('https://google.com')}>
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="pricetag" size={28} color={COLORS.primary} />
              <Text style={styles.bannerTitle}>Offer Banner</Text>
              <Text style={styles.bannerSub}>Tap to open link</Text>
            </View>
          </TouchableOpacity>

          {/* ── Lekar Captain Banner ── */}
          <TouchableOpacity style={styles.bannerWrap} activeOpacity={0.85} onPress={() => Linking.openURL('https://google.com')}>
            <View style={[styles.bannerPlaceholder, { backgroundColor: '#1A1A2E' }]}>
              <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
              <Text style={[styles.bannerTitle, { color: '#fff' }]}>Become a Lekar Captain</Text>
              <Text style={[styles.bannerSub, { color: 'rgba(255,255,255,0.5)' }]}>Tap to open link</Text>
            </View>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </BottomSheetScrollView>
      </BottomSheet>

      <SavedLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={onSaveLocation}
        initialData={modalInitialData}
      />
    </View>
  );
}

// Clean map — hide POIs, buildings, transit but keep roads & parks visible
const cleanMapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
];

// ────────────────────────────── STYLES ──────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8E8E8' },

  // ── Map ──
  mapWrapper: { flex: 1 },
  map: { flex: 1 },

  // ── Green Pickup Marker (explicit size to prevent clipping) ──
  markerWrap: {
    width: 130,
    height: 58,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  markerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  markerArrow: {
    width: 0, height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2E7D32',
  },
  markerDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    marginTop: 1,
  },
  markerDotInner: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#fff',
  },

  // Driver
  driverMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    ...SHADOWS.small,
  },

  // Map-only loader pill
  mapLoader: {
    position: 'absolute', top: Platform.OS === 'android' ? 48 : 56,
    left: 0, right: 0, alignItems: 'center', zIndex: 20,
  },
  mapLoaderBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20,
    ...SHADOWS.medium,
  },
  mapLoaderText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  // Recenter
  myLocationBtn: {
    position: 'absolute', right: 14, bottom: 14,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.medium,
  },

  // ── Sheet ──
  sheetShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 14,
  },
  sheetBg: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
  },
  handleContainer: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0' },
  sheetContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16 },

  // ── Address bar (top of sheet, like reference image) ──
  addressBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 2,
    gap: 10, marginBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  addressDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  addressText: {
    flex: 1, fontSize: 13.5, fontWeight: '600',
    color: COLORS.text, letterSpacing: -0.1,
  },

  // Active ride
  rideBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, marginBottom: 14, gap: 8,
  },
  rideBannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  rideBannerText: { flex: 1, color: '#fff', fontSize: 12.5, fontWeight: '600' },

  // ── Premium "Where to?" ──
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12, paddingHorizontal: 12, paddingRight: 14,
    borderRadius: 14,
    gap: 12,
    marginBottom: 18,
    borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  searchIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  searchTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2 },
  searchSub: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary, marginTop: 1 },
  searchNowTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primary + '0D',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8,
  },
  searchNowText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  // ── Quick actions ──
  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 5 },
  quickIcon: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },

  // Separator
  sep: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },

  // ── Recent ──
  recentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  recentDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center', alignItems: 'center',
  },
  recentName: { fontSize: 13.5, fontWeight: '600', color: COLORS.text },
  recentAddr: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary, marginTop: 1 },
  emptyRecent: { alignItems: 'center', paddingVertical: 14, gap: 4 },
  emptyRecentText: { fontSize: 12, fontWeight: '500', color: COLORS.textLight },

  // ── Carousel ──
  slideCard: {
    width: CAROUSEL_CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
  },
  slideImageArea: {
    width: '100%', height: 140,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 14,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D0D0D0' },
  dotActive: { width: 18, backgroundColor: COLORS.primary, borderRadius: 4 },

  // ── Banners ──
  bannerWrap: {
    borderRadius: 14, overflow: 'hidden', marginTop: 14,
  },
  bannerPlaceholder: {
    width: '100%', height: 140,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center', alignItems: 'center', gap: 4,
    borderRadius: 14,
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  bannerSub: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  bannerImage: { width: '100%', height: 140, borderRadius: 14 },
});
