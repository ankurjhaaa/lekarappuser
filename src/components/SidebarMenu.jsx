import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, TouchableWithoutFeedback, DeviceEventEmitter, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useAuthStore from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function SidebarMenu({ visible: propVisible, onClose: propOnClose }) {
  const { user, logout } = useAuthStore();
  const [internalVisible, setInternalVisible] = useState(false);
  const [renderVisible, setRenderVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const isVisible = propVisible !== undefined ? propVisible : internalVisible;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    else setInternalVisible(false);
  };

  const handleLogout = () => {
    handleClose();
    setTimeout(() => {
      logout();
      router.replace('/(auth)/login');
    }, 300);
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
          {/* Header Section */}
          <View style={s.headerContainer}>
            <SafeAreaView edges={['top']}>
              <View style={s.headerContent}>
                <View style={s.avatarWrapper}>
                  <View style={s.avatarCircle}>
                    <Ionicons name="person" size={28} color={COLORS.primary} />
                  </View>
                  <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                    <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
                
                <View style={s.userMeta}>
                  <Text style={s.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
                  <View style={s.ratingBadge}>
                    <Ionicons name="star" size={10} color="#F59E0B" />
                    <Text style={s.ratingText}>4.9</Text>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </View>

          {/* Menu Items (Scrollable) */}
          <ScrollView style={s.menuList} showsVerticalScrollIndicator={false}>
            <MenuItem icon="person-outline" label="My Profile" onPress={() => handleNav('/(main)/(tabs)/profile')} />
            <MenuItem icon="time-outline" label="Ride History" onPress={() => handleNav('/(main)/(tabs)/rides')} />
            <MenuItem icon="wallet-outline" label="Wallet" onPress={() => handleNav('/(main)/(tabs)/wallet')} />
            <MenuItem icon="notifications-outline" label="Notifications" onPress={() => handleNav('/(main)/(tabs)/notifications')} />
            <MenuItem icon="shield-checkmark-outline" label="Safety Center" onPress={() => handleNav('/(main)/safety')} />
            <MenuItem icon="settings-outline" label="Settings" onPress={() => handleNav('/(main)/settings')} />
            <MenuItem icon="headset-outline" label="Help" onPress={() => handleNav('/(main)/help-support')} />
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Sticky Logout & Footer */}
          <View style={s.stickyFooter}>
            <View style={s.menuDivider} />
            <MenuItem 
              icon="log-out-outline" 
              label="Log Out" 
              onPress={handleLogout} 
              isDanger 
            />
            
            <View style={s.footer}>
              <View style={s.footerLinks}>
                <TouchableOpacity onPress={() => handleNav('/(main)/about')}>
                  <Text style={s.footerLinkText}>About</Text>
                </TouchableOpacity>
                <View style={s.footerDot} />
                <TouchableOpacity onPress={() => handleNav('/(main)/terms')}>
                  <Text style={s.footerLinkText}>Privacy</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.version}>v1.0.2</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function MenuItem({ icon, label, onPress, isDanger }) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.menuIconBox, isDanger && { backgroundColor: '#FEE2E2' }]}>
        <Ionicons name={icon} size={18} color={isDanger ? '#DC2626' : COLORS.textSecondary} />
      </View>
      <Text style={[s.menuLabel, isDanger && { color: '#DC2626' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={COLORS.border} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { width: width * 0.72, height: '100%', backgroundColor: COLORS.white, ...SHADOWS.large },
  
  headerContainer: { backgroundColor: COLORS.primary, paddingBottom: 16, borderBottomRightRadius: 24 },
  headerContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 6 : 0 },
  avatarWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { },
  
  userMeta: { },
  userName: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, alignSelf: 'flex-start', marginTop: 6 },
  ratingText: { fontSize: 11, fontWeight: '800', color: COLORS.white },
  
  menuList: { flex: 1, paddingTop: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  menuIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  
  stickyFooter: { backgroundColor: COLORS.white, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  menuDivider: { height: 1, backgroundColor: COLORS.border + '40', marginHorizontal: 20, marginBottom: 8 },
  
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLinkText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  footerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.border },
  version: { fontSize: 10, color: COLORS.textLight, marginTop: 4, fontWeight: '600' },
});
