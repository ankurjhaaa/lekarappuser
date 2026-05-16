import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
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
        
        <View style={s.card}>
          <Text style={s.cardTitle}>Push Notifications</Text>
          <ToggleRow label="Global Notifications" sub="Receive all app alerts" value={pushEnabled} onToggle={setPushEnabled} />
          <ToggleRow label="Ride Updates" sub="Booking status and driver arrival" value={rideUpdates} onToggle={setRideUpdates} />
          <ToggleRow label="Offers & Coupons" sub="Best deals and promotional alerts" value={offers} onToggle={setOffers} />
          <ToggleRow label="Payment Alerts" sub="Receipts and payment confirmations" value={payments} onToggle={setPayments} last />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Communication Channels</Text>
          <ToggleRow label="SMS Notifications" sub="Important updates via text" value={sms} onToggle={setSms} />
          <ToggleRow label="Email Notifications" sub="Monthly reports and receipts" value={email} onToggle={setEmail} last />
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>We only send notifications that are relevant to your experience.</Text>
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
      <Switch 
        value={value} 
        onValueChange={onToggle} 
        trackColor={{ true: COLORS.primary, false: '#F1F3F5' }} 
        thumbColor={COLORS.white} 
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  card: { 
    backgroundColor: COLORS.white, 
    marginHorizontal: 16, 
    marginTop: 16, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: '#F1F3F5',
    ...SHADOWS.small 
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 },
  
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  toggleSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },

  footer: { padding: 30, alignItems: 'center' },
  footerText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', lineHeight: 18, fontWeight: '500' },
});

