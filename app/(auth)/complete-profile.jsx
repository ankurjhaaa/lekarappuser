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
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { userAPI } from '../../src/api/user';
import useAuthStore from '../../src/store/authStore';

const GENDERS = ['male', 'female', 'other'];

export default function CompleteProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.gender) setGender(user.gender);
    }
  }, [user]);

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 3) {
      Alert.alert('Invalid Name', 'Please enter your name.');
      return;
    }
    if (cleanPhone.length !== 10 || !/^\d+$/.test(cleanPhone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await userAPI.updateProfile({
        name: cleanName,
        phone: cleanPhone,
        gender: gender,
      });

      if (res.data.success) {
        await setUser(res.data.user);
        // Clean flow: Go straight to home without blocking alerts
        router.replace('/(main)/(tabs)/home');
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update profile.';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  const isFormValid = name.trim().length >= 3 && phone.trim().length === 10;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.main, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* Elegant Header with Logo */}
            <View style={styles.header}>
              <Image 
                source={require('../../assets/images/lekar.png')} 
                style={styles.logo}
              />
              <Text style={styles.title}>Complete Profile</Text>
              <Text style={styles.subtitle}>Tell us a bit about yourself to get started</Text>
            </View>

            {/* Floating Form Fields (Clean Spacing, No Cards) */}
            <View style={styles.form}>
              
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="number-pad"
                    maxLength={10}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Segmented Gender Select */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderTab, gender === g && styles.genderTabActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </View>
          </Animated.View>
        </ScrollView>

        {/* Pinned Bottom Submit Action Button */}
        <View style={styles.bottomArea}>
          <TouchableOpacity 
            style={[styles.btn, !isFormValid && styles.btnOff]}
            onPress={handleSubmit}
            disabled={loading || !isFormValid}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>Save & Continue</Text>
                <Ionicons name="arrow-forward-outline" size={16} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, backgroundColor: '#FFFFFF' },
  
  main: { paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 24 : 40, paddingBottom: 24 },
  
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 72, height: 72, resizeMode: 'contain', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 4, lineHeight: 18 },

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
  
  // Segmented Gender controls
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  genderTab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  genderTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  genderText: { fontSize: 13.5, fontWeight: '600', color: '#64748B' },
  genderTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Pinned Bottom Section Styles
  bottomArea: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
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
});
