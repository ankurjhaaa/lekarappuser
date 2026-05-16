import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
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

  const renderRide = ({ item }) => {
    const isCompleted = item.status === 'ride_completed';
    const isCanceled = item.status === 'canceled';
    const date = new Date(item.created_at);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        style={styles.rideCard}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/(main)/ride-history-detail', params: { bookingId: item.id } })}
      >
        {/* Top Info: Vehicle & Status & Fare */}
        <View style={styles.cardHeader}>
          <View style={styles.vehicleInfo}>
            <View style={[styles.vehicleIconWrap, isCanceled && { backgroundColor: '#F5F5F5' }]}>
              <Ionicons 
                name={item.vehicle_type === 'bike' ? 'bicycle' : item.vehicle_type === 'auto' ? 'car-sport' : 'car'} 
                size={22} 
                color={isCanceled ? COLORS.textLight : COLORS.primary} 
              />
            </View>
            <View>
              <Text style={styles.vehicleName}>{item.vehicle_type}</Text>
              <Text style={styles.rideTime}>{dateStr}, {timeStr}</Text>
            </View>
          </View>
          
          <View style={styles.fareSection}>
            <Text style={[styles.rideFare, isCanceled && styles.canceledText]}>
              {formatCurrency(item.fare_total || 0)}
            </Text>
            {isCanceled ? (
              <View style={styles.statusPillCanceled}><Text style={styles.statusPillText}>Cancelled</Text></View>
            ) : isCompleted ? (
              <View style={styles.statusPillSuccess}><Text style={styles.statusPillText}>Success</Text></View>
            ) : (
              <View style={styles.statusPillPending}><Text style={styles.statusPillText}>Ongoing</Text></View>
            )}
          </View>
        </View>

        {/* Address Timeline (Compact) */}
        <View style={styles.addressSection}>
          <View style={styles.timeline}>
            <View style={styles.dotGreen} />
            <View style={styles.line} />
            <View style={styles.dotRed} />
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText} numberOfLines={1}>{item.pickup_location || 'Pickup Point'}</Text>
            <Text style={styles.addressText} numberOfLines={1}>{item.drop_location || 'Destination'}</Text>
          </View>
        </View>

        {/* Bottom Action */}
        <View style={styles.cardFooter}>
          <Text style={styles.detailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Your Bookings</Text>
      </View>

      {/* Tabs Filter (Matching Image) */}
      <View style={styles.tabRow}>
        {[
          { key: 'all', label: 'All trips', icon: 'briefcase' },
          { key: 'upcoming', label: 'Upcoming', icon: 'calendar-outline' },
          { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
        ].map(f => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.6}
            >
              <Ionicons 
                name={f.icon} 
                size={20} 
                color={isActive ? COLORS.primary : '#5F6368'} 
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>


      <FlatList
        data={filteredRides}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRide}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRides(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="car-outline" size={48} color={COLORS.textLight} />
              </View>
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubtext}>Your trip history will show up here</Text>
              <TouchableOpacity style={styles.bookNowBtn} onPress={() => router.push('/(main)/(tabs)/home')}>
                <Text style={styles.bookNowText}>Book a Ride</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  titleRow: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  pageTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  // Tabs (Matching Image)
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 10,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5F6368',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // List
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },

  // Ride Card
  rideCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  rideTime: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  
  fareSection: { alignItems: 'flex-end', gap: 6 },
  rideFare: { fontSize: 17, fontWeight: '900', color: COLORS.text },
  canceledText: { color: COLORS.textLight, textDecorationLine: 'line-through' },
  
  statusPillSuccess: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillCanceled: { backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillPending: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase' },

  // Address Section
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 14,
  },
  timeline: { alignItems: 'center', gap: 2 },
  dotGreen: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.success },
  dotRed: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary },
  line: { width: 1, height: 18, backgroundColor: '#DEE2E6', borderStyle: 'dashed' },
  
  addressInfo: { flex: 1, gap: 8 },
  addressText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    gap: 4,
  },
  detailsText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // Empty State
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  bookNowBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  bookNowText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});

