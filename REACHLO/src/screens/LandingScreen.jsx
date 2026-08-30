import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZES, FONT_WEIGHTS, LINE_HEIGHTS } from '../constants/typography';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const { colors } = useTheme();

  const navigateToRegister = () => {
    navigation.navigate('Register', { defaultRole: 'BUYER' });
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Background soft blobs for a modern look */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={[`${colors.PRIMARY}20`, 'transparent']}
          style={styles.blob1}
        />
        <LinearGradient
          colors={[`${colors.ACCENT_CYAN}15`, 'transparent']}
          style={styles.blob2}
        />
      </View>

      <View style={styles.content}>
        <Animated.View 
          entering={FadeInDown.duration(800).delay(200)}
          style={styles.illustrationContainer}
        >
          {/* Replace with actual image asset from reference. 
              Using a styled placeholder for now to match structure. */}
          <View style={[styles.illustrationPlaceholder, { backgroundColor: colors.SURFACE }]}>
            <Text style={{fontSize: 60}}>🤝</Text>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.duration(800).delay(400)}
          style={styles.textContainer}
        >
          <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
            Grow Together
          </Text>
          <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
            Find campaigns.{'\n'}
            Earn money.{'\n'}
            Promote local businesses.
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.duration(800).delay(600)}
          style={styles.actionsContainer}
        >
          <Pressable
            onPress={navigateToRegister}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.8 }
            ]}
          >
            <LinearGradient
              colors={[colors.PRIMARY, colors.SECONDARY]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={navigateToLogin}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: colors.BORDER },
              pressed && { backgroundColor: colors.SURFACE }
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.TEXT_PRIMARY }]}>
              Login
            </Text>
          </Pressable>
        </Animated.View>
        
        {/* Pagination Dots indicator */}
        <Animated.View entering={FadeIn.duration(800).delay(800)} style={styles.pagination}>
            <View style={[styles.dot, { backgroundColor: colors.PRIMARY, width: 24 }]} />
            <View style={[styles.dot, { backgroundColor: colors.BORDER }]} />
            <View style={[styles.dot, { backgroundColor: colors.BORDER }]} />
            <View style={[styles.dot, { backgroundColor: colors.BORDER }]} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width / 2,
    top: -width * 0.2,
    left: -width * 0.3,
  },
  blob2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    bottom: -width * 0.4,
    right: -width * 0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxHeight: height * 0.4,
  },
  illustrationPlaceholder: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  }
});
