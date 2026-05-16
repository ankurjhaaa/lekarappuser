import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={[]}>

      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Manage your app preferences</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader title="Preferences" />
        <View style={styles.sectionCard}>
          <SettingsRow icon="notifications-outline" label="Notifications" sub="Manage notification preferences" color={COLORS.primary} onPress={() => router.push('/(main)/notification-settings')} />
          <SettingsRow icon="globe-outline" label="Language" sub="Change app language" color={COLORS.primary} rightText="English" />
          <SettingsRow icon="cash-outline" label="Currency" sub="Select your preferred currency" color={COLORS.primary} rightText="INR (₹)" last />
        </View>

        <SectionHeader title="Account" />
        <View style={styles.sectionCard}>
          <SettingsRow icon="lock-closed-outline" label="Privacy" sub="Manage your privacy settings" color={COLORS.primary} onPress={() => router.push('/(main)/privacy')} />
          <SettingsRow icon="shield-checkmark-outline" label="Security" sub="Change password and security options" color={COLORS.primary} onPress={() => router.push('/(main)/security')} />
          <SettingsRow icon="person-remove-outline" label="Delete Account" sub="Permanently delete your account" color={COLORS.error} last />
        </View>

        <SectionHeader title="More" />
        <View style={styles.sectionCard}>
          <SettingsRow icon="information-circle-outline" label="About Lekar" sub="App version and information" color={COLORS.primary} onPress={() => router.push('/(main)/about')} />
          <SettingsRow icon="document-text-outline" label="Terms & Conditions" sub="Read our terms and conditions" color={COLORS.primary} onPress={() => router.push('/(main)/terms')} />
          <SettingsRow icon="shield-outline" label="Privacy Policy" sub="Read our privacy policy" color={COLORS.primary} onPress={() => router.push('/(main)/privacy-policy')} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{title}</Text></View>;
}

function SettingsRow({ icon, label, sub, color, rightText, last, onPress }) {
  return (
    <TouchableOpacity style={[styles.settingsRow, !last && styles.settingsRowBorder]} activeOpacity={0.6} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} style={styles.settingsIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {sub && <Text style={styles.settingsSub}>{sub}</Text>}
      </View>
      {rightText && <Text style={styles.settingsRight}>{rightText}</Text>}
      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  pageSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  sectionHeaderText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  sectionCard: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: SIZES.radiusXl, ...SHADOWS.small },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingsIcon: { width: 28, marginRight: 14 },
  settingsLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  settingsSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  settingsRight: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginRight: 6 },
});
