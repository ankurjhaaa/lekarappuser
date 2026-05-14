import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { formatCurrency, formatDistance } from '../../utils/helpers';

export default function DriverDetailModal({ visible, onClose, booking, driverInfo }) {
  if (!booking) return null;
  const driverName = booking?.driver?.name || booking?.driver_name || 'Captain';
  const phone = booking?.driver?.phone || booking?.driver_phone;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        <View style={st.container}>
          <View style={st.handle}><View style={st.handleBar} /></View>

          {/* Driver Profile */}
          <View style={st.profileRow}>
            <View style={st.avatar}>
              <Ionicons name="person" size={32} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={st.name}>{driverName}</Text>
              <View style={st.metaRow}>
                <View style={st.ratingBadge}>
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={st.ratingText}>{driverInfo?.rating || '5.0'}</Text>
                </View>
                <Text style={st.vehicleType}>{driverInfo?.vehicle_type || booking?.vehicle_type || ''}</Text>
              </View>
            </View>
            {phone && (
              <TouchableOpacity style={st.callBtn} onPress={() => Linking.openURL(`tel:${phone}`)}>
                <Ionicons name="call" size={22} color={COLORS.success} />
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle Info */}
          <View style={st.infoCard}>
            <View style={st.infoRow}>
              <Ionicons name="car-outline" size={20} color={COLORS.textSecondary} />
              <Text style={st.infoLabel}>Vehicle</Text>
              <Text style={st.infoValue}>{driverInfo?.vehicle_name || booking?.vehicle_type || '--'}</Text>
            </View>
            <View style={st.infoRow}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
              <Text style={st.infoLabel}>Number Plate</Text>
              <Text style={[st.infoValue, { fontWeight: '900', letterSpacing: 1 }]}>{driverInfo?.number_plate || '--'}</Text>
            </View>
          </View>

          {/* Trip Info */}
          <View style={st.infoCard}>
            <View style={st.infoRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.success} />
              <Text style={st.infoLabel}>Pickup</Text>
              <Text style={st.infoValue} numberOfLines={1}>{booking?.pickup_location || '--'}</Text>
            </View>
            <View style={st.infoRow}>
              <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
              <Text style={st.infoLabel}>Drop</Text>
              <Text style={st.infoValue} numberOfLines={1}>{booking?.drop_location || '--'}</Text>
            </View>
            <View style={st.infoRow}>
              <Ionicons name="speedometer-outline" size={20} color={COLORS.textSecondary} />
              <Text style={st.infoLabel}>Distance</Text>
              <Text style={st.infoValue}>{formatDistance(booking?.distance_km)}</Text>
            </View>
            <View style={st.infoRow}>
              <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              <Text style={st.infoLabel}>Fare</Text>
              <Text style={[st.infoValue, { color: COLORS.primary, fontWeight: '800' }]}>{formatCurrency(booking?.fare_total)}</Text>
            </View>
            <View style={st.infoRow}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.textSecondary} />
              <Text style={st.infoLabel}>Payment</Text>
              <Text style={st.infoValue}>{booking?.payment_method === 'cash' ? 'Cash' : 'Online'}</Text>
            </View>
          </View>

          <TouchableOpacity style={st.closeBtn} onPress={onClose}>
            <Text style={st.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, maxHeight: '85%' },
  handle: { alignItems: 'center', paddingVertical: 10 },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  vehicleType: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500', textTransform: 'capitalize' },
  callBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.success + '15', justifyContent: 'center', alignItems: 'center' },
  infoCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  infoLabel: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, maxWidth: '50%', textAlign: 'right' },
  closeBtn: { marginHorizontal: 20, marginTop: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  closeBtnText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
});
