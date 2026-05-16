import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';

export default function SecurityScreen() {
  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Security</Text>
          <Text style={s.pageSub}>Manage your security settings</Text>
        </View>

        <View style={s.card}>
          <SecurityRow icon="lock-closed-outline" title="Change Password" sub="Update your account password" />
          <SecurityRow icon="finger-print-outline" title="Biometric Login" sub="Use fingerprint or face ID to login" />
          <SecurityRow icon="phone-portrait-outline" title="Two-Factor Authentication" sub="Add an extra layer of security" />
          <SecurityRow icon="log-in-outline" title="Active Sessions" sub="View and manage logged-in devices" last />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Recent Activity</Text>
          <ActivityRow action="Login" device="Android Phone" time="Today, 2:30 PM" />
          <ActivityRow action="Password Changed" device="Web Browser" time="15 May, 10:00 AM" last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SecurityRow({ icon, title, sub, last }) {
  return (
    <TouchableOpacity style={[s.row, !last && s.rowBorder]} activeOpacity={0.6}>
      <Ionicons name={icon} size={20} color={COLORS.primary} style={{ marginRight: 14 }} />
      <View style={{ flex: 1 }}><Text style={s.rowTitle}>{title}</Text><Text style={s.rowSub}>{sub}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

function ActivityRow({ action, device, time, last }) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={{ flex: 1 }}><Text style={s.rowTitle}>{action}</Text><Text style={s.rowSub}>{device}</Text></View>
      <Text style={s.timeText}>{time}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  pageSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, borderRadius: SIZES.radiusXl, ...SHADOWS.small },
  cardTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowTitle: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  rowSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  timeText: { fontSize: SIZES.xs, color: COLORS.textLight },
});
