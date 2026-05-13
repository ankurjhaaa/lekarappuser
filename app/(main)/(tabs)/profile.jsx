import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import useAuthStore from '../../../src/store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', color: '#1877F2' },
    { icon: 'location-outline', label: 'Saved Places', color: COLORS.success },
    { icon: 'shield-outline', label: 'Safety', color: COLORS.accent },
    { icon: 'notifications-outline', label: 'Notifications', color: '#9C27B0' },
    { icon: 'help-circle-outline', label: 'Help & Support', color: '#00BCD4' },
    { icon: 'document-text-outline', label: 'Terms & Conditions', color: COLORS.textSecondary },
    { icon: 'information-circle-outline', label: 'About', color: COLORS.textSecondary },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userPhone}>{user?.phone ? `+91 ${user.phone}` : ''}</Text>
            {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Lekar v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding, borderRadius: SIZES.radiusLg, padding: 20, ...SHADOWS.small,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white },
  profileInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  userPhone: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  userEmail: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },
  editBtn: { padding: 8 },
  menu: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.padding, marginTop: 20,
    borderRadius: SIZES.radiusLg, ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: SIZES.md, fontWeight: '500', color: COLORS.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: SIZES.padding, marginTop: 24, paddingVertical: 16,
    backgroundColor: COLORS.error + '10', borderRadius: SIZES.radius,
  },
  logoutText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.error },
  version: { textAlign: 'center', fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 20, marginBottom: 40 },
});
