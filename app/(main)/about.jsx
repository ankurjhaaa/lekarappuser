import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';

export default function AboutScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <LekarHeader onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
        {/* Logo */}
        <View style={s.logoSection}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>L</Text>
          </View>
          <Text style={s.appName}>Lekar</Text>
          <Text style={s.version}>Version 1.0.0</Text>
        </View>

        <View style={s.card}>
          <InfoRow label="App Version" value="1.0.0" />
          <InfoRow label="Build Number" value="2026.05.01" />
          <InfoRow label="Platform" value="Android / iOS" />
          <InfoRow label="Developer" value="Lekar Technologies Pvt. Ltd." last />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>About</Text>
          <Text style={s.aboutText}>
            Lekar is a next-generation ride-hailing platform designed to provide safe, affordable, and reliable transportation across India. Our mission is to make mobility accessible to everyone.
          </Text>
        </View>

        <Text style={s.copyright}>© 2025 Lekar Technologies Pvt. Ltd.</Text>
        <Text style={s.copyright}>All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  logoSection: { alignItems: 'center', paddingVertical: 30 },
  logoCircle: { width: 80, height: 80, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 40, fontWeight: '900', color: COLORS.white, fontStyle: 'italic' },
  appName: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: 12, fontStyle: 'italic' },
  version: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  card: { backgroundColor: COLORS.white, width: '100%', marginHorizontal: 16, marginTop: 16, borderRadius: SIZES.radiusXl, paddingHorizontal: 0, ...SHADOWS.small, alignSelf: 'stretch', marginLeft: 16, marginRight: 16 },
  cardTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 },
  aboutText: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 22, paddingHorizontal: 18, paddingVertical: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: SIZES.md, color: COLORS.textSecondary },
  infoValue: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  copyright: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 6 },
});
