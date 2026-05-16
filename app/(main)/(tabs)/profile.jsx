import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import useAuthStore from '../../../src/store/authStore';
import LekarHeader from '../../../src/components/LekarHeader';

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

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Title + Edit */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/(main)/personal-info')}>
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} activeOpacity={0.7} onPress={() => router.push('/(main)/personal-info')}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={44} color={COLORS.textLight} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
              <Text style={styles.tripsText}>0 Trips</Text>
            </View>
            {user?.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call" size={14} color={COLORS.primary} />
                <Text style={styles.contactText}>+91 {user.phone}</Text>
              </View>
            )}
            {user?.email && (
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={14} color={COLORS.primary} />
                <Text style={styles.contactText}>{user.email}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Menu Group 1 */}
        <View style={styles.menuCard}>
          <MenuItem icon="person-outline" label="Personal Information" color={COLORS.primary} onPress={() => router.push('/(main)/personal-info')} />
          <MenuItem icon="car-outline" label="My Vehicles" color={COLORS.primary} onPress={() => router.push('/(main)/my-vehicles')} />
          <MenuItem icon="wallet-outline" label="Wallet" color={COLORS.primary} rightText="₹0.00" rightColor={COLORS.primary} last />
        </View>

        {/* Menu Group 2 */}
        <View style={styles.menuCard}>
          <MenuItem icon="headset-outline" label="Help & Support" color={COLORS.primary} onPress={() => router.push('/(main)/help-support')} />
          <MenuItem icon="shield-outline" label="Safety" color={COLORS.primary} onPress={() => router.push('/(main)/safety')} />
          <MenuItem icon="settings-outline" label="Settings" color={COLORS.primary} onPress={() => router.push('/(main)/settings')} last />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, color, rightText, rightColor, last, onPress }) {
  return (
    <TouchableOpacity style={[styles.menuItem, !last && styles.menuItemBorder]} activeOpacity={0.6} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} style={styles.menuIcon} />
      <Text style={styles.menuLabel}>{label}</Text>
      {rightText && <Text style={[styles.menuRight, rightColor && { color: rightColor }]}>{rightText}</Text>}
      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.primary },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: SIZES.radiusXl, padding: 16, ...SHADOWS.small },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ratingText: { fontSize: SIZES.sm, fontWeight: '700', color: '#92400E' },
  tripsText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  contactText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  menuCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, borderRadius: SIZES.radiusXl, ...SHADOWS.small },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 17 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 30, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  menuRight: { fontSize: SIZES.md, fontWeight: '700', marginRight: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10, marginHorizontal: 16, marginTop: 20, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 1.5, borderColor: COLORS.primary + '30', borderRadius: SIZES.radiusXl },
  logoutText: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
});
