import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { authAPI } from '../../src/api/auth';
import useAuthStore from '../../src/store/authStore';

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams();
  // Accept both phone and email from login screen
  const phone = params.phone || '';
  const email = params.email || '';
  const via = params.via || 'phone'; // 'phone' or 'email'

  const setAuth = useAuthStore((s) => s.setAuth);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputs = useRef([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    inputs.current[0]?.focus();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    if (text && index < 3) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 4) { Alert.alert('Error', 'Enter 4-digit OTP.'); return; }
    setLoading(true);
    try {
      // Send phone or email depending on login method
      const payload = {
        otp: code,
        device_name: Platform.OS + '_lekar_user',
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
      };
      if (via === 'email' && email) {
        payload.email = email;
      } else {
        payload.phone = phone;
      }

      const res = await authAPI.verifyOtp(payload);
      if (res.data.success) {
        await setAuth(res.data.token, res.data.user);
        router.replace('/(main)/(tabs)/home');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Verification failed.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      let res;
      if (via === 'email' && email) {
        res = await authAPI.loginEmail(email);
      } else {
        res = await authAPI.login(phone);
      }
      if (res.data.otp) Alert.alert('Dev OTP', `New OTP: ${res.data.otp}`);
      setTimer(60);
    } catch (e) {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  const displayText = via === 'email' ? email : `+91 ${phone}`;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name={via === 'email' ? 'mail' : 'phone-portrait'} size={32} color={COLORS.primary} />
        </Animated.View>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Code sent to{'\n'}
          <Text style={{ fontWeight: '700', color: COLORS.text }}>{displayText}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(t) => handleChange(t, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.verifyText}>Verify & Continue</Text>}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  backButton: { paddingHorizontal: SIZES.paddingLg, paddingTop: 60 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: SIZES.paddingLg, marginTop: -80 },
  iconContainer: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 32, lineHeight: 22 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 36 },
  otpInput: {
    width: 56, height: 56, borderRadius: SIZES.radius, borderWidth: 2, borderColor: COLORS.border,
    fontSize: 24, fontWeight: '800', color: COLORS.text, backgroundColor: COLORS.inputBg,
  },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  verifyButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: SIZES.radius, alignItems: 'center', ...SHADOWS.medium },
  verifyText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
  resendContainer: { alignItems: 'center', marginTop: 20 },
  timerText: { fontSize: SIZES.md, color: COLORS.textLight },
  resendText: { fontSize: SIZES.md, color: COLORS.primary, fontWeight: '700' },
});
