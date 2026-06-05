/**
 * Food Saver — Design System
 * Warm Kitchen Companion Design Language
 *
 * Color Palette: Warm cream base, natural greens, soft whites — food-oriented and inviting.
 * Typography: System fonts with balanced weights.
 * Spacing: 8-point grid system.
 */

export const Colors = {
  // Base — warm cream kitchen palette
  background:          '#FFF8EA',   // Warm cream — main scaffold background
  surface:             '#FFFFFF',   // Pure white — cards, modals, bottom sheets
  surfaceAlt:          '#FFF3D6',   // Warm tinted card — secondary / elevated surfaces
  border:              '#E8DCC8',   // Soft warm tan border — subtle dividers
  borderBold:          '#D4C4A8',   // Slightly stronger border for cards

  // Accent — natural green (replaces neon lime)
  accent:              '#3E8E5E',   // Natural forest green — CTAs, active states
  accentLight:         '#EAF4EE',   // Very light green tint — tag backgrounds
  accentMid:           '#6BB08A',   // Mid green — secondary actions, icons

  // Text
  textPrimary:         '#2D2416',   // Warm near-black — headlines, key content
  textSecondary:       '#7A6A52',   // Warm brown-grey — labels, captions
  textMuted:           '#B8A990',   // Light warm tan — placeholder, disabled
  textInverse:         '#FFFFFF',   // White — on-accent button text

  // Traffic Light Urgency Colors (warmer, less neon)
  urgencyGreen:        '#3E8E5E',   // Natural green
  urgencyGreenBg:      '#EAF4EE',   // Soft green tint
  urgencyYellow:       '#D4860A',   // Warm amber
  urgencyYellowBg:     '#FEF3E0',   // Soft amber tint
  urgencyRed:          '#C0392B',   // Muted red
  urgencyRedBg:        '#FDECEA',   // Soft red tint

  // Utility
  white:               '#FFFFFF',
  black:               '#000000',
  overlay:             'rgba(45, 36, 22, 0.5)',
  transparent:         'transparent',
};

export const Typography = {
  fontSizeXs:   10,
  fontSizeCaption: 11,
  fontSizeSm:   12,
  fontSizeBody: 14,
  fontSizeMd:   14,
  fontSizeButton: 15,
  fontSizeLg:   16,
  fontSizeHeader: 18,
  fontSizeXl:   20,
  fontSize2xl:  24,
  fontSizeTitle: 28,
  fontSizeMetric: 32,
  fontSize3xl:  30,
  fontSize4xl:  36,

  fontWeightLight:    '300' as const,
  fontWeightRegular:  '400' as const,
  fontWeightMedium:   '500' as const,
  fontWeightSemibold: '600' as const,
  fontWeightBold:     '700' as const,
  fontWeightExtraBold: '800' as const,
  fontWeightBlack:    '900' as const,

  lineHeightTight:  1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.8,

  letterSpacingTight: -0.3,
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  xxxl:48,
};

export const BorderRadius = {
  none:   0,
  sm:     4,
  md:     8,
  lg:     12,
  input:  14,
  button: 14,
  xl:     16,
  card:   20,
  full:   9999,
};

export const Shadows = {
  card: {
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  soft: {
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // kept for backwards compat
  brutalist: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

/**
 * Returns urgency-specific color tokens for a FoodItem card or status badge.
 */
export function getUrgencyTheme(urgencyStatus: 'green' | 'yellow' | 'red') {
  switch (urgencyStatus) {
    case 'red':
      return {
        background: Colors.urgencyRedBg,
        border:     Colors.urgencyRed,
        text:       Colors.urgencyRed,
        label:      'Use today',
      };
    case 'yellow':
      return {
        background: Colors.urgencyYellowBg,
        border:     Colors.urgencyYellow,
        text:       Colors.urgencyYellow,
        label:      'Use soon',
      };
    default:
      return {
        background: Colors.urgencyGreenBg,
        border:     Colors.urgencyGreen,
        text:       Colors.urgencyGreen,
        label:      'Still fresh',
      };
  }
}
