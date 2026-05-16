import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';
import { useState } from 'react';

export default function PrivacyScreen() {
  const [locationSharing, setLocationSharing] = useState(true);
  const [rideHistory, setRideHistory] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Privacy</Text>
          <Text style={s.pageSub}>Manage your privacy settings</Text>
        </View>

        <View style={s.card}>
          <ToggleRow label="Location Sharing" sub="Share location during active rides" value={locationSharing} onToggle={setLocationSharing} />
          <ToggleRow label="Ride History" sub="Store your ride history" value={rideHistory} onToggle={setRideHistory} />
          <ToggleRow label="Analytics" sub="Help us improve with anonymous usage data" value={analytics} onToggle={setAnalytics} last />
        </View>

        <View style={s.card}>
          <TouchableOpacity style={s.actionRow}>
            <Ionicons name="download-outline" size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <Text style={s.actionText}>Download My Data</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} style={{ marginRight: 12 }} />
            <Text style={[s.actionText, { color: COLORS.error }]}>Clear Ride History</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
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
        <Text style={s.toggleSub}>{sub}</Text>
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  toggleLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  toggleSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  actionText: { flex: 1, fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
});
