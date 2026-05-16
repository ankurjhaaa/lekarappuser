import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { useState } from 'react';

export default function PrivacyScreen() {
  const [locationSharing, setLocationSharing] = useState(true);
  const [rideHistory, setRideHistory] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Toggle Section */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Data Privacy</Text>
          <ToggleRow label="Location Sharing" sub="Share location during active rides" value={locationSharing} onToggle={setLocationSharing} />
          <ToggleRow label="Ride History" sub="Store your ride history for receipts" value={rideHistory} onToggle={setRideHistory} />
          <ToggleRow label="Analytics" sub="Help us improve with anonymous data" value={analytics} onToggle={setAnalytics} last />
        </View>

        {/* Action Section */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Actions</Text>
          <TouchableOpacity style={s.actionRow} activeOpacity={0.7}>
            <View style={[s.actionIconCircle, { backgroundColor: COLORS.primary + '10' }]}>
              <Ionicons name="download-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={s.actionText}>Download My Data</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[s.actionRow, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <View style={[s.actionIconCircle, { backgroundColor: COLORS.error + '10' }]}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </View>
            <Text style={[s.actionText, { color: COLORS.error }]}>Clear Ride History</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Your privacy is our priority. We never sell your data to third parties.</Text>
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
      <Switch 
        value={value} 
        onValueChange={onToggle} 
        trackColor={{ true: COLORS.primary, false: '#F1F3F5' }} 
        thumbColor={COLORS.white} 
      />
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
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 },
  
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  toggleSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  actionIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  
  footer: { padding: 30, alignItems: 'center' },
  footerText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', lineHeight: 18, fontWeight: '500' },
});

