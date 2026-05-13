import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₹0.00</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add Money</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickCard}>
          <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
          <Text style={styles.quickText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard}>
          <Ionicons name="pricetag-outline" size={24} color={COLORS.accent} />
          <Text style={styles.quickText}>Coupons</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard}>
          <Ionicons name="gift-outline" size={24} color={COLORS.success} />
          <Text style={styles.quickText}>Rewards</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      <View style={styles.empty}>
        <Ionicons name="wallet-outline" size={50} color={COLORS.textLight} />
        <Text style={styles.emptyText}>No transactions yet</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  balanceCard: {
    backgroundColor: COLORS.primary, marginHorizontal: SIZES.padding, borderRadius: SIZES.radiusLg,
    padding: 24, alignItems: 'center', ...SHADOWS.large,
  },
  balanceLabel: { color: COLORS.white + 'CC', fontSize: SIZES.sm, fontWeight: '500' },
  balanceAmount: { color: COLORS.white, fontSize: 40, fontWeight: '800', marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white + '20',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: SIZES.radiusFull, marginTop: 16, gap: 6,
  },
  addBtnText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700' },
  quickRow: { flexDirection: 'row', paddingHorizontal: SIZES.padding, gap: 12, marginTop: 20 },
  quickCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    paddingVertical: 20, alignItems: 'center', gap: 8, ...SHADOWS.small,
  },
  quickText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: SIZES.md, color: COLORS.textLight, marginTop: 12 },
});
