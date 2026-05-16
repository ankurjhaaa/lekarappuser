import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { height } = Dimensions.get('window');

const PRESET_LABELS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'work', label: 'Work', icon: 'briefcase' },
  { id: 'gym', label: 'Gym', icon: 'fitness' },
  { id: 'college', label: 'College', icon: 'school' },
];

export default function SavedLocationModal({ visible, onClose, onSave, initialData = null, loading = false }) {
  const [show, setShow] = useState(visible);
  const bgAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  const [label, setLabel] = useState(initialData?.label || '');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      setLabel(initialData?.label || '');
      const preset = PRESET_LABELS.find(p => p.label.toLowerCase() === (initialData?.label || '').toLowerCase());
      if (preset) {
        setSelectedPreset(preset.id);
        setIsManual(false);
      } else if (initialData?.label) {
        setIsManual(true);
      }
      
      Animated.parallel([
        Animated.timing(bgAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true })
      ]).start(() => setShow(false));
    }
  }, [visible]);

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    setLabel(preset.label);
    setIsManual(false);
  };

  const handleManualPress = () => {
    setSelectedPreset(null);
    setLabel('');
    setIsManual(true);
  };

  const handleSave = () => {
    if (!label) return;
    onSave({ ...initialData, label });
  };

  if (!show) return null;

  // Dynamic Title
  const modalTitle = initialData?.id ? `Edit ${label}` : `Save ${label || 'Location'}`;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: bgAnim }]} />
        </TouchableOpacity>
        
        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.content}>
            <View style={styles.handle} />
            
            <View style={styles.header}>
              <Text style={styles.title}>{modalTitle}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              {/* Address Display (Non-Editable) */}
              <View style={styles.addressDisplay}>
                <View style={styles.addressIconBox}>
                  <Ionicons name="location" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>ADDRESS</Text>
                  <Text style={styles.addressText} numberOfLines={2}>{initialData?.address}</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>NAME AS</Text>
              <View style={styles.presets}>
                {PRESET_LABELS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.presetBtn,
                      selectedPreset === item.id && styles.presetBtnSelected,
                    ]}
                    onPress={() => handlePresetSelect(item)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={selectedPreset === item.id ? COLORS.white : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.presetText,
                        selectedPreset === item.id && styles.presetTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.presetBtn, isManual && styles.presetBtnSelected]}
                  onPress={handleManualPress}
                >
                  <Ionicons
                    name="create"
                    size={16}
                    color={isManual ? COLORS.white : COLORS.textSecondary}
                  />
                  <Text style={[styles.presetText, isManual && styles.presetTextSelected]}>Other</Text>
                </TouchableOpacity>
              </View>

              {isManual && (
                <View style={styles.manualInputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter name (e.g. Gym, Library)"
                    value={label}
                    onChangeText={setLabel}
                    placeholderTextColor={COLORS.textLight}
                    autoFocus
                  />
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveBtn, !label && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={loading || !label}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20, // Reduced rounding
    borderTopRightRadius: 20, // Reduced rounding
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...SHADOWS.large,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#EEEEEE',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  addressDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  addressIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10, // Matching less rounded style
    gap: 6,
  },
  presetBtnSelected: {
    backgroundColor: COLORS.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  presetTextSelected: {
    color: COLORS.white,
  },
  manualInputWrapper: {
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.textLight + '50',
    elevation: 0,
    shadowOpacity: 0,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
