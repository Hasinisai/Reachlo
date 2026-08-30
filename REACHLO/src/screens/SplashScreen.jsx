import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import API_CONFIG from '../config/apiConfig';

const { width, height } = Dimensions.get('window');

// ─── Config ──────────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 22;
const SPLASH_DURATION = 2200; // ms before auth navigation
const APP_VERSION = '1.0.0';

// ─── Particle Component ───────────────────────────────────────────────────────
function Particle({ index }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  // Deterministic but varied positioning from index
  const seed = index * 137.508; // golden angle
  const x = (width * 0.1) + ((seed * 53) % (width * 0.8));
  const y = (height * 0.05) + ((seed * 71) % (height * 0.85));
  const size = 3 + ((seed * 37) % 6);
  const delay = (seed * 19) % 800;
  const dur = 2400 + ((seed * 43) % 1600);
  const driftX = -20 + ((seed * 29) % 40);
  const driftY = -30 - ((seed * 17) % 40);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.25 + ((seed * 31) % 0.45),
            duration: dur * 0.4,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: dur * 0.4,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: driftX,
            duration: dur,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(translateY, {
            toValue: driftY,
            duration: dur,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: dur,
            useNativeDriver: true,
            easing: Easing.in(Easing.quad),
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const isAccent = index % 5 === 0;
  const isSecondary = index % 7 === 0;
  const particleColor = isAccent
    ? colors.ACCENT
    : isSecondary
    ? colors.SECONDARY
    : colors.PRIMARY_LIGHT;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: particleColor,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

// ─── Animated Gradient Background ────────────────────────────────────────────
function AnimatedGradientBg({ children }) {
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient
      colors={['#5B5FEF', '#7C4DFF', '#4a1a8c']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    >
      {children}
    </LinearGradient>
  );
}

// ─── Reachlo Logo ─────────────────────────────────────────────────────────────
function ReachloLogo({ size = 120 }) {
  const strokeWidth = size * 0.075;
  const innerSize = size * 0.68;

  return (
    <View style={[logoStyles.wrap, { width: size, height: size }]}>
      {/* Glow halo */}
      <View
        style={[
          logoStyles.halo,
          {
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: (size * 1.3) / 2,
            top: -(size * 0.15),
            left: -(size * 0.15),
          },
        ]}
      />

      {/* Outer arc — cyan-right */}
      <View
        style={[
          logoStyles.arcOuter,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#06B6D4',
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
          },
        ]}
      />

      {/* Inner arc — white/lavender left */}
      <View
        style={[
          logoStyles.arcInner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            borderWidth: strokeWidth,
            borderColor: 'rgba(255,255,255,0.90)',
            borderBottomColor: 'transparent',
            borderRightColor: 'transparent',
            top: size * 0.16,
            left: size * 0.16,
          },
        ]}
      />

      {/* Letter R */}
      <Text
        style={[
          logoStyles.letterR,
          { fontSize: size * 0.38, lineHeight: size * 0.44 },
        ]}
      >
        R
      </Text>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(91,95,239,0.18)',
  },
  arcOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ rotate: '45deg' }],
  },
  arcInner: {
    position: 'absolute',
    transform: [{ rotate: '225deg' }],
  },
  letterR: {
    fontWeight: FONT_WEIGHTS.BOLD,
    color: '#FFFFFF',
    includeFontPadding: false,
    letterSpacing: -1,
  },
});

// ─── Circular Loader ──────────────────────────────────────────────────────────
function CircularLoader() {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ])
    ).start();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[loaderStyles.wrap, { transform: [{ scale: pulse }] }]}>
      {/* Track ring */}
      <View style={loaderStyles.track} />
      {/* Spinning arc */}
      <Animated.View
        style={[loaderStyles.arc, { transform: [{ rotate }] }]}
      />
      {/* Inner dot */}
      <View style={loaderStyles.dot} />
    </Animated.View>
  );
}

const LOADER_SIZE = 48;
const LOADER_STROKE = 3.5;

