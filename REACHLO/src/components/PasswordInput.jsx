import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Pressable } from 'react-native';
import COLORS from '../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';

const PasswordInput = React.forwardRef(({
  label,
  value,
  onChangeText,
  placeholder = '••••••••',
  error,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  showStrength = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: COLORS.BORDER };
    if (pass.length < 8) return { score: 1, text: 'Too short', color: COLORS.ERROR };
    
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    
    const mixCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (pass.length >= 12 && hasUpper && hasLower && hasNumber) {
      return { score: 3, text: 'Strong', color: COLORS.SUCCESS };
    }
    
    if (pass.length >= 8 && mixCount >= 2) {
      return { score: 2, text: 'Fair', color: '#F59E0B' }; // Amber
    }
    
    return { score: 1, text: 'Too short', color: COLORS.ERROR };
  };

  const strength = getPasswordStrength(value);

  useEffect(() => {
    let targetWidth = 0;
    if (strength.score === 1) targetWidth = 33;
    else if (strength.score === 2) targetWidth = 66;
    else if (strength.score === 3) targetWidth = 100;

    Animated.timing(widthAnim, {
      toValue: targetWidth,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, strength.score]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const borderColor = error
    ? COLORS.ERROR
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.BORDER, COLORS.BORDER_FOCUS],
      });

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[
        styles.inputContainer,
        { borderColor },
        !editable && styles.disabledContainer
      ]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT_PLACEHOLDER}
          secureTextEntry={isSecure}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, !editable && styles.disabledInput]}
          autoCapitalize="none"
          {...props}
        />
        <Pressable
          onPress={toggleSecureEntry}
          disabled={!editable}
          style={styles.eyeButton}
          accessibilityLabel={isSecure ? "Show password" : "Hide password"}
          accessibilityRole="button"
        >
          <Text style={styles.eyeText}>{isSecure ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </Animated.View>
      
      {showStrength && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBarBackground}>
            <Animated.View style={[
              styles.strengthBarActive,
              { width: animatedWidth, backgroundColor: strength.color }
            ]} />
          </View>
          <Text style={[styles.strengthText, { color: strength.color }]}>
            {strength.text}
          </Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 52,
  },
  disabledContainer: {
    opacity: 0.8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.REGULAR,
    padding: 0,
  },
  disabledInput: {
    color: COLORS.TEXT_SECONDARY,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: COLORS.PRIMARY,
  },
  strengthContainer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 10,
  },
  strengthBarActive: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: FONT_WEIGHTS.MEDIUM,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.XS,
    fontWeight: FONT_WEIGHTS.REGULAR,
    marginTop: 4,
  },
});

export default PasswordInput;
