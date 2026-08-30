import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';
import COLORS from '../constants/colors';

const { width, height } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    image: require('../../assets/onboarding_1.png'),
    tag: 'Collaborate',
    tagColor: COLORS.PRIMARY,
    tagBg: COLORS.PRIMARY_ULTRA_LIGHT,
    heading: 'Grow\nTogether',
    description:
      'Find campaigns.\nEarn money.\nPromote local businesses.',
    gradientColors: ['#f0f0ff', '#e8eaff', '#f8fafc'],
    accentColor: COLORS.PRIMARY,
    illustrationBg: '#EEEEFF',
  },
  {
    id: '2',
    image: require('../../assets/onboarding_2.png'),
    tag: 'Discover',
    tagColor: '#0EA5E9',
    tagBg: '#E0F6FF',
    heading: 'Find the\nRight Campaign',
    description:
      'Browse verified local businesses.\nFilter by city and category.\nApply in one tap.',
    gradientColors: ['#e8f8ff', '#edf5ff', '#f8fafc'],
    accentColor: '#0EA5E9',
    illustrationBg: '#E0F8FF',
  },
  {
    id: '3',
    image: require('../../assets/onboarding_3.png'),
    tag: 'Earn',
    tagColor: '#059669',
    tagBg: '#D1FAE5',
    heading: 'Turn Reach\ninto Revenue',
    description:
      'Promote businesses you love.\nGet paid for real results.\nNo middlemen. No hassle.',
    gradientColors: ['#ecfdf5', '#e8f5ff', '#f8fafc'],
    accentColor: '#059669',
    illustrationBg: '#D1FAE5',
  },
];

// ─── AnimatedDot ──────────────────────────────────────────────────────────────
function AnimatedDot({ active, color }) {
  const widthAnim = useRef(new Animated.Value(active ? 28 : 8)).current;
  const opacityAnim = useRef(new Animated.Value(active ? 1 : 0.35)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: active ? 28 : 8,
        useNativeDriver: false,
        tension: 70,
        friction: 9,
      }),
      Animated.timing(opacityAnim, {
        toValue: active ? 1 : 0.35,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [active]);

  return (
    <Animated.View
      style={{
        width: widthAnim,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: opacityAnim,
        marginHorizontal: 4,
      }}
    />
  );
}

// ─── Slide illustration area ──────────────────────────────────────────────────
function SlideIllustration({ item, index, scrollX, styles }) {
  if (!styles) return null;
  // Parallax: illustration moves slightly slower than scroll
  const inputRange = [
    (index - 1) * width,
    index * width,
    (index + 1) * width,
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.85, 1, 0.85],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [20, 0, 20],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.illustrationWrapper,
        { opacity, transform: [{ scale }, { translateY }] },
      ]}
    >
      {/* Soft circle behind illustration */}
      <View style={[styles.illustrationBg, { backgroundColor: item.illustrationBg }]} />

      {/* Floating accent rings */}
      <View style={[styles.ring, styles.ringOuter, { borderColor: item.accentColor + '18' }]} />
      <View style={[styles.ring, styles.ringInner, { borderColor: item.accentColor + '28' }]} />

      <Image
        source={item.image}
        style={styles.illustration}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ─── Slide text area ──────────────────────────────────────────────────────────
