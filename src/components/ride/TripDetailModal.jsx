import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { formatCurrency, formatDistance } from '../../utils/helpers';
import CustomModal from '../CustomModal';

export default function TripDetailModal({ visible, onClose, booking, liveDistanceKm, liveETA }) {
  if (!booking) return null;

  const rows = [
    { icon: 'location-outline', iconColor: COLORS.success, label: 'Pickup', value: booking.pickup_location || '--' },
    { icon: 'navigate-outline', iconColor: COLORS.primary, label: 'Drop', value: booking.drop_location || '--' },
    { icon: 'speedometer-outline', iconColor: COLORS.textSecondary, label: 'Distance', value: formatDistance(liveDistanceKm || booking.distance_km) },
    { icon: 'time-outline', iconColor: COLORS.textSecondary, label: 'Duration', value: `${liveETA || booking.duration_min || '--'} min` },
    { icon: 'car-outline', iconColor: COLORS.textSecondary, label: 'Vehicle', value: (booking.vehicle_type || '--').charAt(0).toUpperCase() + (booking.vehicle_type || '--').slice(1) },
    { icon: 'cash-outline', iconColor: COLORS.primary, label: 'Fare', value: formatCurrency(booking.fare_total), highlight: true },
    { icon: 'wallet-outline', iconColor: COLORS.textSecondary, label: 'Payment', value: booking.payment_method === 'cash' ? 'Cash' : 'Online' },
  ];

  return (
    <CustomModal visible={visible} onClose={onClose}>
      <View style={st.container}>
        <View style={st.handle}><View style={st.handleBar} /></View>
        <Text style={st.title}>Trip Details</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Route visual */}
          <View style={st.routeVisual}>
            <View style={st.routeDots}>
              <View style={[st.dot, { backgroundColor: COLORS.success }]} />
              <View style={st.routeLine} />
              <View style={[st.dot, { backgroundColor: COLORS.primary }]} />
            </View>
            <View style={st.routeTexts}>
              <View style={st.routeTextItem}>
                <Text style={st.routeLabel}>Pickup</Text>
                <Text style={st.routeAddr} numberOfLines={1}>{booking.pickup_location || '--'}</Text>
              </View>
              <View style={[st.routeTextItem, { marginTop: 20 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={st.routeLabel}>Drop-off</Text>
                  <TouchableOpacity onPress={() => { onClose(); /* Handle edit outside */ }} style={{ padding: 4 }}>
                    <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={st.routeAddr} numberOfLines={1}>{booking.drop_location || '--'}</Text>
              </View>
            </View>
          </View>

          {/* Fare breakdown */}
          <View style={st.infoCard}>
            {rows.filter(r => !['Pickup', 'Drop'].includes(r.label)).map((row, i) => (
              <View key={i} style={st.infoRow}>
                <Ionicons name={row.icon} size={20} color={row.iconColor} />
                <Text style={st.infoLabel}>{row.label}</Text>
                <Text style={[st.infoValue, row.highlight && { color: COLORS.primary, fontWeight: '800' }]}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Segments history if available */}
          {booking.segments && booking.segments.length > 1 && (
            <View style={st.segmentCard}>
              <Text style={st.segmentTitle}>Route Changes</Text>
              {booking.segments.map((seg, i) => (
                <View key={i} style={st.segmentRow}>
                  <View style={[st.segDot, { backgroundColor: i === booking.segments.length - 1 ? COLORS.primary : COLORS.textLight }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.segLabel}>{i === 0 ? 'Original' : `Change ${i}`}</Text>
                    <Text style={st.segAddr} numberOfLines={1}>{seg.to_address}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={st.closeBtn} onPress={onClose}>
            <Text style={st.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </CustomModal>
  );
}

const st = StyleSheet.create({
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, maxHeight: '85%' },
  handle: { alignItems: 'center', paddingVertical: 10 },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text, paddingHorizontal: 20, marginBottom: 16 },

  // Route visual
  routeVisual: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  routeDots: { alignItems: 'center', width: 20, paddingTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, height: 30, backgroundColor: COLORS.border, marginVertical: 4 },
  routeTexts: { flex: 1, marginLeft: 10 },
  routeTextItem: {},
  routeLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  routeAddr: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginTop: 2 },

  // Info card
  infoCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  infoLabel: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, maxWidth: '50%', textAlign: 'right' },

  // Segments
  segmentCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  segmentTitle: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10 },
  segmentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  segDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  segLabel: { fontSize: 11, color: COLORS.textSecondary },
  segAddr: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginTop: 2 },

  closeBtn: { marginHorizontal: 20, marginTop: 4, paddingVertical: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  closeBtnText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
});
