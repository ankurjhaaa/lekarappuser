import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { ridesAPI } from '../../src/api/rides';
import { formatCurrency } from '../../src/utils/helpers';
import LekarHeader from '../../src/components/LekarHeader';

export default function RideHistoryDetailScreen() {
  const params = useLocalSearchParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LekarHeader onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LekarHeader onBack={() => router.back()} />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LekarHeader onBack={() => router.back()} />

      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Ride Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Booking ID Card */}
        <View style={styles.bookingCard}>
          <View style={styles.carImageBox}>
            <Ionicons name="car-sport" size={40} color={COLORS.textLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingId}>{bookingId}</Text>
            <Text style={styles.bookingIdLabel}>Booking ID</Text>
            <View style={[styles.statusBadge, { borderColor: getStatusColor(status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{getStatusLabel(status)}</Text>
            </View>
          </View>
        </View>

        {/* Ride Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ride Details</Text>
          
          <DetailRow icon="person-outline" label="LekarGo" sub={`${ride.distance_km || '--'} km • ${ride.duration_min || '--'} mins`} />
          <DetailRow icon="calendar-outline" label={createdDate} />
          <DetailRow icon="card-outline" label={ride.payment_method === 'cash' ? 'Cash' : 'Online'} />
          {ride.fare_total && (
            <DetailRow icon="cash-outline" label={`Total Fare: ${formatCurrency(ride.fare_total)}`} bold />
          )}
        </View>

        {/* Pickup / Drop Timeline */}
        <View style={styles.sectionCard}>
          <View style={styles.timelineContainer}>
            {/* PICKUP */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineDotContainer}>
                <View style={[styles.timelineDot, { backgroundColor: COLORS.success }]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineLabel}>PICKUP AT</Text>
                <Text style={styles.timelineAddress}>{ride.pickup_location || 'Pickup'}</Text>
                <Text style={styles.timelineTime}>{pickupTime}</Text>
              </View>
            </View>

            {/* DROP */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineDotContainer}>
                <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.timelineLabel, { color: COLORS.primary }]}>DROP AT</Text>
                <Text style={styles.timelineAddress}>{ride.drop_location || 'Drop'}</Text>
                <Text style={styles.timelineTime}>{dropTime}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cancellation Reason (if cancelled) */}
        {status === 'canceled' && ride.cancel_reason && (
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Reason of Cancellation</Text>
            <Text style={styles.cancelReason}>{ride.cancel_reason}</Text>
          </View>
        )}

        {/* Help Button */}
        <TouchableOpacity style={styles.helpBtn} activeOpacity={0.7}>
          <Ionicons name="headset-outline" size={18} color={COLORS.primary} />
          <Text style={styles.helpBtnText}>Need help with this ride?</Text>
        </TouchableOpacity>
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
        {sub && <Text style={styles.detailSub}>{sub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  redHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    alignItems: 'center',
  },
  lekarLogo: { fontSize: 28, fontWeight: '800', color: COLORS.white, fontStyle: 'italic' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },

  // Booking ID Card
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: SIZES.radiusXl,
    padding: 16,
    ...SHADOWS.small,
  },
  carImageBox: {
    width: 80, height: 60, borderRadius: 10, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  bookingId: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text },
  bookingIdLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 4, borderWidth: 1.5, marginTop: 6,
  },
  statusText: { fontSize: 10, fontWeight: '700' },

  // Section cards
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: SIZES.radiusXl,
    padding: 18,
    ...SHADOWS.small,
  },
  sectionTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text, marginBottom: 14 },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  detailLabel: { fontSize: SIZES.md, fontWeight: '500', color: COLORS.text },
  detailSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  // Timeline
  timelineContainer: { },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineDotContainer: { alignItems: 'center', marginRight: 14, width: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, height: 50, backgroundColor: COLORS.border, marginTop: 4 },
  timelineLabel: { fontSize: SIZES.xs, fontWeight: '800', color: COLORS.success, letterSpacing: 0.5 },
  timelineAddress: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500', marginTop: 4, lineHeight: 20 },
  timelineTime: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 4, marginBottom: 14 },

  // Cancel reason
  cancelReason: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },

  // Help
  helpBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 20, paddingVertical: 14,
    borderWidth: 1.5, borderColor: COLORS.primary + '30', borderRadius: SIZES.radiusXl,
  },
  helpBtnText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.primary },
});
