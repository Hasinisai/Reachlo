import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';
import InputField from '../components/InputField';
import PasswordInput from '../components/PasswordInput';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';

// Step indicator pill component
function StepPill({ step, label, active, styles: customStyles }) {
  const { colors } = useTheme();
  const styles = customStyles || getStyles(colors);
  return (
    <View style={styles.stepPillWrapper}>
      <View style={[styles.stepPill, active ? styles.stepPillActive : styles.stepPillInactive]}>
        <Text style={[styles.stepPillText, active ? styles.stepPillTextActive : styles.stepPillTextInactive]}>
          {step}
        </Text>
      </View>
      <Text style={[styles.stepLabel, active ? styles.stepLabelActive : styles.stepLabelInactive]}>
        {label}
      </Text>
    </View>
  );
}

export default function SellerRegisterStep1Screen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const scrollRef = useRef(null);
  const layouts = useRef({});

  const showToast = (msg, type = 'error') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const handleLayout = (field, e) => {
    layouts.current[field] = e.nativeEvent.layout.y;
  };

  const validate = () => {
    const errs = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }

    const numericPhone = phone.replace(/[^0-9]/g, '');
    if (!phone) {
      errs.phone = 'Phone number is required';
    } else if (numericPhone.length !== 10) {
      errs.phone = 'Phone number must be exactly 10 digits';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    setErrors(errs);

    const firstErr = Object.keys(errs)[0];
    if (firstErr && layouts.current[firstErr] !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, layouts.current[firstErr] - 20), animated: true });
    }
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    Keyboard.dismiss();
    if (!validate()) return;

    // Step 1 data is saved in local state only — NOT sent to backend yet.
    // Both steps are submitted together as one call in Step 2 to avoid half-created accounts.
    navigation.navigate('SellerRegisterStep2', {
      step1Data: {
        name: name.trim(),
        phone: phone.replace(/[^0-9]/g, ''),
        email: email.trim().toLowerCase(),
        password,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logoText}>REACHLO</Text>

              {/* Step indicator */}
              <View style={styles.stepIndicator}>
                <StepPill step="1" label="Personal" active={true} styles={styles} />
                <View style={styles.stepConnector} />
                <StepPill step="2" label="Business" active={false} styles={styles} />
              </View>

              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Step 1 of 2 — Personal details</Text>
            </View>

            {/* Form card */}
            <View style={styles.card}>
              {/* Full Name */}
              <View onLayout={(e) => handleLayout('name', e)}>
                <InputField
                  ref={nameRef}
                  label="Full name"
                  value={name}
                  onChangeText={(t) => { setName(t); if (errors.name) setErrors(p => ({ ...p, name: null })); }}
                  placeholder="e.g. Priya Sharma"
                  error={errors.name}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Phone */}
              <View onLayout={(e) => handleLayout('phone', e)}>
                <InputField
                  ref={phoneRef}
                  label="Phone number"
                  value={phone}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9]/g, '');
                    setPhone(cleaned);
                    if (errors.phone) setErrors(p => ({ ...p, phone: null }));
                  }}
                  placeholder="+91 XXXXX XXXXX"
                  error={errors.phone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  leftElement={<Text style={styles.phonePrefix}>+91</Text>}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Email */}
              <View onLayout={(e) => handleLayout('email', e)}>
                <InputField
                  ref={emailRef}
                  label="Email address"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors(p => ({ ...p, email: null })); }}
                  placeholder="you@example.com"
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Password */}
              <View onLayout={(e) => handleLayout('password', e)}>
                <PasswordInput
                  ref={passwordRef}
                  label="Password"
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (errors.password) setErrors(p => ({ ...p, password: null })); }}
                  placeholder="Minimum 8 characters"
                  error={errors.password}
                  showStrength={true}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                  blurOnSubmit={true}
                />
              </View>

              {/* Continue button */}
              <PrimaryButton
                title="Continue →"
                onPress={handleContinue}
                style={styles.continueBtn}
              />

              {/* Login link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Already have an account?</Text>
                <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>Log in</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: colors.PRIMARY,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoText: {
    color: colors.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.BOLD,
    letterSpacing: 4,
    opacity: 0.9,
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepPillWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  stepPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepPillActive: {
    backgroundColor: colors.WHITE,
  },
  stepPillInactive: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  stepPillText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.BOLD,
  },
  stepPillTextActive: {
    color: colors.PRIMARY,
  },
  stepPillTextInactive: {
    color: 'rgba(255,255,255,0.7)',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.MEDIUM,
  },
  stepLabelActive: {
    color: colors.WHITE,
  },
  stepLabelInactive: {
    color: 'rgba(255,255,255,0.5)',
  },
  stepConnector: {
    height: 2,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
    marginBottom: 22,
  },
  title: {
    color: colors.WHITE,
    fontSize: FONT_SIZES.XXL,
    fontWeight: FONT_WEIGHTS.BOLD,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZES.SM,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 20,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 4,
  },
  phonePrefix: {
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    color: colors.TEXT_PRIMARY,
  },
  continueBtn: {
    marginTop: 20,
    marginBottom: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    color: colors.TEXT_SECONDARY,
    fontSize: FONT_SIZES.SM,
    marginRight: 4,
  },
  loginLink: { padding: 4 },
  loginLinkText: {
    color: colors.PRIMARY,
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
  },
});
