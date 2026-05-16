import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

export default function AboutScreen() {
  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Top Logo Section */}
        <View style={s.logoSection}>
          <View style={s.logoCard}>
            <View style={s.logoCircle}>
              <Text style={s.logoInitial}>L</Text>
            </View>
            <View>
              <Text style={s.appName}>Lekar</Text>
              <Text style={s.version}>Version 1.0.0 (Stable)</Text>
            </View>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Our Mission</Text>
          <Text style={s.aboutText}>
            Lekar is a next-generation mobility platform dedicated to making transportation safe, affordable, and accessible for everyone across India. We believe in empowering both users and drivers through technology.
          </Text>
        </View>

        {/* Info Rows */}
        <View style={s.card}>
          <InfoRow label="Company" value="Lekar Technologies Pvt. Ltd." />
          <InfoRow label="Platform" value="Android & iOS" />
          <InfoRow label="Support" value="support@lekar.com" />
          <InfoRow label="Website" value="www.lekar.com" last />
        </View>

        {/* Legal Links */}
        <View style={s.card}>
          <TouchableOpacity style={s.linkRow} onPress={() => router.push('/(main)/terms')}>
            <Text style={s.linkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.linkRow} onPress={() => router.push('/(main)/privacy')}>
            <Text style={s.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Social Icons */}
        <View style={s.socialRow}>
          <SocialIcon name="logo-facebook" />
          <SocialIcon name="logo-twitter" />
          <SocialIcon name="logo-instagram" />
          <SocialIcon name="logo-linkedin" />
        </View>

        <View style={s.footer}>
          <Text style={s.copyright}>© 2025 Lekar Technologies Pvt. Ltd.</Text>
          <Text style={s.copyright}>Made with ❤️ for Bharat</Text>
        </View>
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

function SocialIcon({ name }) {
  return (
    <TouchableOpacity style={s.iconCircle}>
      <Ionicons name={name} size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  logoSection: { padding: 20, paddingTop: 10 },
  logoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    gap: 16,
    ...SHADOWS.small,
  },
  logoCircle: { 
    width: 54, 
    height: 54, 
    borderRadius: 12, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logoInitial: { fontSize: 32, fontWeight: '900', color: COLORS.white, fontStyle: 'italic' },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  version: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '600' },

  card: { 
    backgroundColor: COLORS.white, 
    marginHorizontal: 16, 
    marginTop: 16, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: '#F1F3F5',
    ...SHADOWS.small 
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, paddingHorizontal: 18, paddingTop: 16 },
  aboutText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, paddingHorizontal: 18, paddingVertical: 14, fontWeight: '500' },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 15 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15 },
  linkText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: '#F8F9FA', marginHorizontal: 18 },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 30 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F3F5', ...SHADOWS.small },

  footer: { alignItems: 'center', marginTop: 30 },
  copyright: { fontSize: 12, color: COLORS.textLight, marginTop: 4, fontWeight: '600' },
});

