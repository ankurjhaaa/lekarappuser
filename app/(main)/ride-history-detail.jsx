import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ridesAPI } from '../../src/api/rides';
import { COLORS, SHADOWS, SIZES } from '../../src/constants/theme';
import { formatCurrency } from '../../src/utils/helpers';
import useRideStore from '../../src/store/rideStore';

export default function RideHistoryDetailScreen() {
  const params = useLocalSearchParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setPickup, setDrop, setVehicleType } = useRideStore();

  useEffect(() => {
    (async () => {
      try {
        const res = await ridesAPI.getStatus(params.bookingId);
        if (res.data.success) setRide(res.data.booking);
      } catch (e) { /* silent */ }
      setLoading(false);
    })();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'ride_completed') return COLORS.success;
    if (status === 'canceled') return COLORS.primary;
    return COLORS.warning;
  };

  const getStatusLabel = (status) => {
    if (status === 'ride_completed') return 'Completed';
    if (status === 'canceled') return 'Cancelled';
    return status;
  };

  if (loading) return null;


  if (!ride) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Ride Details</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.textLight} />
          <Text style={{ fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 12 }}>Ride not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bookingId = `CRB${ride.id}`;
  const status = ride.status;
  const pickupTime = ride.pickup_at ? new Date(ride.pickup_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';
  const dropTime = ride.completed_at ? new Date(ride.completed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';
  const createdDate = new Date(ride.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleRebook = () => {
    // 1. Prepare data
    const p = {
      address: ride.pickup_location,
      lat: parseFloat(ride.pickup_lat),
      lng: parseFloat(ride.pickup_lng)
    };
    const d = {
      address: ride.drop_location,
      lat: parseFloat(ride.drop_lat),
      lng: parseFloat(ride.drop_lng)
    };

    // 2. Set Store
    setPickup(p);
    setDrop(d);
    setVehicleType(ride.vehicle_type || 'bike');
    
    // 3. Navigate to ride-detail for confirmation
    router.push('/(main)/ride-detail');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
        
        {/* Top Booking Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.vehicleCircle}>
              <Ionicons 
                name={ride.vehicle_type === 'bike' ? 'bicycle' : ride.vehicle_type === 'auto' ? 'car-sport' : 'car'} 
                size={28} 
                color={COLORS.primary} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingId}>{bookingId}</Text>
              <Text style={styles.createdDate}>{createdDate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{getStatusLabel(status)}</Text>
            </View>
          </View>
        </View>

        {/* Location Timeline Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <View style={styles.timelineRow}>
            <View style={styles.markerContainer}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
              <View style={styles.line} />
              <Ionicons name="location" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.addressContainer}>
              <View>
                <Text style={styles.addressLabel}>Pickup Location</Text>
                <Text style={styles.addressText}>{ride.pickup_location || 'Pickup'}</Text>
                <Text style={styles.timeText}>{pickupTime}</Text>
              </View>
              <View style={{ height: 24 }} />
              <View>
                <Text style={styles.addressLabel}>Drop Location</Text>
                <Text style={styles.addressText}>{ride.drop_location || 'Drop'}</Text>
                <Text style={styles.timeText}>{dropTime}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ride Stats Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.statValue}>{ride.distance_km || '--'} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.statValue}>{ride.duration_min || '--'} mins</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="card-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.statValue}>{ride.payment_method === 'cash' ? 'Cash' : 'Online'}</Text>
              <Text style={styles.statLabel}>Payment</Text>
            </View>
          </View>
        </View>

        {/* Fare Card */}
        <View style={styles.card}>
          <View style={styles.fareHeader}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <Text style={styles.totalAmount}>{formatCurrency(ride.fare_total || 0)}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Base Fare</Text>
            <Text style={styles.fareValue}>{formatCurrency(ride.fare_total ? ride.fare_total * 0.9 : 0)}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Taxes & Fees</Text>
            <Text style={styles.fareValue}>{formatCurrency(ride.fare_total ? ride.fare_total * 0.1 : 0)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnGroup}>
          <TouchableOpacity 
            style={styles.rebookBtn}
            onPress={handleRebook}
            activeOpacity={0.8}
          >
            <View style={styles.rebookContent}>
              <View style={styles.rebookMain}>
                <Ionicons name="repeat" size={20} color={COLORS.white} />
                <Text style={styles.rebookText}>Book this trip again</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.white} opacity={0.7} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpBtn} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.helpText}>Need help with this trip?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, sub, bold }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={{ marginRight: 12, marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, bold && { fontWeight: '800' }]}>{label}</Text>
        {!!sub && <Text style={styles.detailSub}>{sub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  redHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    alignItems: 'center',
  },
  lekarLogo: { fontSize: 28, fontWeight: '800', color: COLORS.white, fontStyle: 'italic' },
  // Refined Card Layout
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12, // Reduced rounding to match original
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22, // Perfect circle
    backgroundColor: '#F8F9FA', // Cleaner light gray/white
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  bookingId: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  createdDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 14 },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 14 },
  markerContainer: { alignItems: 'center', width: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  line: { width: 2, height: 40, backgroundColor: '#F1F3F5', marginVertical: 4 },
  addressContainer: { flex: 1 },
  addressLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textLight, letterSpacing: 0.5, marginBottom: 2 },
  addressText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  timeText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  // Stats Row
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 30, backgroundColor: '#F1F3F5' },

  // Fare
  fareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalAmount: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fareLabel: { fontSize: 13, color: COLORS.textSecondary },
  fareValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  // Buttons
  btnGroup: { paddingHorizontal: 16, marginTop: 10, gap: 12, marginBottom: 20 },
  rebookBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  rebookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rebookMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rebookText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  helpText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});



