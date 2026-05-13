import { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { authAPI } from '../../src/api/auth';
import useAuthStore from '../../src/store/authStore';

const TABS = ['Email OTP', 'Password'];

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);



  // ── Email OTP Login ──
  const handleEmailOtpLogin = async () => {
    if (!email.includes('@')) { Alert.alert('Invalid', 'Enter valid email address.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.loginEmail(email);
      if (res.data.success) {
        if (res.data.otp) Alert.alert('Dev OTP', `Your OTP: ${res.data.otp}`);
        router.push({ pathname: '/(auth)/verify-otp', params: { email, phone: res.data.phone, via: 'email' } });
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Something went wrong.';
      if (e.response?.status === 404) {
        Alert.alert('Not Registered', msg, [
          { text: 'Register', onPress: () => router.push('/(auth)/register') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  // ── Password Login ──
  const handlePasswordLogin = async () => {
    if (!email.includes('@')) { Alert.alert('Invalid', 'Enter valid email address.'); return; }
    if (password.length < 6) { Alert.alert('Invalid', 'Password must be 6+ chars.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.loginPassword({
        email, password,
        device_name: Platform.OS + '_lekar_user',
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      if (res.data.success) {
        await setAuth(res.data.token, res.data.user);
        router.replace('/(main)/(tabs)/home');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Login failed.');
    }
    setLoading(false);
  };

  const isValid = () => {
    if (activeTab === 0) return email.includes('@');
    return email.includes('@') && password.length >= 6;
  };

  const handleSubmit = () => {
    if (activeTab === 0) handleEmailOtpLogin();
    else handlePasswordLogin();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Logo */}
            <View style={styles.logoArea}>
              <View style={styles.logoCircle}>
                <Ionicons name="car-sport" size={40} color={COLORS.white} />
              </View>
              <Text style={styles.appName}>Lekar</Text>
              <Text style={styles.tagline}>Your ride, your way</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {TABS.map((t, i) => (
                <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]}
                  onPress={() => setActiveTab(i)}>
                  <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>



            {/* Email OTP */}
            {activeTab === 0 && (
              <View style={styles.inputBlock}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail" size={20} color={COLORS.textLight} />
                  <TextInput style={styles.emailInput} placeholder="your@email.com"
                    placeholderTextColor={COLORS.textLight} value={email}
                    onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                  />
                </View>
                <Text style={styles.hint}>We'll send a 4-digit OTP to your email</Text>
              </View>
            )}

            {/* Password */}
            {activeTab === 1 && (
              <View style={styles.inputBlock}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail" size={20} color={COLORS.textLight} />
                  <TextInput style={styles.emailInput} placeholder="your@email.com"
                    placeholderTextColor={COLORS.textLight} value={email}
                    onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                  />
                </View>
                <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed" size={20} color={COLORS.textLight} />
                  <TextInput style={styles.emailInput} placeholder="Min 6 characters"
                    placeholderTextColor={COLORS.textLight} value={password}
                    onChangeText={setPassword} secureTextEntry={!showPass}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity style={[styles.btn, !isValid() && styles.btnOff]}
              onPress={handleSubmit} disabled={loading || !isValid()} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color={COLORS.white} /> : (
                <Text style={styles.btnText}>
                  {activeTab === 1 ? 'Login' : 'Send OTP'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Register */}
            <TouchableOpacity style={styles.regLink} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.regText}>Don't have an account? <Text style={styles.regBold}>Sign Up</Text></Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SIZES.paddingLg, paddingVertical: 32 },
  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16, ...SHADOWS.large,
  },
  appName: { fontSize: 36, fontWeight: '800', color: COLORS.primary, letterSpacing: 2 },
  tagline: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 4 },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: SIZES.radius, padding: 4, marginBottom: 28 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: SIZES.radius - 2, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },

  // Inputs
  inputBlock: { marginBottom: 24 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  phoneRow: { flexDirection: 'row', gap: 12 },
  code: { backgroundColor: COLORS.inputBg, paddingHorizontal: 16, paddingVertical: 16, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border },
  codeText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  input: {
    flex: 1, backgroundColor: COLORS.inputBg, paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: SIZES.radius, fontSize: SIZES.lg, fontWeight: '600', color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border, letterSpacing: 2,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg,
    paddingHorizontal: 16, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  emailInput: { flex: 1, paddingVertical: 16, fontSize: SIZES.base, color: COLORS.text },
  hint: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 6, marginLeft: 4 },

  // Button
  btn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: SIZES.radius, alignItems: 'center', ...SHADOWS.medium },
  btnOff: { backgroundColor: COLORS.primaryLight },
  btnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
  regLink: { alignItems: 'center', marginTop: 24 },
  regText: { fontSize: SIZES.md, color: COLORS.textSecondary },
  regBold: { color: COLORS.primary, fontWeight: '700' },
});