function SlideText({ item, index, scrollX, styles }) {
  if (!styles) return null;
  const inputRange = [
    (index - 1) * width,
    index * width,
    (index + 1) * width,
  ];

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [30, 0, 30],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.textBlock, { opacity, transform: [{ translateY }] }]}>
      {/* Category tag */}
      <View style={[styles.tag, { backgroundColor: item.tagBg }]}>
        <View style={[styles.tagDot, { backgroundColor: item.tagColor }]} />
        <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
      </View>

      {/* Heading */}
      <Text style={styles.heading}>{item.heading}</Text>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Button animations
  const btnScale = useRef(new Animated.Value(1)).current;
  const secondaryScale = useRef(new Animated.Value(1)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
      },
    }
  );

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [currentIndex]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem('reachlo_onboarded', 'true');
    navigation.navigate('Landing');
  }, [navigation]);

  const handleGetStarted = useCallback(async () => {
    await AsyncStorage.setItem('reachlo_onboarded', 'true');
    navigation.navigate('Register', { defaultRole: 'BUYER' });
  }, [navigation]);

  const handleLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  const pressIn = (anim) =>
    Animated.spring(anim, { toValue: 0.95, useNativeDriver: true, tension: 100, friction: 6 }).start();
  const pressOut = (anim) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }).start();

  const isLast = currentIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[currentIndex];

  // Animated bg color interpolation
  const bgOpacity1 = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });
  const bgOpacity2 = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  const bgOpacity3 = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      {/* ── Animated gradient backgrounds (cross-fade) ── */}
      {SLIDES.map((slide, i) => {
        const opacityAnim = [bgOpacity1, bgOpacity2, bgOpacity3][i];
        return (
          <Animated.View
            key={slide.id}
            style={[StyleSheet.absoluteFillObject, { opacity: opacityAnim }]}
          >
            <LinearGradient
              colors={slide.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.6, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        );
      })}

      <SafeAreaView style={styles.safe}>

        {/* ── Header: Skip ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          {!isLast && (
            <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={12}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>

        {/* ── Illustrations row (parallax FlatList) ── */}
        <View style={styles.illustrationsRow}>
          {SLIDES.map((item, index) => (
            <SlideIllustration
              key={item.id}
              item={item}
              index={index}
              scrollX={scrollX}
              styles={styles}
            />
          ))}
        </View>

        {/* ── Scrollable text slides ── */}
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.textList}
          renderItem={({ item, index }) => (
            <View style={styles.slide}>
              <SlideText item={item} index={index} scrollX={scrollX} styles={styles} />
            </View>
          )}
        />

        {/* ── Footer ── */}
        <View style={styles.footer}>

          {/* Page dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <AnimatedDot
                key={i}
                active={i === currentIndex}
                color={activeSlide.accentColor}
              />
            ))}
          </View>

          {/* Primary CTA */}
          {isLast ? (
            <>
              {/* Get Started */}
              <Animated.View style={[styles.btnWrap, { transform: [{ scale: btnScale }] }]}>
                <Pressable
                  onPress={handleGetStarted}
                  onPressIn={() => pressIn(btnScale)}
                  onPressOut={() => pressOut(btnScale)}
                  accessibilityRole="button"
                  accessibilityLabel="Get Started"
                >
                  <LinearGradient
                    colors={[colors.PRIMARY, colors.SECONDARY]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>Get Started</Text>
                    <Text style={styles.primaryBtnArrow}>→</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              {/* Login */}
              <Animated.View style={[styles.secondaryWrap, { transform: [{ scale: secondaryScale }] }]}>
                <Pressable
                  onPress={handleLogin}
                  onPressIn={() => pressIn(secondaryScale)}
                  onPressOut={() => pressOut(secondaryScale)}
                  style={styles.secondaryBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Already have an account, Login"
                >
                  <Text style={styles.secondaryBtnText}>
                    Already have an account?{' '}
                    <Text style={[styles.secondaryBtnBold, { color: activeSlide.accentColor }]}>
                      Log In
                    </Text>
                  </Text>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            /* Next button */
            <Animated.View style={[styles.btnWrap, { transform: [{ scale: btnScale }] }]}>
              <Pressable
                onPress={handleNext}
                onPressIn={() => pressIn(btnScale)}
                onPressOut={() => pressOut(btnScale)}
                accessibilityRole="button"
                accessibilityLabel="Next slide"
              >
                <LinearGradient
                  colors={[activeSlide.accentColor, activeSlide.accentColor + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Next</Text>
                  <Text style={styles.primaryBtnArrow}>→</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Bottom spacing for gesture nav */}
          <View style={{ height: 8 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const ILLUS_SIZE = Math.min(width * 0.72, 300);

const getStyles = (colors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F0FF',
  },
  safe: {
    flex: 1,
  },

  // ── Header ──
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerLeft: { width: 50 },
  skipBtn: { padding: 8 },
  skipText: {
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    color: colors.TEXT_SECONDARY,
  },

  // ── Illustrations ──
  illustrationsRow: {
    height: ILLUS_SIZE + 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Absolute stacked — each positioned centered
    position: 'relative',
  },
  illustrationWrapper: {
    position: 'absolute',
    width: ILLUS_SIZE,
    height: ILLUS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBg: {
    position: 'absolute',
    width: ILLUS_SIZE * 0.88,
    height: ILLUS_SIZE * 0.88,
    borderRadius: ILLUS_SIZE * 0.44,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ringOuter: {
    width: ILLUS_SIZE,
    height: ILLUS_SIZE,
  },
  ringInner: {
    width: ILLUS_SIZE * 0.78,
    height: ILLUS_SIZE * 0.78,
  },
  illustration: {
    width: ILLUS_SIZE * 0.82,
    height: ILLUS_SIZE * 0.82,
    zIndex: 2,
  },

  // ── Text slides ──
  textList: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  textBlock: {
    alignItems: 'flex-start',
  },

  // Category tag
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 7,
  },
  tagText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Heading
  heading: {
    fontSize: 38,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: colors.TEXT_PRIMARY,
    letterSpacing: -0.8,
    lineHeight: 46,
    marginBottom: 18,
  },

  // Description
  description: {
    fontSize: FONT_SIZES.MD,
    fontWeight: FONT_WEIGHTS.REGULAR,
    color: colors.TEXT_SECONDARY,
    lineHeight: 28,
    letterSpacing: 0.1,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    alignItems: 'center',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  // Primary button
  btnWrap: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: colors.PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    gap: 10,
  },
  primaryBtnText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  primaryBtnArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: FONT_WEIGHTS.BOLD,
  },

  // Secondary / Login
  secondaryWrap: {
    marginBottom: 4,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    fontSize: FONT_SIZES.SM,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  secondaryBtnBold: {
    fontWeight: FONT_WEIGHTS.BOLD,
  },
});
