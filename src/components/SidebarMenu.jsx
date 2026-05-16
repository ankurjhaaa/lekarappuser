import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, TouchableWithoutFeedback, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useAuthStore from '../store/authStore';

const { width, height } = Dimensions.get('window');

export default function SidebarMenu({ visible: propVisible, onClose: propOnClose }) {
  const { user } = useAuthStore();
  const [internalVisible, setInternalVisible] = useState(false);
  const [renderVisible, setRenderVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const isVisible = propVisible !== undefined ? propVisible : internalVisible;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    else setInternalVisible(false);
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('openSidebar', () => {
      setInternalVisible(true);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isVisible) {
      setRenderVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setRenderVisible(false);
      });
    }
  }, [isVisible]);

  if (!renderVisible) return null;

  const handleNav = (route) => {
    handleClose();
    setTimeout(() => {
      router.push(route);
    }, 300);
  };

  return (
    <Modal visible={renderVisible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={s.backdrop} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[s.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.avatarCircle}>
              <Ionicons name="person" size={40} color={COLORS.textLight} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.userName}>{user?.name || 'Guest User'}</Text>
              <View style={s.ratingBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={s.ratingText}>4.8</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={s.menuList}>
            <MenuItem icon="person-outline" label="My Profile" onPress={() => handleNav('/(main)/(tabs)/profile')} />
            <MenuItem icon="time-outline" label="Ride History" onPress={() => handleNav('/(main)/(tabs)/rides')} />
            <MenuItem icon="wallet-outline" label="Wallet" onPress={() => handleNav('/(main)/(tabs)/wallet')} />
            <MenuItem icon="notifications-outline" label="Notifications" onPress={() => handleNav('/(main)/(tabs)/notifications')} />
            <MenuItem icon="shield-checkmark-outline" label="Safety" onPress={() => handleNav('/(main)/safety')} />
            <MenuItem icon="headset-outline" label="Help & Support" onPress={() => handleNav('/(main)/help-support')} />
            <MenuItem icon="settings-outline" label="Settings" onPress={() => handleNav('/(main)/settings')} />
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity onPress={() => handleNav('/(main)/about')} style={s.footerRow}>
              <Text style={s.footerText}>About Lekar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNav('/(main)/terms')} style={s.footerRow}>
              <Text style={s.footerText}>Terms & Privacy</Text>
            </TouchableOpacity>
            <Text style={s.version}>Version 1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={COLORS.textSecondary} style={{ width: 30 }} />
      <Text style={s.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { width: width * 0.75, height: '100%', backgroundColor: COLORS.white, ...SHADOWS.large },
  header: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.white },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  ratingText: { fontSize: SIZES.sm, fontWeight: '700', color: '#92400E' },
  closeBtn: { position: 'absolute', top: 40, right: 16, padding: 8 },
  menuList: { flex: 1, paddingTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  menuLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginLeft: 10 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerRow: { paddingVertical: 8 },
  footerText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  version: { fontSize: 12, color: COLORS.textLight, marginTop: 10 },
});
