import React, { useState, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';
import RADII from '../constants/radii';
import { SPRING, TIMING } from '../constants/animations';

/**
 * InputField
 * Premium animated text input with:
 *   - Floating label animation
 *   - Focus glow ring
 *   - Left/right icon slots
 *   - Error, success, and normal states
 *
 * Props:
 *   label         — field label
 *   value         — controlled value
 *   onChangeText  — change handler
 *   placeholder   — placeholder text (shows when no label)
 *   error         — error message string
 *   success       — boolean, show success ring
 *   leftIcon      — icon name (Ionicons) or React element
 *   rightIcon     — icon name (Ionicons) or React element
 *   onRightIconPress — press handler for right icon
 *   style         — outer container override
 *   inputStyle    — TextInput override
 *   disabled      — disables interaction
 *   multiline     — enables multiline mode
 *   numberOfLines — multiline line count
 *   hint          — helper text below input
 *   ...rest       — passed to TextInput
 */
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  success = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  hint,
  ...rest
}) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const focusAnim = useSharedValue(0);
  const labelAnim = useSharedValue(value ? 1 : 0);

  const handleFocus = useCallback(() => {
    setFocused(true);
    focusAnim.value = withSpring(1, SPRING.SNAPPY);
    labelAnim.value = withSpring(1, SPRING.SNAPPY);
  }, [focusAnim, labelAnim]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    focusAnim.value = withSpring(0, SPRING.SNAPPY);
    if (!value) labelAnim.value = withSpring(0, SPRING.SNAPPY);
  }, [focusAnim, labelAnim, value]);

  // Animated border color
  const borderStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? colors.ERROR
      : success
      ? colors.SUCCESS
      : interpolateColor(
          focusAnim.value,
          [0, 1],
          [colors.BORDER, colors.BORDER_FOCUS]
        );
    return {
      borderColor,
      shadowOpacity: focusAnim.value * (error ? 0 : success ? 0.18 : 0.14),
      shadowColor: error ? colors.ERROR : success ? colors.SUCCESS : colors.PRIMARY,
    };
  });

  // Floating label
  const floatingLabelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withTiming(labelAnim.value ? -24 : 0, { duration: TIMING.FAST }) },
      { scale: withTiming(labelAnim.value ? 0.82 : 1, { duration: TIMING.FAST }) },
    ],
  }));

  const stateIcon = error ? 'alert-circle' : success ? 'checkmark-circle' : null;
  const stateColor = error ? colors.ERROR : colors.SUCCESS;

  const hasFloatingLabel = !!label;
  const paddingTop = hasFloatingLabel ? 22 : 0;

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[
          styles.container,
          multiline && { height: numberOfLines * 44 + paddingTop },
          disabled && styles.disabled,
          borderStyle,
          {
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
            elevation: focused ? 2 : 0,
          },
        ]}
      >
        {/* Floating label */}
        {hasFloatingLabel && (
          <Animated.Text
            style={[
              styles.floatingLabel,
              { left: leftIcon ? 44 : 16 },
              floatingLabelStyle,
              focused && { color: error ? colors.ERROR : colors.PRIMARY },
            ]}
          >
            {label}
          </Animated.Text>
        )}

        <View style={styles.row}>
          {/* Left icon */}
          {leftIcon && (
            <View style={styles.iconLeft}>
              {typeof leftIcon === 'string' ? (
                <Ionicons
                  name={leftIcon}
                  size={20}
                  color={focused ? colors.PRIMARY : colors.TEXT_SECONDARY}
                />
              ) : leftIcon}
            </View>
          )}

          {/* Input */}
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={hasFloatingLabel ? undefined : placeholder}
            placeholderTextColor={colors.TEXT_PLACEHOLDER}
            editable={!disabled}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            style={[
              styles.input,
              { paddingTop: hasFloatingLabel ? paddingTop : 0 },
              leftIcon && { paddingLeft: 0 },
              (rightIcon || stateIcon) && { paddingRight: 0 },
              multiline && styles.multilineInput,
              inputStyle,
            ]}
            {...rest}
          />

          {/* Right icon / State icon */}
          {(rightIcon || stateIcon) && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.iconRight}
              hitSlop={8}
              disabled={!onRightIconPress}
            >
              {stateIcon ? (
                <Ionicons name={stateIcon} size={20} color={stateColor} />
              ) : typeof rightIcon === 'string' ? (
                <Ionicons name={rightIcon} size={20} color={colors.TEXT_SECONDARY} />
              ) : rightIcon}
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Error / hint text */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: RADII.INPUT,
    borderWidth: 1.5,
    borderColor: colors.BORDER,
    minHeight: 56,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: colors.SURFACE,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatingLabel: {
    position: 'absolute',
    top: '50%',
    fontSize: FONT_SIZES.BASE,
    fontFamily: FONTS.REGULAR,
    color: colors.TEXT_PLACEHOLDER,
    transformOrigin: 'left center',
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.BASE,
    fontFamily: FONTS.REGULAR,
    fontWeight: FONT_WEIGHTS.REGULAR,
    color: colors.TEXT_PRIMARY,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 28,
  },
  iconLeft: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
  },
  iconRight: {
    marginLeft: 10,
    width: 24,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.MEDIUM,
    color: colors.ERROR,
  },
  hintText: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    color: colors.TEXT_SECONDARY,
  },
});

export default InputField;
