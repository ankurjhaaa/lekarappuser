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
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { authAPI } from '../../src/api/auth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!name || phone.length !== 10 || !email.includes('@') || password.length < 6) {
      Alert.alert('Error', 'Please fill all fields correctly. Email is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({ name, phone, email: email || undefined, password });
      if (res.data.success) {
        if (res.data.otp) Alert.alert('Dev OTP', `Your OTP is: ${res.data.otp}`);
        router.push({ pathname: '/(auth)/verify-otp', params: { phone, email, via: 'email' } });
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in your details to get started</Text>

          {/* Form */}
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
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginBold}>Login</Text>
            </Text>
          </TouchableOpacity>
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
  buttonText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 24 },
  loginText: { fontSize: SIZES.md, color: COLORS.textSecondary },
  loginBold: { color: COLORS.primary, fontWeight: '700' },
});
