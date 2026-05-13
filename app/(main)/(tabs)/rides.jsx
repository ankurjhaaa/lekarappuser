import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import { ridesAPI } from '../../../src/api/rides';
import { formatCurrency, formatDistance } from '../../../src/utils/helpers';

export default function RidesScreen() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRides = async () => {
    try {
      const res = await ridesAPI.history();
      setRides(res.data.data || []);
    } catch (e) { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchRides(); }, []);

  const getStatusColor = (status) => {
    if (status === 'ride_completed') return COLORS.success;
    if (status === 'canceled') return COLORS.error;
    return COLORS.warning;
  };

  const getStatusLabel = (status) => {
    if (status === 'ride_completed') return 'Completed';
    if (status === 'canceled') return 'Cancelled';
    return status;
  };

  const renderRide = ({ item }) => (
    <TouchableOpacity style={styles.rideCard} activeOpacity={0.8}>
      <View style={styles.rideHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
        <Text style={styles.rideFare}>{formatCurrency(item.fare_total)}</Text>
      </View>

      <View style={styles.rideBody}>
        <View style={styles.locationRow}>
          <View style={styles.dotGreen} />
          <Text style={styles.locationText} numberOfLines={1}>{item.pickup_location}</Text>
        </View>
        <View style={styles.dottedLine} />
        <View style={styles.locationRow}>
          <View style={styles.dotRed} />
          <Text style={styles.locationText} numberOfLines={1}>{item.drop_location}</Text>
        </View>
      </View>

      <View style={styles.rideFooter}>
        <Text style={styles.rideDate}>{new Date(item.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })}</Text>
        <Text style={styles.rideDist}>{formatDistance(item.distance_km)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
      </View>
      <FlatList
        data={rides}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRide}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRides(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No rides yet</Text>
            <Text style={styles.emptySubtext}>Your ride history will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  list: { paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  rideCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16,
    marginBottom: 12, ...SHADOWS.small,
  },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: SIZES.xs, fontWeight: '700' },
  rideFare: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  rideBody: { marginBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  dotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  dottedLine: { width: 1, height: 16, backgroundColor: COLORS.border, marginLeft: 3.5 },
  locationText: { flex: 1, fontSize: SIZES.sm, color: COLORS.text },
  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  rideDate: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  rideDist: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textSecondary, marginTop: 16 },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.textLight, marginTop: 4 },
});
