import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../src/constants/theme';

export default function ReferEarnScreen() {
  const referralCode = "LEKAR500";

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join Lekar and get ₹50 off on your first ride! Use my referral code: ${referralCode}`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Top Illustration Area */}
        <View style={s.header}>
          <View style={s.giftIconCircle}>
            <Ionicons name="gift" size={60} color={COLORS.primary} />
          </View>
          <Text style={s.headerTitle}>Refer & Earn</Text>
          <Text style={s.headerSub}>Share the joy of safe travel and earn rewards for every friend who joins.</Text>
        </View>

        {/* Reward Card */}
        <View style={s.rewardCard}>
           <Text style={s.rewardTitle}>You get ₹50</Text>
           <Text style={s.rewardDesc}>for every friend who completes their first ride.</Text>
           <View style={s.divider} />
           <Text style={s.rewardTitle}>They get ₹50</Text>
           <Text style={s.rewardDesc}>off on their first ride using your code.</Text>
        </View>

        {/* Code Card */}
        <View style={s.codeCard}>
          <Text style={s.codeLabel}>Your Referral Code</Text>
          <View style={s.codeBox}>
            <Text style={s.codeText}>{referralCode}</Text>
            <TouchableOpacity onPress={onShare}>
              <Text style={s.copyLink}>SHARE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How it works */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How it works</Text>
          
          <Step 
            number="1" 
            title="Invite Friends" 
            desc="Share your code with friends via WhatsApp or SMS." 
          />
          <Step 
            number="2" 
            title="Friend Joins" 
            desc="Your friend signs up using your referral code." 
          />
          <Step 
            number="3" 
            title="Earn Rewards" 
            desc="You get ₹50 in your wallet after their first ride." 
            last 
          />
        </View>

        {/* Main Share Button */}
        <TouchableOpacity style={s.shareBtn} onPress={onShare}>
          <Ionicons name="share-social" size={20} color={COLORS.white} />
          <Text style={s.shareBtnText}>Invite Friends Now</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ number, title, desc, last }) {
  return (
    <View style={s.stepRow}>
      <View style={s.stepLeft}>
        <View style={s.stepCircle}>
          <Text style={s.stepNumber}>{number}</Text>
        </View>
        {!last && <View style={s.stepLine} />}
      </View>
      <View style={s.stepRight}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#FFF5F5' },
  giftIconCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: COLORS.white, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...SHADOWS.medium 
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, marginTop: 24 },
  headerSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 },

  rewardCard: { 
    backgroundColor: COLORS.primary, 
    marginHorizontal: 20, 
    marginTop: -30, 
    borderRadius: 12, 
    padding: 20, 
    ...SHADOWS.medium 
  },
  rewardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  rewardDesc: { fontSize: 13, color: COLORS.white, opacity: 0.8, marginTop: 4, marginBottom: 12 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  codeCard: { 
    backgroundColor: COLORS.white, 
    marginHorizontal: 20, 
    marginTop: 20, 
    borderRadius: 12, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#F1F3F5',
    ...SHADOWS.small 
  },
  codeLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  codeBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12, 
    padding: 16, 
    backgroundColor: '#F8F9FA', 
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  codeText: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 1 },
  copyLink: { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  section: { paddingHorizontal: 20, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 20 },

  stepRow: { flexDirection: 'row', gap: 16 },
  stepLeft: { alignItems: 'center' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '20' },
  stepNumber: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  stepLine: { width: 2, height: 40, backgroundColor: '#F1F3F5', marginVertical: 4 },
  stepRight: { flex: 1, paddingTop: 4 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  stepDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  shareBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
