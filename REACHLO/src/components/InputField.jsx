import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import COLORS from '../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS, LINE_HEIGHTS } from '../constants/typography';

const InputField = React.forwardRef(({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoCapitalize,
  maxLength,
  editable = true,
  leftElement,
  secureTextEntry,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

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

  const borderColor = error
    ? COLORS.ERROR
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.BORDER, COLORS.BORDER_FOCUS],
      });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[
        styles.inputContainer,
        { borderColor },
        !editable && styles.disabledContainer
      ]}>
        {leftElement && (
          <View style={styles.leftContainer}>
            {leftElement}
            <View style={styles.separator} />
          </View>
        )}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT_PLACEHOLDER}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input, 
            !editable && styles.disabledInput,
            props.multiline && { minHeight: 80, textAlignVertical: 'top', paddingTop: 14, paddingBottom: 14 }
          ]}
          {...props}
        />
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

InputField.displayName = 'InputField';

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
    minHeight: 52,
  },
  disabledContainer: {
    opacity: 0.8,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.BORDER,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.REGULAR,
    padding: 0, // Reset default Android paddings
  },
  disabledInput: {
    color: COLORS.TEXT_SECONDARY,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.XS,
    fontWeight: FONT_WEIGHTS.REGULAR,
    marginTop: 4,
  },
});

export default InputField;
