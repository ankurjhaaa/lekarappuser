import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import LekarHeader from '../../src/components/LekarHeader';

export default function MyVehiclesScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <LekarHeader onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>My Vehicles</Text>
          <Text style={s.pageSub}>Manage your saved vehicles</Text>
        </View>

        {/* Empty State */}
        <View style={s.emptyCard}>
          <Ionicons name="car-outline" size={60} color={COLORS.textLight} />
          <Text style={s.emptyTitle}>No vehicles added</Text>
          <Text style={s.emptySub}>Add your vehicle details for a personalized experience</Text>
        </View>

        <TouchableOpacity style={s.addBtn}>
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={s.addBtnText}>Add Vehicle</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  pageSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  emptyCard: { alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 40, paddingVertical: 50, borderRadius: SIZES.radiusXl, ...SHADOWS.small },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textSecondary, marginTop: 16 },
  emptySub: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 24, paddingVertical: 16, borderRadius: SIZES.radiusXl },
  addBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
});