const loaderStyles = StyleSheet.create({
  wrap: {
    width: LOADER_SIZE,
    height: LOADER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    width: LOADER_SIZE,
    height: LOADER_SIZE,
    borderRadius: LOADER_SIZE / 2,
    borderWidth: LOADER_STROKE,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  arc: {
    position: 'absolute',
    width: LOADER_SIZE,
    height: LOADER_SIZE,
    borderRadius: LOADER_SIZE / 2,
    borderWidth: LOADER_STROKE,
    borderColor: 'transparent',
    borderTopColor: '#FFFFFF',
    borderRightColor: 'rgba(255,255,255,0.4)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.70)',
  },
});

// ─── Main Splash Screen ───────────────────────────────────────────────────────
export default function SplashScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const { token, role, isLoading } = useAuth();

  // Master fade-in of entire content
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Logo group
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.72)).current;
  const logoTransY   = useRef(new Animated.Value(24)).current;

  // Brand name
  const nameOpacity  = useRef(new Animated.Value(0)).current;
  const nameTransY   = useRef(new Animated.Value(12)).current;

  // Tagline
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const tagTransY    = useRef(new Animated.Value(20)).current;

  // Loader
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  // Footer
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // CTA Buttons (post-auth)
  const btnsOpacity  = useRef(new Animated.Value(0)).current;
  const btnsTransY   = useRef(new Animated.Value(40)).current;

  const [timerDone, setTimerDone]     = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // ── Entry animation sequence ────────────────────────────────────────────────
  useEffect(() => {
    // Fire-and-forget backend wakeup ping (Render.com cold start)
    fetch(`${API_CONFIG.BASE_URL}/health`, { method: 'GET' }).catch(() => {});

    // 1. Fade in entire screen
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();

    // 2. Logo springs in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 600, delay: 150,
        useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(logoScale, {
        toValue: 1, delay: 150,
        tension: 55, friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoTransY, {
        toValue: 0, duration: 600, delay: 150,
        useNativeDriver: true, easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    // 3. Brand name slides up
    Animated.parallel([
      Animated.timing(nameOpacity, {
        toValue: 1, duration: 500, delay: 480,
        useNativeDriver: true,
      }),
      Animated.timing(nameTransY, {
        toValue: 0, duration: 500, delay: 480,
        useNativeDriver: true, easing: Easing.out(Easing.quad),
      }),
    ]).start();

    // 4. Tagline fades in
    Animated.parallel([
      Animated.timing(tagOpacity, {
        toValue: 1, duration: 500, delay: 750,
        useNativeDriver: true,
      }),
      Animated.timing(tagTransY, {
        toValue: 0, duration: 500, delay: 750,
        useNativeDriver: true, easing: Easing.out(Easing.quad),
      }),
    ]).start();

    // 5. Loader appears
    Animated.timing(loaderOpacity, {
      toValue: 1, duration: 400, delay: 1000,
      useNativeDriver: true,
    }).start();

    // 6. Footer appears
    Animated.timing(footerOpacity, {
      toValue: 1, duration: 400, delay: 1100,
      useNativeDriver: true,
    }).start();

    // 7. Navigate after SPLASH_DURATION
    const timer = setTimeout(() => setTimerDone(true), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // ── Auth routing ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerDone || isLoading) return;

    if (token && role) {
      if (role === 'SELLER')      navigation.replace('SellerDashboard');
      else if (role === 'ADMIN')  navigation.replace('AdminDashboard');
      else                        navigation.replace('DiscoveryFeed');
    } else {
      setShowButtons(true);
      Animated.parallel([
        Animated.timing(btnsOpacity, {
          toValue: 1, duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(btnsTransY, {
          toValue: 0, tension: 50, friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [timerDone, isLoading, token, role]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSellerPress = () => navigation.navigate('Register', { defaultRole: 'SELLER' });
  const handleBuyerPress  = () => navigation.navigate('Register', { defaultRole: 'BUYER' });
  const handleLoginPress  = () => navigation.navigate('Login');

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Animated gradient background ── */}
      <AnimatedGradientBg />

      {/* ── Subtle overlay vignette ── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.08)', 'transparent', 'rgba(0,0,0,0.25)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* ── Floating particles ── */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}

      {/* ── Glass highlight blob — top right ── */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* ── Main content ── */}
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>

          {/* ── Center stage ── */}
          <View style={styles.centerStage}>

            {/* Logo */}
            <Animated.View
              style={[
                styles.logoWrap,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }, { translateY: logoTransY }],
                },
              ]}
            >
              {/* Glass card behind logo */}
              <View style={styles.logoGlassCard}>
                <ReachloLogo size={100} />
              </View>
            </Animated.View>

            {/* Brand name */}
            <Animated.Text
              style={[
                styles.brandName,
                { opacity: nameOpacity, transform: [{ translateY: nameTransY }] },
              ]}
            >
              REACHLO
            </Animated.Text>

            {/* Tagline */}
            <Animated.Text
              style={[
                styles.tagline,
                { opacity: tagOpacity, transform: [{ translateY: tagTransY }] },
              ]}
            >
              Connecting Businesses{'\n'}with Local Creators
            </Animated.Text>

            {/* Loader */}
            <Animated.View style={[styles.loaderWrap, { opacity: loaderOpacity }]}>
              <CircularLoader />
            </Animated.View>

            {/* CTA Buttons — shown after auth check */}
            {showButtons && (
              <Animated.View
                style={[
                  styles.buttonsContainer,
                  { opacity: btnsOpacity, transform: [{ translateY: btnsTransY }] },
                ]}
              >
                {/* Seller CTA */}
                <Pressable
                  onPress={handleSellerPress}
                  style={({ pressed }) => [styles.sellerButton, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Grow Your Business"
                >
                  <LinearGradient
                    colors={[colors.PRIMARY, colors.SECONDARY]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnGradient}
                  >
                    <View style={styles.btnInner}>
                      <View style={styles.btnTextWrap}>
                        <Text style={styles.btnTitle}>Grow Your Business</Text>
                        <Text style={styles.btnSub}>For businesses & sellers</Text>
                      </View>
                      <Text style={styles.btnArrow}>→</Text>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Buyer CTA */}
                <Pressable
                  onPress={handleBuyerPress}
                  style={({ pressed }) => [styles.buyerButton, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Explore Amazing Offers"
                >
                  <View style={styles.btnInner}>
                    <View style={styles.btnTextWrap}>
                      <Text style={styles.buyerBtnTitle}>Explore Amazing Offers</Text>
                      <Text style={styles.buyerBtnSub}>For shoppers & buyers</Text>
                    </View>
                    <Text style={styles.buyerBtnArrow}>→</Text>
                  </View>
                </Pressable>

                {/* Login link */}
                <Pressable onPress={handleLoginPress} style={styles.loginLink}>
                  <Text style={styles.loginText}>
                    Already have an account?{' '}
                    <Text style={styles.loginBold}>Sign In</Text>
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* ── Footer ── */}
          <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
            <Text style={styles.versionText}>Version {APP_VERSION}</Text>
            <Text style={styles.madeWith}>Made with ❤️ by Sorven Global</Text>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const getStyles = (colors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1b4b',
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // ── Blobs ──
  blobTopRight: {
    position: 'absolute',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor: 'rgba(124,77,255,0.18)',
    top: -width * 0.15,
    right: -width * 0.2,
  },
  blobBottomLeft: {
    position: 'absolute',
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: 'rgba(6,182,212,0.10)',
    bottom: -width * 0.1,
    left: -width * 0.15,
  },

  // ── Center ──
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoGlassCard: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    // Soft glow
    shadowColor: colors.PRIMARY,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.50,
    shadowRadius: 32,
    elevation: 16,
  },

  // Brand name
  brandName: {
    fontSize: 34,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: '#FFFFFF',
    letterSpacing: 8,
    marginBottom: 18,
    textShadowColor: 'rgba(91,95,239,0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },

  // Tagline
  tagline: {
    fontSize: FONT_SIZES.MD,
    fontWeight: FONT_WEIGHTS.REGULAR,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.3,
    marginBottom: 48,
  },

  // Loader
  loaderWrap: {
    marginBottom: 12,
    alignItems: 'center',
  },

  // ── CTA Buttons ──
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  sellerButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: colors.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  btnGradient: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  buyerButton: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.975 }],
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnTextWrap: {
    flex: 1,
  },
  btnTitle: {
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  btnSub: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: FONT_WEIGHTS.MEDIUM,
  },
  btnArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHTS.BOLD,
  },
  buyerBtnTitle: {
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  buyerBtnSub: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: FONT_WEIGHTS.MEDIUM,
  },
  buyerBtnArrow: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.80)',
    fontWeight: FONT_WEIGHTS.BOLD,
  },
  loginLink: {
    paddingVertical: 8,
  },
  loginText: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255,255,255,0.60)',
    textAlign: 'center',
  },
  loginBold: {
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
    gap: 4,
  },
  versionText: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 0.5,
  },
  madeWith: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 0.2,
  },
});
