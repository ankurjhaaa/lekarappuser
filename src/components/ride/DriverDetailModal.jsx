import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import CustomModal from '../CustomModal';

export default function DriverDetailModal({ visible, onClose, booking, driverInfo }) {
  if (!booking) return null;
  const driverName = booking?.driver?.name || booking?.driver_name || 'Captain';
  const phone = booking?.driver?.phone || booking?.driver_phone;
  const joinDate = driverInfo?.created_at ? new Date(driverInfo.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null;

  return (
    <CustomModal visible={visible} onClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={st.container}>
        <View style={st.handle}><View style={st.handleBar} /></View>

        {/* Driver Profile Header */}
        <View style={st.profileSection}>
          <View style={st.avatarLarge}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <Text style={st.driverName}>{driverName}</Text>
          <View style={st.ratingRow}>
            <View style={st.ratingBadge}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={st.ratingText}>{driverInfo?.rating || '5.0'}</Text>
            </View>
            <Text style={st.vehicleTypeBadge}>{(driverInfo?.vehicle_type || booking?.vehicle_type || '').toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={st.statsRow}>
          <View style={st.statItem}>
            <Text style={st.statNum}>{driverInfo?.total_rides || '0'}</Text>
            <Text style={st.statLabel}>Total Rides</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={st.statNum}>{driverInfo?.rating || '5.0'}</Text>
            <Text style={st.statLabel}>Rating</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={st.statNum}>{joinDate || '--'}</Text>
            <Text style={st.statLabel}>Since</Text>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={st.infoCard}>
          <View style={st.infoRow}>
            <Ionicons name="car-outline" size={20} color={COLORS.primary} />
            <Text style={st.infoLabel}>Vehicle</Text>
            <Text style={st.infoValue}>{driverInfo?.vehicle_name || booking?.vehicle_type || '--'}</Text>
          </View>
          <View style={st.infoRow}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={st.infoLabel}>Number Plate</Text>
            <Text style={[st.infoValue, { fontWeight: '900', letterSpacing: 1.5 }]}>{driverInfo?.number_plate || '--'}</Text>
          </View>
          <View style={[st.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="chatbubbles-outline" size={20} color={COLORS.primary} />
            <Text style={st.infoLabel}>Languages</Text>
            <Text style={st.infoValue}>Hindi, English</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={st.actionRow}>
          {phone && (
            <TouchableOpacity style={st.actionBtn} onPress={() => Linking.openURL(`tel:${phone}`)}>
              <View style={[st.actionIcon, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="call" size={20} color={COLORS.success} />
              </View>
              <Text style={[st.actionBtnText, { color: COLORS.success }]}>Call</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={st.actionBtn} onPress={onClose}>
            <View style={[st.actionIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            </View>
            <Text style={st.actionBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </CustomModal>
  );
}

const st = StyleSheet.create({
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  handle: { alignItems: 'center', paddingVertical: 10 },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },

  // Profile
  profileSection: { alignItems: 'center', paddingVertical: 16 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  driverName: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  vehicleTypeBadge: { fontSize: 12, fontWeight: '700', color: COLORS.primary, backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, letterSpacing: 1 },

  // Stats
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginHorizontal: 20, borderRadius: 12, backgroundColor: '#F8F9FA', marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  // Info card
  infoCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  infoLabel: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, maxWidth: '50%', textAlign: 'right' },

  // Actions
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 20 },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
