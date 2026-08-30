import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';

export default function RoleSelector({ selectedRole, onSelect }) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const sellerScale = useRef(new Animated.Value(1)).current;
  const buyerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(sellerScale, {
      toValue: selectedRole === 'SELLER' ? 1.03 : 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();

    Animated.spring(buyerScale, {
      toValue: selectedRole === 'BUYER' ? 1.03 : 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [selectedRole]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: sellerScale }] }]}>
        <Pressable
          onPress={() => onSelect('SELLER')}
          style={[
            styles.card,
            selectedRole === 'SELLER' ? styles.sellerSelected : styles.unselected,
          ]}
          accessibilityRole="radio"
          accessibilityState={{ checked: selectedRole === 'SELLER' }}
          accessibilityLabel="Business Owner Role"
        >
          <Text style={[styles.emoji, selectedRole === 'SELLER' && styles.sellerText]}>🏢</Text>
          <Text style={[
            styles.label,
            selectedRole === 'SELLER' ? styles.sellerText : styles.unselectedText
          ]}>
            Business Owner
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: buyerScale }] }]}>
        <Pressable
          onPress={() => onSelect('BUYER')}
          style={[
            styles.card,
            selectedRole === 'BUYER' ? styles.buyerSelected : styles.unselected,
          ]}
          accessibilityRole="radio"
          accessibilityState={{ checked: selectedRole === 'BUYER' }}
          accessibilityLabel="Buyer Role"
        >
          <Text style={[styles.emoji, selectedRole === 'BUYER' && styles.buyerText]}>👤</Text>
          <Text style={[
            styles.label,
            selectedRole === 'BUYER' ? styles.buyerText : styles.unselectedText
          ]}>
            I'm a Buyer
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginHorizontal: 6, // creates visual gap between flex: 1 items
  },
  unselected: {
    borderColor: colors.BORDER,
    backgroundColor: colors.SURFACE,
  },
  sellerSelected: {
    borderColor: colors.SELLER_ACCENT,
    backgroundColor: '#FFF5F0',
  },
  buyerSelected: {
    borderColor: colors.BUYER_ACCENT,
    backgroundColor: colors.BUYER_SURFACE,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  label: {
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
  },
  sellerText: {
    color: colors.SELLER_ACCENT,
  },
  buyerText: {
    color: colors.BUYER_ACCENT,
  },
  unselectedText: {
    color: colors.TEXT_SECONDARY,
  },
});
