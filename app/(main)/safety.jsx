import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

export default function SafetyScreen() {
  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Main Info Section */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Safety Features</Text>
          <SafetyRow icon="shield-checkmark" color={COLORS.success} title="Ride Insurance" sub="All rides are insured for your safety" />
          <SafetyRow icon="location" color={COLORS.primary} title="Live Tracking" sub="Share ride status with trusted contacts" />
          <SafetyRow icon="people" color="#7B1FA2" title="Trusted Contacts" sub="Add contacts who can track your rides" last />
        </View>

        {/* Tips Section */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Safe Travel Tips</Text>
          <TipRow text="Always verify the driver's name, photo and vehicle details before getting in." />
          <TipRow text="Share your ride details with a trusted contact." />
          <TipRow text="Sit in the back seat for added safety." />
          <TipRow text="Keep your phone charged during rides." last />
        </View>

        {/* SOS Button */}
        <TouchableOpacity style={s.emergencyBtn} activeOpacity={0.8}>
          <Ionicons name="warning" size={22} color={COLORS.white} />
          <Text style={s.emergencyBtnText}>Emergency SOS</Text>
        </TouchableOpacity>

        <View style={s.footer}>
          <Text style={s.footerText}>Our team is available 24/7 to assist you in case of any safety concerns.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SafetyRow({ icon, color, title, sub, last }) {
  return (
    <TouchableOpacity style={[s.row, !last && s.rowBorder]} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

function TipRow({ text, last }) {
  return (
    <View style={[s.tipRow, !last && s.rowBorder]}>
      <View style={s.tipCheck}>
        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
      </View>
      <Text style={s.tipText}>{text}</Text>
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
  rowIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, paddingVertical: 14 },
  tipCheck: { marginTop: 2, marginRight: 12 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, fontWeight: '500' },
  
  emergencyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    backgroundColor: COLORS.error, 
    marginHorizontal: 16, 
    marginTop: 30, 
    paddingVertical: 16, 
    borderRadius: 12,
    ...SHADOWS.medium 
  },
  emergencyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  footer: { padding: 30, alignItems: 'center' },
  footerText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', lineHeight: 18, fontWeight: '500' },
});

