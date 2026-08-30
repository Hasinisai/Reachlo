import React, { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';
import RADII from '../constants/radii';
import InputField from './InputField';
import { SPRING, TIMING } from '../constants/animations';

/**
 * PasswordInput
 * Password field with:
 *   - Animated eye toggle (show/hide)
 *   - Password strength indicator (colored gradient bar)
 *
 * Props:
 *   label             — field label
 *   value             — controlled value
 *   onChangeText      — change handler
 *   error             — error message
 *   showStrength      — show strength bar (default false)
 *   style             — container override
 *   ...rest           — forwarded to InputField
 */
const PasswordInput = ({
  label = 'Password',
  value,
  onChangeText,
  error,
  showStrength = false,
  style,
  ...rest
}) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [visible, setVisible] = useState(false);
  const eyeRotate = useSharedValue(0);

  const toggleVisibility = useCallback(() => {
    setVisible((v) => !v);
    eyeRotate.value = withSpring(visible ? 0 : 1, SPRING.SNAPPY);
  }, [visible, eyeRotate]);

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(1, { duration: TIMING.FAST }) }],
    opacity: withTiming(1, { duration: TIMING.FAST }),
  }));

  const strength = computeStrength(value ?? '');
  const strengthConfig = getStrengthMap(colors)[strength];

  const RightIcon = (
    <Pressable onPress={toggleVisibility} hitSlop={8}>
      <Animated.View style={eyeStyle}>
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.TEXT_SECONDARY}
        />
      </Animated.View>
    </Pressable>
  );

  return (
    <View style={style}>
      <InputField
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        secureTextEntry={!visible}
        rightIcon={RightIcon}
        leftIcon="lock-closed-outline"
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
      />
      {showStrength && value && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBarTrack}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.strengthSegment,
                  { backgroundColor: i < strength ? strengthConfig.color : colors.SURFACE_2 },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: strengthConfig.color }]}>
            {strengthConfig.label}
          </Text>
        </View>
      )}
    </View>
  );
};

// ── helpers ──────────────────────────────────────────────────────────────────
const computeStrength = (pwd) => {
  if (!pwd || pwd.length === 0) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const getStrengthMap = (colors) => ({
  0: { color: colors.ERROR,   label: 'Very weak' },
  1: { color: '#FB923C',      label: 'Weak' },
  2: { color: colors.ACCENT,  label: 'Fair' },
  3: { color: '#60A5FA',      label: 'Good' },
  4: { color: colors.SUCCESS, label: 'Strong' },
});

const getStyles = (colors) => StyleSheet.create({
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  strengthBarTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.MEDIUM,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    minWidth: 60,
    textAlign: 'right',
  },
});

export default PasswordInput;
