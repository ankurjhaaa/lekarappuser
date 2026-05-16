import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import useAuthStore from '../../src/store/authStore';

export default function PersonalInfoScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Avatar Section */}
        <View style={s.avatarSection}>
          <View style={s.avatarCard}>
            <View style={s.avatarCircle}>
              <Ionicons name="person" size={50} color={COLORS.textLight} />
            </View>
            <TouchableOpacity style={s.changePicBtn} activeOpacity={0.7}>
              <View style={s.cameraIcon}>
                <Ionicons name="camera" size={16} color={COLORS.white} />
              </View>
              <Text style={s.changePicText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fields */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Basic Details</Text>
          <FieldRow label="Full Name" value={user?.name || 'Not set'} icon="person-outline" />
          <FieldRow label="Phone Number" value={user?.phone ? `+91 ${user.phone}` : 'Not set'} icon="call-outline" />
          <FieldRow label="Email Address" value={user?.email || 'Not set'} icon="mail-outline" last />
        </View>

        {/* Emergency Contact */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Emergency Contact</Text>
          <FieldRow label="Contact Name" value="Not set" icon="people-outline" />
          <FieldRow label="Contact Number" value="Not set" icon="call-outline" last />
        </View>

        <TouchableOpacity style={s.saveBtn} activeOpacity={0.8}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldRow({ label, value, icon, last }) {
  return (
    <TouchableOpacity style={[s.fieldRow, !last && s.fieldRowBorder]} activeOpacity={0.7}>
      <View style={s.fieldIconCircle}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.fieldLabel}>{label}</Text>
        <Text style={s.fieldValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  avatarSection: { padding: 20, paddingTop: 10 },
  avatarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F3F5',
    ...SHADOWS.small,
  },
  avatarCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#F8F9FA', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  changePicBtn: { marginTop: 14, alignItems: 'center' },
  changePicText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

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
  
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  fieldRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  fieldIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  fieldLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  
  saveBtn: { 
    backgroundColor: COLORS.primary, 
    marginHorizontal: 16, 
    marginTop: 30, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    ...SHADOWS.medium
  },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});

