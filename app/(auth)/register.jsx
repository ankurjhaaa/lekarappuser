import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { authAPI } from '../../src/api/auth';
import useAuthStore from '../../src/store/authStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Inline OTP verification states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const otpInputsRef = useRef([]);

  const setAuth = useAuthStore((s) => s.setAuth);

  // Resend Timer Countdown
  useEffect(() => {
    if (!showOtpVerification || timer <= 0) return;
    const intervalId = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [showOtpVerification, timer]);

  const handleRegister = async () => {
    if (!name || phone.length !== 10 || !email.includes('@') || password.length < 6) {
      Alert.alert('Error', 'Please fill all fields correctly. Email is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({ name, phone, email, password });
      if (res.data.success) {
        // Move to inline OTP verification
        setShowOtpVerification(true);
        setTimer(60);
        setOtp(['', '', '', '']);
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 150);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        otp: code,
        email: email.trim(),
        device_name: Platform.OS + '_lekar_user',
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
      };

      const res = await authAPI.verifyOtp(payload);
      if (res.data.success) {
        await setAuth(res.data.token, res.data.user);
        // Profile was just created with name/phone, so go to home
        router.replace('/(main)/(tabs)/home');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Incorrect OTP code.');
    }
    setLoading(false);
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    if (text && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      await authAPI.loginEmail(email.trim());
      setTimer(60);
      setOtp(['', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (e) {
      Alert.alert('Error', 'Failed to resend code.');
    }
  };

  const isOtpValid = otp.join('').length === 4;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          {!showOtpVerification ? (
            <>
              <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Fill in your details to get started</Text>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => setShowOtpVerification(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                <Text style={styles.backLinkText}>Back to form</Text>
              </TouchableOpacity>

              <Text style={styles.title}>Verification</Text>
              <Text style={styles.subtitle}>Enter the 4-digit code sent to {email}</Text>
            </>
          )}

          {!showOtpVerification ? (
            /* Registration Form */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input} placeholder="Enter your name"
                  placeholderTextColor={COLORS.textLight} value={name}
                  onChangeText={setName} autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCode}><Text style={styles.codeText}>+91</Text></View>
                  <TextInput
                    style={styles.phoneInput} placeholder="10-digit number"
                    placeholderTextColor={COLORS.textLight} value={phone}
                    onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                    keyboardType="phone-pad" maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input} placeholder="your@email.com"
                  placeholderTextColor={COLORS.textLight} value={email}
                  onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Min 6 characters"
                    placeholderTextColor={COLORS.textLight} value={password}
                    onChangeText={setPassword} secureTextEntry={!showPass}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Sign Up</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginBold}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Inline OTP Verification */
            <View style={styles.form}>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputsRef.current[index] = ref)}
                    style={[styles.otpInput, digit !== '' && styles.otpInputFilled]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    editable={!loading}
                  />
                ))}
              </View>

              {/* Timer & Resend */}
              <View style={styles.timerRow}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend code in <Text style={styles.timerCountdown}>{timer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, !isOtpValid && styles.btnOff]}
                onPress={handleVerifyOtp}
                disabled={loading || !isOtpValid}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  content: { paddingHorizontal: SIZES.paddingLg, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: SIZES.base, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 },
  form: { gap: 20 },
  inputGroup: {},
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.inputBg, paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: SIZES.radius, fontSize: SIZES.base, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  phoneRow: { flexDirection: 'row', gap: 10 },
  countryCode: {
    backgroundColor: COLORS.inputBg, paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center',
  },
  codeText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  phoneInput: {
    flex: 1, backgroundColor: COLORS.inputBg, paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: SIZES.radius, fontSize: SIZES.base, color: COLORS.text, letterSpacing: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 16, top: 16 },
  button: {
    backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: SIZES.radius,
    alignItems: 'center', marginTop: 32, ...SHADOWS.medium,
  },
  btnOff: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  buttonText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 24 },
  loginText: { fontSize: SIZES.md, color: COLORS.textSecondary },
  loginBold: { color: COLORS.primary, fontWeight: '700' },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  timerRow: { alignItems: 'center', marginTop: 8 },
  timerText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  timerCountdown: { color: '#0F172A', fontWeight: '700' },
  resendText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
});
