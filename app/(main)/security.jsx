import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

export default function SecurityScreen() {
  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Main Security Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Security</Text>
          <SecurityRow icon="lock-closed-outline" title="Change Password" sub="Update your account password" />
          <SecurityRow icon="finger-print-outline" title="Biometric Login" sub="Use fingerprint or face ID to login" />
          <SecurityRow icon="shield-checkmark-outline" title="Two-Factor Auth" sub="Add extra layer of protection" />
          <SecurityRow icon="log-in-outline" title="Active Sessions" sub="Manage your logged-in devices" last />
        </View>

        {/* Recent Activity Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Recent Activity</Text>
          <ActivityRow action="Account Login" device="iPhone 14 Pro • Delhi" time="Just now" />
          <ActivityRow action="Password Changed" device="Web Browser • Chrome" time="2 days ago" last />
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Protect your account by enabling two-factor authentication and choosing a strong password.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SecurityRow({ icon, title, sub, last }) {
  return (
    <TouchableOpacity style={[s.row, !last && s.rowBorder]} activeOpacity={0.7}>
      <View style={s.iconCircle}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

function ActivityRow({ action, device, time, last }) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{action}</Text>
        <Text style={s.rowSub}>{device}</Text>
      </View>
      <Text style={s.timeText}>{time}</Text>
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
  
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  timeText: { fontSize: 11, color: COLORS.textLight, fontWeight: '700' },

  footer: { padding: 30, alignItems: 'center' },
  footerText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', lineHeight: 18, fontWeight: '500' },
});

