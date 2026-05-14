import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import CustomModal from '../CustomModal';

const CANCEL_REASONS = [
  'Driver is too far',
  'Changed my plans',
  'Price is too high',
  'Found another ride',
  'Wrong pickup location',
  'Driver asked to cancel',
  'Other reason',
];

export default function CancelModal({ visible, onClose, onConfirm, loading }) {
  return (
    <CustomModal visible={visible} onClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={st.container}>
        <View style={st.handle}><View style={st.handleBar} /></View>
        <Text style={st.title}>Cancel Ride</Text>
        <Text style={st.subtitle}>Please select a reason for cancellation</Text>
        <ScrollView style={st.list} showsVerticalScrollIndicator={false}>
          {CANCEL_REASONS.map((reason, i) => (
            <TouchableOpacity
              key={i}
              style={st.reasonItem}
              onPress={() => onConfirm(reason)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons name="radio-button-off" size={20} color={COLORS.textSecondary} />
              <Text style={st.reasonText}>{reason}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={st.closeBtn} onPress={onClose}>
          <Text style={st.closeBtnText}>Don't Cancel</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </CustomModal>
  );
}

const st = StyleSheet.create({
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, maxHeight: '75%' },
  handle: { alignItems: 'center', paddingVertical: 10 },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  title: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text, paddingHorizontal: 20 },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, paddingHorizontal: 20, marginTop: 4, marginBottom: 16 },
  list: { paddingHorizontal: 20 },
  reasonItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reasonText: { flex: 1, fontSize: SIZES.md, fontWeight: '500', color: COLORS.text },
  closeBtn: { marginHorizontal: 20, marginTop: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  closeBtnText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
});
