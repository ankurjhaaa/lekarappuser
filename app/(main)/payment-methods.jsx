import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

export default function PaymentMethodsScreen() {
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [bookingFor, setBookingFor] = useState('myself');
  const [offerCode, setOfferCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);

  const handleApply = () => {
    if (offerCode.trim().length > 0) {
      setAppliedOffer(offerCode.trim().toUpperCase());
      setOfferCode('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Payment Methods</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Lekar Wallet */}
        <TouchableOpacity
          style={[styles.paymentCard, selectedPayment === 'wallet' && styles.paymentCardActive]}
          onPress={() => setSelectedPayment('wallet')}
          activeOpacity={0.7}
        >
          <View style={[styles.paymentIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="wallet" size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentName}>Lekar Wallet</Text>
            <Text style={styles.paymentBalance}>₹0.00</Text>
          </View>
          <TouchableOpacity style={styles.addMoneyBtn}>
            <Ionicons name="add-circle" size={26} color={COLORS.success} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Cash */}
        <TouchableOpacity
          style={[styles.paymentCard, selectedPayment === 'cash' && styles.paymentCardActive]}
          onPress={() => setSelectedPayment('cash')}
          activeOpacity={0.7}
        >
          <View style={[styles.paymentIconWrap, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="cash" size={22} color="#E65100" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentName}>Cash</Text>
          </View>
          {selectedPayment === 'cash' && (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>

        {/* Booking For */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Booking for</Text>
          
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setBookingFor('myself')}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, bookingFor === 'myself' && styles.radioOuterActive]}>
              {bookingFor === 'myself' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>Myself</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setBookingFor('others')}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, bookingFor === 'others' && styles.radioOuterActive]}>
              {bookingFor === 'others' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>Others</Text>
          </TouchableOpacity>
        </View>

        {/* Offers */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Offers</Text>
          
          {/* Applied Offer */}
          {appliedOffer && (
            <View style={styles.appliedOfferRow}>
              <View style={styles.offerTagIcon}>
                <Ionicons name="pricetag" size={16} color={COLORS.success} />
              </View>
              <Text style={styles.appliedOfferText}>{appliedOffer} Applied</Text>
              <TouchableOpacity onPress={() => setAppliedOffer(null)}>
                <Text style={styles.removeOfferText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Offer Code Input */}
          <View style={styles.offerInputRow}>
            <TextInput
              style={styles.offerInput}
              placeholder="Have an offer code? Enter here"
              placeholderTextColor={COLORS.textLight}
              value={offerCode}
              onChangeText={setOfferCode}
            />
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {/* View All Offers */}
          <TouchableOpacity style={styles.viewOffersBtn}>
            <Text style={styles.viewOffersBtnText}>View All Offers</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  redHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    alignItems: 'center',
  },
  lekarLogo: { fontSize: 28, fontWeight: '800', color: COLORS.white, fontStyle: 'italic' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },

  // Payment Cards
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: SIZES.radiusXl,
    padding: 16,
    ...SHADOWS.small,
  },
  paymentCardActive: {
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
  },
  paymentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  paymentName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  paymentBalance: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  addMoneyBtn: { padding: 4 },

  // Section cards
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: SIZES.radiusXl,
    padding: 18,
    ...SHADOWS.small,
  },
  sectionTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text, marginBottom: 14 },

  // Radio buttons
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  radioLabel: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },

  // Offers
  appliedOfferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    marginBottom: 14,
  },
  offerTagIcon: { marginRight: 10 },
  appliedOfferText: { flex: 1, fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  removeOfferText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.primary },

  offerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  offerInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  applyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  applyBtnText: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.primary },

  viewOffersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
  },
  viewOffersBtnText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.primary },
});
