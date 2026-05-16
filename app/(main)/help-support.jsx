import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';

export default function HelpSupportScreen() {
  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Help & Support</Text>
          <Text style={s.pageSub}>We're here to help you</Text>
        </View>

        {/* Quick Actions */}
        <View style={s.quickRow}>
          <TouchableOpacity style={s.quickCard} onPress={() => Linking.openURL('tel:+911234567890')}>
            <View style={[s.qIcon, { backgroundColor: COLORS.primary + '12' }]}><Ionicons name="call" size={22} color={COLORS.primary} /></View>
            <Text style={s.qText}>Call Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard} onPress={() => Linking.openURL('mailto:support@lekar.in')}>
            <View style={[s.qIcon, { backgroundColor: '#E3F2FD' }]}><Ionicons name="mail" size={22} color="#1565C0" /></View>
            <Text style={s.qText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard}>
            <View style={[s.qIcon, { backgroundColor: '#E8F5E9' }]}><Ionicons name="chatbubbles" size={22} color="#2E7D32" /></View>
            <Text style={s.qText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Frequently Asked Questions</Text>
          <FAQItem q="How do I book a ride?" a="Tap 'Where to?' on the home screen, enter your destination, select a vehicle type, and tap Book." />
          <FAQItem q="How do I cancel a ride?" a="You can cancel a ride from the ride tracking screen before the driver arrives." />
          <FAQItem q="How is the fare calculated?" a="Fares are based on distance, time, and the vehicle type selected." />
          <FAQItem q="How do I contact my driver?" a="Use the call or chat button on the ride tracking screen." />
          <FAQItem q="What payment methods are accepted?" a="We accept Cash and Lekar Wallet payments." last />
        </View>

        {/* Report */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Report an Issue</Text>
          <TouchableOpacity style={s.reportRow}>
            <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} style={{ marginRight: 12 }} />
            <Text style={s.reportText}>Report a safety concern</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.reportRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
            <Text style={s.reportText}>Issue with a past ride</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FAQItem({ q, a, last }) {
  return (
    <View style={[s.faqItem, !last && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
      <Text style={s.faqQ}>{q}</Text>
      <Text style={s.faqA}>{a}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  pageSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  quickCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: 16, alignItems: 'center', gap: 10, ...SHADOWS.small },
  qIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  qText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 20, borderRadius: SIZES.radiusXl, padding: 4, ...SHADOWS.small },
  cardTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  faqItem: { paddingHorizontal: 16, paddingVertical: 14 },
  faqQ: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  faqA: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reportText: { flex: 1, fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
});
