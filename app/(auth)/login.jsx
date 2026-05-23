import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { authAPI } from '../../src/api/auth';
import { COLORS } from '../../src/constants/theme';
import useAuthStore from '../../src/store/authStore';
import { getExpoPushToken } from '../../src/utils/pushToken';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('otp'); // 'otp' | 'password'
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  // OTP Verification Inline States
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const otpInputsRef = useRef([]);

  const setAuth = useAuthStore((s) => s.setAuth);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current; // 0 for OTP, 1 for Password

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Resend Timer Countdown
  useEffect(() => {
    if (!showOtpVerification || timer <= 0) return;
    const intervalId = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [showOtpVerification, timer]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tab === 'otp' ? 0 : 1,
      useNativeDriver: false,
      tension: 45,
      friction: 8,
    }).start();
  };

  const handleEmailOtpLogin = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.loginEmail(cleanEmail);
      if (res.data.success) {
        // Smooth transition to inline OTP state
        setShowOtpVerification(true);
        setTimer(60);
        setOtp(['', '', '', '']);
        // Focus first OTP field in the next tick
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 150);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const pushToken = await getExpoPushToken();

      const payload = {
        otp: code,
        email: email.trim(),
        device_name: Platform.OS + '_lekar_user',
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
        expo_push_token: pushToken,
      };

      const res = await authAPI.verifyOtp(payload);
      if (res.data.success) {
        await setAuth(res.data.token, res.data.user);
        if (!res.data.user || !res.data.user.name) {
          router.replace('/(auth)/complete-profile');
        } else {
          router.replace('/(main)/(tabs)/home');
        }
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Incorrect OTP code.');
    }
    setLoading(false);
  };

  const handlePasswordLogin = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const pushToken = await getExpoPushToken();

      const payload = {
        email: cleanEmail,
        password: password,
        device_name: Platform.OS + '_lekar_user',
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
        expo_push_token: pushToken,
      };

      const res = await authAPI.loginPassword(payload);
      if (res.data.success) {
        await setAuth(res.data.token, res.data.user);
        if (!res.data.user || !res.data.user.name) {
          router.replace('/(auth)/complete-profile');
        } else {
          router.replace('/(main)/(tabs)/home');
        }
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Invalid email or password.';
      Alert.alert('Error', msg);
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

  const isFormValid = showOtpVerification
    ? (otp.join('').length === 4)
    : activeTab === 'otp'
      ? (email.includes('@') && email.length >= 5)
      : (email.includes('@') && email.length >= 5 && password.length >= 6);

  const translateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require('../../assets/images/banner1.png')}
            style={styles.banner}
          />

          <Animated.View style={[styles.main, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Conditional Subtitle & Headers depending on OTP verification status */}
            {!showOtpVerification ? (
              <View style={styles.header}>
                <Text style={styles.title}>Let's get riding</Text>
                <Text style={styles.subtitle}>Sign in to start booking premium, safe rides</Text>
              </View>
            ) : (
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => setShowOtpVerification(false)}
                  style={styles.backLink}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                  <Text style={styles.backLinkText}>Change email</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Verification</Text>
                <Text style={styles.subtitle}>Enter the 4-digit code sent to {email}</Text>
              </View>
            )}

            {/* Underline Tabs: Hides cleanly during OTP verification stage */}
            {!showOtpVerification && (
              <View style={styles.tabBar}>
                <Animated.View style={[styles.tabUnderline, { transform: [{ translateX }] }]} />
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={() => handleTabChange('otp')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === 'otp' && styles.activeTabText]}>
                    Email OTP
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={() => handleTabChange('password')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                    Password
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Dynamic Form Area */}
            <View style={styles.form}>

              {!showOtpVerification ? (
                <>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="name@example.com"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Password Input (Only activeTab === 'password') */}
                  {activeTab === 'password' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="#94A3B8"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={secureText}
                          autoCapitalize="none"
                          autoComplete="password"
                          editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setSecureText(!secureText)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Ionicons
                            name={secureText ? "eye-off-outline" : "eye-outline"}
                            size={18}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                /* Inline OTP Passcode Entry Grid */
                <View style={styles.otpSection}>
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

                  {/* Timer & Resend Link */}
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
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Pinned Bottom CTA Section */}
        <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.btn, !isFormValid && styles.btnOff]}
            onPress={
              showOtpVerification
                ? handleVerifyOtp
                : activeTab === 'otp'
                  ? handleEmailOtpLogin
                  : handlePasswordLogin
            }
            disabled={loading || !isFormValid}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>
                  {showOtpVerification
                    ? 'Verify Code'
                    : activeTab === 'otp'
                      ? 'Send OTP Code'
                      : 'Sign In'}
                </Text>
                <Ionicons name="arrow-forward-outline" size={16} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.footerText}>
            By proceeding, you agree to our Terms of Service & Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, backgroundColor: '#FFFFFF' },

  // Banner Image styled to cover the absolute full width with no horizontal white spaces
  banner: {
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },

  main: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },

  header: { marginBottom: 28 },
  title: { fontSize: 25, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 4, lineHeight: 18 },

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

  // Underline Tab Bar
  tabBar: {
    flexDirection: 'row',
    position: 'relative',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    marginBottom: 28,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1.5,
    left: 0,
    height: 2.5,
    backgroundColor: COLORS.primary,
    width: '50%',
    zIndex: 3,
  },

  form: {
    backgroundColor: '#FFFFFF',
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#0F172A', fontWeight: '600' },

  // Inline OTP verification block
  otpSection: {
    marginTop: 8,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20
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

  // Pinned Bottom Controls
  bottomArea: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  btnOff: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  footerText: {
    textAlign: 'center',
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 14,
    lineHeight: 18,
  },
});
