import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import LekarHeader from '../../../src/components/LekarHeader';

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LekarHeader onMenu={() => require('react-native').DeviceEventEmitter.emit('openSidebar')} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Wallet</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.walletTopRow}>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet" size={24} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.walletLabel}>Lekar Wallet</Text>
              <Text style={styles.balanceAmount}>₹0.00</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addMoneyBtn}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard}>
            <View style={[styles.quickIconWrap, { backgroundColor: COLORS.primary + '12' }]}>
              <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickText}>Transaction History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(main)/payment-methods')}>
            <View style={[styles.quickIconWrap, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="card-outline" size={22} color="#2E7D32" />
            </View>
            <Text style={styles.quickText}>Payment Methods</Text>
          </TouchableOpacity>
        </View>

        {/* Offers Card */}
        <View style={styles.offersCard}>
          <View style={styles.offersHeader}>
            <Ionicons name="pricetag" size={20} color={COLORS.primary} />
            <Text style={styles.offersTitle}>Offers & Rewards</Text>
          </View>
          <Text style={styles.offersSub}>Use code LEKAR15 for 15% off on your next ride</Text>
          <TouchableOpacity style={styles.viewOffersBtn}>
            <Text style={styles.viewOffersBtnText}>View All Offers</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Recent Transactions — empty state */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Transactions</Text>
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={50} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySub}>Your transaction history will appear here</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Red Header
  redHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    alignItems: 'center',
  },
  lekarLogo: { fontSize: 28, fontWeight: '800', color: COLORS.white, fontStyle: 'italic' },

  // Title
  titleRow: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },

  // Balance Card
  balanceCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    borderRadius: SIZES.radiusXl,
    padding: 22,
    ...SHADOWS.large,
  },
  walletTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.white + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  walletLabel: {
    color: COLORS.white + 'BB',
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 2,
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white + '20',
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    marginTop: 18,
    gap: 6,
  },
  addMoneyText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '700' },

  // Quick Actions
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 20,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.small,
  },
  quickIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  quickText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },

  // Offers Card
  offersCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: SIZES.radiusXl,
    padding: 18,
    ...SHADOWS.small,
  },
  offersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  offersTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  offersSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
  viewOffersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewOffersBtnText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.primary },

  // Recent Transactions
  recentSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  recentTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    ...SHADOWS.small,
  },
  emptyText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
  emptySub: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 4 },
});
