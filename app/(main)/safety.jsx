import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';

export default function SafetyScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <LekarHeader onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Safety</Text>
          <Text style={s.pageSub}>Your safety is our priority</Text>
        </View>

        <View style={s.card}>
          <SafetyRow icon="shield-checkmark" color={COLORS.success} title="Ride Insurance" sub="All rides are insured for your safety" />
          <SafetyRow icon="location" color={COLORS.primary} title="Live Ride Tracking" sub="Share your ride status in real-time with trusted contacts" />
          <SafetyRow icon="call" color="#1565C0" title="Emergency SOS" sub="Quick access to emergency services during a ride" />
          <SafetyRow icon="people" color="#7B1FA2" title="Trusted Contacts" sub="Add contacts who can track your rides" last />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Safety Tips</Text>
          <TipRow text="Always verify the driver's name, photo and vehicle details before getting in" />
          <TipRow text="Share your ride details with a trusted contact" />
          <TipRow text="Sit in the back seat for added safety" />
          <TipRow text="Keep your phone charged during rides" last />
        </View>

        <TouchableOpacity style={s.emergencyBtn}>
          <Ionicons name="warning" size={20} color={COLORS.white} />
          <Text style={s.emergencyBtnText}>Emergency SOS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SafetyRow({ icon, color, title, sub, last }) {
  return (
    <TouchableOpacity style={[s.row, !last && s.rowBorder]} activeOpacity={0.6}>
      <View style={[s.rowIcon, { backgroundColor: color + '15' }]}><Ionicons name={icon} size={20} color={color} /></View>
      <View style={{ flex: 1 }}><Text style={s.rowTitle}>{title}</Text><Text style={s.rowSub}>{sub}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

function TipRow({ text, last }) {
  return (
    <View style={[s.tipRow, !last && s.rowBorder]}>
      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} style={{ marginRight: 10, marginTop: 2 }} />
      <Text style={s.tipText}>{text}</Text>
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
  rowIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  rowSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, paddingVertical: 14 },
  tipText: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.error, marginHorizontal: 16, marginTop: 24, paddingVertical: 16, borderRadius: SIZES.radiusXl },
  emergencyBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
});
