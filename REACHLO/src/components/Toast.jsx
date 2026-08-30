import React, { useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';
import SHADOWS from '../constants/shadows';
import { SPRING, TIMING } from '../constants/animations';

/**
 * Toast
 * Spring-animated slide-in notification with auto-dismiss.
 *
 * Props:
 *   visible       — show/hide
 *   message       — body text
 *   title         — optional heading
 *   variant       — 'success' | 'error' | 'warning' | 'info'
 *   duration      — auto-dismiss delay ms (default 3000, 0 = manual)
 *   onDismiss     — callback when dismissed
 *   position      — 'top' | 'bottom' (default 'bottom')
 */
const Toast = ({
  visible,
  message,
  title,
  variant = 'success',
  duration = 3000,
  onDismiss,
  position = 'bottom',
}) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const translateY = useSharedValue(position === 'bottom' ? 120 : -120);
  const opacity = useSharedValue(0);

  const VARIANT_MAP = getVariantMap(colors);
  const config = VARIANT_MAP[variant] ?? VARIANT_MAP.success;

  const dismiss = useCallback(() => {
    translateY.value = withSpring(position === 'bottom' ? 120 : -120, SPRING.DEFAULT);
    opacity.value = withTiming(0, { duration: TIMING.DEFAULT });
    if (onDismiss) {
      const timer = setTimeout(onDismiss, TIMING.DEFAULT + 50);
      return () => clearTimeout(timer);
    }
  }, [translateY, opacity, position, onDismiss]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING.BOUNCY);
      opacity.value = withTiming(1, { duration: TIMING.FAST });
      if (duration > 0) {
        const timer = setTimeout(dismiss, duration);
        return () => clearTimeout(timer);
      }
    } else {
      dismiss();
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
        SHADOWS.LG,
        animatedStyle,
      ]}
    >
      {/* Left accent stripe */}
      <View style={[styles.stripe, { backgroundColor: config.color }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
      </View>

      {/* Dismiss */}
      <Pressable onPress={dismiss} style={styles.closeBtn} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.TEXT_SECONDARY} />
      </Pressable>
    </Animated.View>
  );
};

const getVariantMap = (colors) => ({
  success: { color: colors.SUCCESS, bg: '#F0FDF4', icon: 'checkmark-circle' },
  error:   { color: colors.ERROR,   bg: '#FEF2F2', icon: 'close-circle' },
  warning: { color: colors.ACCENT,  bg: '#FFFBEB', icon: 'warning' },
  info:    { color: '#3B82F6',       bg: '#EFF6FF', icon: 'information-circle' },
});

const getStyles = (colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.WHITE,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 9999,
  },
  top: { top: 60 },
  bottom: { bottom: 32 },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  title: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.SEMIBOLD,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    color: colors.TEXT_PRIMARY,
    marginBottom: 2,
  },
  message: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    color: colors.TEXT_SECONDARY,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 12,
  },
});

export default Toast;
