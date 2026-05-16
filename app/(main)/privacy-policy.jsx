import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <LekarHeader onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Privacy Policy</Text>
          <Text style={s.pageSub}>Last updated: May 2025</Text>
        </View>
        <View style={s.card}>
          <Text style={s.heading}>Information We Collect</Text>
          <Text style={s.body}>We collect information you provide directly, such as your name, phone number, email, and location data when using the app.</Text>
          <Text style={s.heading}>How We Use Your Information</Text>
          <Text style={s.body}>Your information is used to provide and improve our services, process payments, communicate with you, and ensure safety during rides.</Text>
          <Text style={s.heading}>Data Sharing</Text>
          <Text style={s.body}>We share your information with drivers to facilitate rides, with payment processors, and as required by law. We do not sell your personal data.</Text>
          <Text style={s.heading}>Data Security</Text>
          <Text style={s.body}>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</Text>
          <Text style={s.heading}>Your Rights</Text>
          <Text style={s.body}>You have the right to access, correct, or delete your personal data. Contact us at privacy@lekar.in for any data-related requests.</Text>
          <Text style={s.heading}>Contact</Text>
          <Text style={s.body}>For privacy-related inquiries, reach us at privacy@lekar.in.</Text>
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
