/**
 * Typography — Inter / SF Pro Display
 * Loaded via expo-font. Falls back gracefully to system font.
 */

export const FONTS = {
  REGULAR: 'Inter-Regular',
  MEDIUM: 'Inter-Medium',
  SEMIBOLD: 'Inter-SemiBold',
  BOLD: 'Inter-Bold',
  EXTRABOLD: 'Inter-ExtraBold',
};

/** Font size scale — mobile-optimised */
export const FONT_SIZES = {
  XXS: 10,
  XS: 12,
  SM: 13,
  BASE: 15,
  MD: 17,
  LG: 20,
  XL: 24,
  XXL: 30,
  XXXL: 36,
  HERO: 44,
};

/** Font weights as string literals (RN requirement) */
export const FONT_WEIGHTS = {
  REGULAR: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700',
  EXTRABOLD: '800',
};

/** Line heights as multipliers */
export const LINE_HEIGHTS = {
  NONE: 1,
  TIGHT: 1.15,
  SNUG: 1.25,
  NORMAL: 1.4,
  RELAXED: 1.6,
  LOOSE: 1.8,
};

/** Letter spacing (em) */
export const LETTER_SPACING = {
  TIGHT: -0.5,
  NORMAL: 0,
  WIDE: 0.5,
  WIDER: 1,
  WIDEST: 2,
};

/**
 * Semantic text styles — compose these inside StyleSheet.create()
 * e.g. { ...TEXT_STYLES.HEADING_1 }
 */
export const TEXT_STYLES = {
  HERO: {
    fontSize: FONT_SIZES.HERO,
    fontWeight: FONT_WEIGHTS.EXTRABOLD,
    fontFamily: FONTS.EXTRABOLD,
    letterSpacing: LETTER_SPACING.TIGHT,
  },
  HEADING_1: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: FONT_WEIGHTS.BOLD,
    fontFamily: FONTS.BOLD,
    letterSpacing: LETTER_SPACING.TIGHT,
  },
  HEADING_2: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: FONT_WEIGHTS.BOLD,
    fontFamily: FONTS.BOLD,
    letterSpacing: -0.3,
  },
  HEADING_3: {
    fontSize: FONT_SIZES.XL,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    fontFamily: FONTS.SEMIBOLD,
    letterSpacing: -0.2,
  },
  TITLE: {
    fontSize: FONT_SIZES.LG,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    fontFamily: FONTS.SEMIBOLD,
    letterSpacing: 0,
  },
  SUBTITLE: {
    fontSize: FONT_SIZES.MD,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    fontFamily: FONTS.MEDIUM,
    letterSpacing: 0,
  },
  BODY_LARGE: {
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.REGULAR,
    fontFamily: FONTS.REGULAR,
    lineHeight: FONT_SIZES.BASE * LINE_HEIGHTS.RELAXED,
    letterSpacing: LETTER_SPACING.NORMAL,
  },
  BODY: {
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.REGULAR,
    fontFamily: FONTS.REGULAR,
    lineHeight: FONT_SIZES.SM * LINE_HEIGHTS.RELAXED,
    letterSpacing: LETTER_SPACING.NORMAL,
  },
  CAPTION: {
    fontSize: FONT_SIZES.XS,
    fontWeight: FONT_WEIGHTS.REGULAR,
    fontFamily: FONTS.REGULAR,
    letterSpacing: LETTER_SPACING.NORMAL,
  },
  LABEL: {
    fontSize: FONT_SIZES.XS,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    fontFamily: FONTS.SEMIBOLD,
    letterSpacing: LETTER_SPACING.WIDER,
    textTransform: 'uppercase',
  },
  BUTTON_LG: {
    fontSize: FONT_SIZES.MD,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    fontFamily: FONTS.SEMIBOLD,
    letterSpacing: 0.4,
  },
  BUTTON_MD: {
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    fontFamily: FONTS.SEMIBOLD,
    letterSpacing: 0.3,
  },
  BUTTON_SM: {
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    fontFamily: FONTS.SEMIBOLD,
    letterSpacing: 0.2,
  },
};

export default {
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  LETTER_SPACING,
  TEXT_STYLES,
};
