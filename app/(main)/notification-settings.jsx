import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';
import { useState } from 'react';

export default function NotificationSettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [rideUpdates, setRideUpdates] = useState(true);
  const [offers, setOffers] = useState(true);
  const [payments, setPayments] = useState(true);
  const [sms, setSms] = useState(false);
  const [email, setEmail] = useState(true);

  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Notifications</Text>
          <Text style={s.pageSub}>Manage notification preferences</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Push Notifications</Text>
          <ToggleRow label="Enable Push Notifications" value={pushEnabled} onToggle={setPushEnabled} />
          <ToggleRow label="Ride Updates" sub="Booking confirmations, driver arrival" value={rideUpdates} onToggle={setRideUpdates} />
          <ToggleRow label="Offers & Promotions" sub="Discounts, coupons, and deals" value={offers} onToggle={setOffers} />
          <ToggleRow label="Payment Alerts" sub="Payment confirmations and receipts" value={payments} onToggle={setPayments} last />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Other Channels</Text>
          <ToggleRow label="SMS Notifications" value={sms} onToggle={setSms} />
          <ToggleRow label="Email Notifications" value={email} onToggle={setEmail} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({ label, sub, value, onToggle, last }) {
  return (
    <View style={[s.toggleRow, !last && s.toggleRowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={s.toggleLabel}>{label}</Text>
        {sub && <Text style={s.toggleSub}>{sub}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: COLORS.primary, false: COLORS.border }} thumbColor={COLORS.white} />
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  toggleLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  toggleSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
});
