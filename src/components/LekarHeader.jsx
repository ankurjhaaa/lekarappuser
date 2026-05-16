import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { router } from 'expo-router';

/**
 * LekarHeader — Reusable red header with curved bottom wave.
 * Uses a large-radius rounded View to create the wave effect without SVG dependency.
 * 
 * Props:
 *  - onBack: function (if provided, shows back arrow)
 *  - onMenu: function (if provided, shows hamburger menu)
 *  - rightIcon: string (ionicon name)
 *  - onRightPress: function
 *  - compact: boolean (smaller padding for ride-detail etc)
 */
export default function LekarHeader({
  onBack,
  onMenu,
  rightIcon = 'notifications-outline',
  onRightPress,
  compact = false,
}) {
  const handleRightPress = () => {
    if (onRightPress) {
      onRightPress();
    } else if (rightIcon === 'notifications-outline') {
      router.push('/(main)/notifications');
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={[styles.headerBg, compact && styles.headerBgCompact]}>
        <View style={styles.headerContent}>
          {/* Left */}
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          ) : onMenu ? (
            <TouchableOpacity onPress={onMenu} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="menu" size={28} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconBtn} />
          )}

          {/* Center — Lekar Logo */}
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.lekarLogo}>Lekar</Text>
            <View style={styles.yellowSwoosh} />
          </View>

          {/* Right */}
          {rightIcon ? (
            <TouchableOpacity onPress={handleRightPress} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={rightIcon} size={24} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>
      </View>
      {/* Curved wave bottom — using a red ellipse overflow trick */}
      <View style={styles.waveWrapper}>
        <View style={styles.waveCurve} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? 6 : 2,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerBgCompact: {
    paddingTop: 0,
    paddingBottom: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lekarLogo: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  yellowSwoosh: {
    width: 28,
    height: 3,
    backgroundColor: COLORS.accentYellow || '#F7C937',
    borderRadius: 2,
    marginTop: -2,
    marginLeft: 18,
    transform: [{ rotate: '-4deg' }],
  },
  // Wave effect — red ellipse that extends slightly below header
  waveWrapper: {
    height: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  waveCurve: {
    backgroundColor: COLORS.primary,
    height: 30,
    marginTop: -18,
    borderBottomLeftRadius: 9999,
    borderBottomRightRadius: 9999,
    marginHorizontal: -20,
  },
});
