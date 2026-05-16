import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';
import useAuthStore from '../../src/store/authStore';

export default function PersonalInfoScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Personal Information</Text>
          <Text style={s.pageSub}>Manage your personal details</Text>
        </View>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <Ionicons name="person" size={50} color={COLORS.textLight} />
          </View>
          <TouchableOpacity style={s.changePicBtn}>
            <Ionicons name="camera-outline" size={16} color={COLORS.primary} />
            <Text style={s.changePicText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={s.card}>
          <FieldRow label="Full Name" value={user?.name || 'Not set'} icon="person-outline" />
          <FieldRow label="Phone Number" value={user?.phone ? `+91 ${user.phone}` : 'Not set'} icon="call-outline" />
          <FieldRow label="Email" value={user?.email || 'Not set'} icon="mail-outline" />
          <FieldRow label="Gender" value="Not set" icon="male-female-outline" last />
        </View>

        {/* Emergency Contact */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Emergency Contact</Text>
          <FieldRow label="Contact Name" value="Not set" icon="person-add-outline" />
          <FieldRow label="Contact Number" value="Not set" icon="call-outline" last />
        </View>

        <TouchableOpacity style={s.saveBtn}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldRow({ label, value, icon, last }) {
  return (
    <View style={[s.fieldRow, !last && s.fieldRowBorder]}>
      <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={s.fieldLabel}>{label}</Text>
        <Text style={s.fieldValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  pageSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  avatarSection: { alignItems: 'center', paddingVertical: 10 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  changePicBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  changePicText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.primary },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, borderRadius: SIZES.radiusXl, padding: 4, ...SHADOWS.small },
  cardTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  fieldRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  fieldLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  fieldValue: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  saveBtn: { backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 24, paddingVertical: 16, borderRadius: SIZES.radiusXl, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
});
