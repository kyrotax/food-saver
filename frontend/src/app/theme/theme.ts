/**
 * Food Saver — Design System
 * Cal AI-Inspired Premium Dark Mobile Design Language
 *
 * Color Palette: Dark-first, minimal, premium, data-centric and high-contrast.
 * Typography: System fonts with bold weights and tight letter spacing.
 * Spacing: 8-point grid system.
 */

export const Colors = {
  // Base / Cal AI Theme
  background:          '#0A0A0A',   // Main scaffold/screen background (background_primary)
  surface:             '#141414',   // Cards, bottom sheets, modals (background_surface)
  surfaceAlt:          '#1E1E1E',   // Input fields, secondary cards (background_elevated)
  border:              '#2A2A2A',   // Card borders, dividers (border_subtle)
  borderBold:          '#2A2A2A',   // For card outline borders
  accent:              '#A8FF3E',   // CTAs, active states, key highlights (lime)
  accentDark:          '#3EFF9E',   // Secondary actions, success states (mint)

  // Text
  textPrimary:         '#FFFFFF',   // Headlines, key metrics
  textSecondary:       '#8A8A8A',   // Labels, captions, helper text
  textMuted:           '#3D3D3D',   // Placeholder, inactive items (text_disabled)
  textInverse:         '#0A0A0A',   // Button text (dark)

  // Traffic Light Urgency Accent Colors
  urgencyGreen:        '#A8FF3E',   // lime
  urgencyGreenBg:      '#A8FF3E1A', // 10% opacity pill background
  urgencyYellow:       '#FFB830',   // warm amber
  urgencyYellowBg:     '#FFB8301A', // 10% opacity pill background
  urgencyRed:          '#FF4757',   // vibrant red
  urgencyRedBg:        '#FF47571A', // 10% opacity pill background

  // Utility
  white:               '#FFFFFF',
  black:               '#000000',
  overlay:             'rgba(0,0,0,0.85)',
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
  
  letterSpacingTight: -0.5, // tight, like Cal AI's bold headers
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
  input:  14,   // Button / Input Fields border radius
  button: 14,
  xl:     16,
  card:   20,   // Card Component border radius
  full:   9999,
};

export const Shadows = {
  brutalist: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
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
        label:      '🔴 Urgent',
      };
    case 'yellow':
      return {
        background: Colors.urgencyYellowBg,
        border:     Colors.urgencyYellow,
        text:       Colors.urgencyYellow,
        label:      '🟡 Warning',
      };
    default:
      return {
        background: Colors.urgencyGreenBg,
        border:     Colors.urgencyGreen,
        text:       Colors.urgencyGreen,
        label:      '🟢 Safe',
      };
  }
}

