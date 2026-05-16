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
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import { ridesAPI } from '../../../src/api/rides';
import { formatCurrency } from '../../../src/utils/helpers';
import LekarHeader from '../../../src/components/LekarHeader';
import SidebarMenu from '../../../src/components/SidebarMenu';

export default function RidesScreen() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const fetchRides = async () => {
    try {
      const res = await ridesAPI.history();
      setRides(res.data.data || []);
    } catch (e) { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchRides(); }, []);

  const filteredRides = rides.filter(r => {
    if (filter === 'completed') return r.status === 'ride_completed';
    if (filter === 'upcoming') return !['ride_completed', 'canceled'].includes(r.status);
    return true;
  });

  const renderRide = ({ item }) => (
    <TouchableOpacity
      style={styles.rideCard}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(main)/ride-history-detail', params: { bookingId: item.id } })}
    >
      <View style={styles.rideRow}>
        <View style={styles.carImageBox}>
          <Ionicons name="car-sport" size={36} color={COLORS.textLight} />
        </View>
        <View style={styles.rideInfo}>
          <Text style={styles.rideDestination} numberOfLines={1}>
            {item.drop_location || 'Destination'}
          </Text>
          <Text style={styles.rideDate}>
            {new Date(item.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.status === 'canceled' && (
            <View style={[styles.statusBadge, { borderColor: COLORS.primary }]}>
              <Text style={[styles.statusText, { color: COLORS.primary }]}>Cancelled</Text>
            </View>
          )}
          {item.status === 'ride_completed' && (
            <View style={[styles.statusBadge, { borderColor: COLORS.success }]}>
              <Text style={[styles.statusText, { color: COLORS.success }]}>Completed</Text>
            </View>
          )}
        </View>
        <View style={styles.fareSection}>
          <Text style={styles.rideFare}>{formatCurrency(item.fare_total)}</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All trips', icon: 'briefcase-outline' },
          { key: 'upcoming', label: 'Upcoming', icon: 'calendar-outline' },
          { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons name={f.icon} size={16} color={filter === f.key ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRides}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRide}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRides(); }} tintColor={COLORS.primary} />}
        ListFooterComponent={
          <TouchableOpacity style={styles.helpCard} activeOpacity={0.7}>
            <View style={styles.helpIconWrap}>
              <Ionicons name="headset-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.helpTitle}>Need help with a booking?</Text>
              <Text style={styles.helpSub}>Get support for your rides</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
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
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, gap: 12 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, gap: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: COLORS.primary },
  filterTabText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textSecondary },
  filterTabTextActive: { color: COLORS.primary },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  rideCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: 14, marginBottom: 12, ...SHADOWS.small },
  rideRow: { flexDirection: 'row', alignItems: 'center' },
  carImageBox: { width: 70, height: 55, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rideInfo: { flex: 1 },
  rideDestination: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  rideDate: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4, borderWidth: 1.5 },
  statusText: { fontSize: 10, fontWeight: '700' },
  fareSection: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rideFare: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text },
  helpCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: 16, marginTop: 8, ...SHADOWS.small },
  helpIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  helpTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  helpSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textSecondary, marginTop: 16 },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.textLight, marginTop: 4 },
});
