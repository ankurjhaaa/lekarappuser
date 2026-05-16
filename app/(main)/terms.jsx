import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';

export default function TermsScreen() {
  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Terms & Conditions</Text>
          <Text style={s.pageSub}>Last updated: May 2025</Text>
        </View>
        <View style={s.card}>
          <Text style={s.heading}>1. Acceptance of Terms</Text>
          <Text style={s.body}>By accessing and using the Lekar mobile application, you accept and agree to be bound by the terms and provision of this agreement.</Text>
          <Text style={s.heading}>2. Use of Service</Text>
          <Text style={s.body}>Lekar provides a platform connecting riders with drivers. We do not provide transportation services directly. Drivers are independent contractors.</Text>
          <Text style={s.heading}>3. User Accounts</Text>
          <Text style={s.body}>You must register for an account by providing accurate information. You are responsible for maintaining the confidentiality of your account credentials.</Text>
          <Text style={s.heading}>4. Payments</Text>
          <Text style={s.body}>Payment for rides is processed through the Lekar platform. Fares are calculated based on distance, time, and vehicle type. Cancellation fees may apply.</Text>
          <Text style={s.heading}>5. Safety</Text>
          <Text style={s.body}>Both riders and drivers are expected to maintain a safe and respectful environment. Any violations may result in account suspension or termination.</Text>
          <Text style={s.heading}>6. Limitation of Liability</Text>
          <Text style={s.body}>Lekar shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.</Text>
          <Text style={s.heading}>7. Contact Us</Text>
          <Text style={s.body}>For questions about these Terms, contact us at support@lekar.in or call our helpline.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  pageSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: SIZES.radiusXl, padding: 20 },
  heading: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 6 },
  body: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },
});
