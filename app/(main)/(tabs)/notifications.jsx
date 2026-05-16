import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import LekarHeader from '../../../src/components/LekarHeader';

const DUMMY_NOTIFICATIONS = [
  { id: '1', title: 'Ride Completed', message: 'Your ride to Airport has been completed. Rate your driver!', time: '2 min ago', icon: 'checkmark-circle', color: COLORS.success },
  { id: '2', title: 'Offer Available', message: 'Use code LEKAR15 for 15% off on your next ride!', time: '1 hour ago', icon: 'pricetag', color: COLORS.primary },
  { id: '3', title: 'Payment Received', message: '₹297 has been debited from your wallet.', time: '3 hours ago', icon: 'card', color: '#1877F2' },
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Notifications</Text>
      </View>
      <FlatList
        data={DUMMY_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.notifCard}>
            <View style={[styles.notifIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifMessage}>{item.message}</Text>
              <Text style={styles.notifTime}>{item.time}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },
  notifCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: 16, marginBottom: 10, ...SHADOWS.small },
  notifIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  notifTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  notifMessage: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 3, lineHeight: 18 },
  notifTime: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textSecondary, marginTop: 16 },
  emptySubtext: { fontSize: SIZES.md, color: COLORS.textLight, marginTop: 4 },
});
