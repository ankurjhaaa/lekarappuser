import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <SectionHeader title="App Preferences" />
        <View style={styles.sectionCard}>
          <SettingsRow icon="notifications-outline" label="Notifications" sub="Manage alerts and push messages" color={COLORS.primary} onPress={() => router.push('/(main)/notification-settings')} />
          <SettingsRow icon="globe-outline" label="App Language" sub="Change your preferred language" color={COLORS.primary} rightText="English" />
          <SettingsRow icon="cash-outline" label="Currency" sub="Select default currency" color={COLORS.primary} rightText="INR (₹)" last />
        </View>

        <SectionHeader title="Privacy & Security" />
        <View style={styles.sectionCard}>
          <SettingsRow icon="lock-closed-outline" label="Privacy Settings" sub="Control your data visibility" color={COLORS.primary} onPress={() => router.push('/(main)/privacy')} />
          <SettingsRow icon="shield-checkmark-outline" label="Security" sub="Password and account safety" color={COLORS.primary} onPress={() => router.push('/(main)/security')} />
          <SettingsRow icon="person-remove-outline" label="Delete Account" sub="Permanently close your account" color={COLORS.error} last />
        </View>

        <SectionHeader title="Legal & Information" />
        <View style={styles.sectionCard}>
          <SettingsRow icon="information-circle-outline" label="About Lekar" sub="Version 1.0.0" color={COLORS.primary} onPress={() => router.push('/(main)/about')} />
          <SettingsRow icon="document-text-outline" label="Terms & Conditions" sub="Our usage policy" color={COLORS.primary} onPress={() => router.push('/(main)/terms')} />
          <SettingsRow icon="shield-outline" label="Privacy Policy" sub="Data handling rules" color={COLORS.primary} onPress={() => router.push('/(main)/privacy')} last />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Lekar v1.0.0 Stable</Text>
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
    <TouchableOpacity style={[styles.settingsRow, !last && styles.settingsRowBorder]} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {sub && <Text style={styles.settingsSub}>{sub}</Text>}
      </View>
      {rightText && <Text style={styles.settingsRight}>{rightText}</Text>}
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionHeaderText: { fontSize: 13, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  sectionCard: { 
    backgroundColor: COLORS.white, 
    marginHorizontal: 16, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: '#F1F3F5',
    ...SHADOWS.small 
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingsLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  settingsSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  settingsRight: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700', marginRight: 8 },
  
  footer: { paddingVertical: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
});

