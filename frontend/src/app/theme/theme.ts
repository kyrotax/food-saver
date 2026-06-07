/**
 * Fridgy — Design System
 * "Smart fridge, less waste."
 *
 * Brand direction: clean, smart, calm, fresh, practical, eco-conscious,
 * premium but friendly.
 *
 * Color Palette: Clean white base with fresh natural greens.
 * Typography: System fonts with balanced weights.
 * Spacing: 8-point grid system.
 */

export const Colors = {
  // ─── Base ────────────────────────────────────────────────────────────────
  background:          '#FFFFFF',   // Main scaffold — pure white
  backgroundSoft:      '#F8FAF8',   // Soft off-white — subtle page tint
  surface:             '#FFFFFF',   // Cards, modals, bottom sheets
  surfaceGreen:        '#EAF5EE',   // Soft green tint — tags, icon backgrounds
  surfaceAlt:          '#F8FAF8',   // Secondary surface (replaces old cream)

  // ─── Border ──────────────────────────────────────────────────────────────
  border:              '#E7EDE7',   // Subtle green-grey border
  borderBold:          '#D5E0D7',   // Slightly stronger border for emphasis

  // ─── Green Accent (Fridgy Primary) ───────────────────────────────────────
  accent:              '#3A9B68',   // Primary green — CTAs, active states
  accentDark:          '#2F8F5B',   // Darker green — pressed states
  accentDeep:          '#145A38',   // Deep forest green — headings, logo dark
  accentLight:         '#EAF5EE',   // Very light green — tag backgrounds
  accentMid:           '#6BB08A',   // Mid green — secondary icons

  // ─── Text ────────────────────────────────────────────────────────────────
  textPrimary:         '#1F2A24',   // Deep green-black — headlines, key content
  textSecondary:       '#6F7D73',   // Green-grey — labels, captions
  textMuted:           '#8A968E',   // Muted — placeholder, disabled hints
  textInverse:         '#FFFFFF',   // White — on-accent button text

  // ─── Semantic / Urgency ──────────────────────────────────────────────────
  urgencyGreen:        '#3A9B68',
  urgencyGreenBg:      '#EAF5EE',
  urgencyYellow:       '#F6B84B',
  urgencyYellowBg:     '#FEF7E6',
  urgencyRed:          '#E75D5D',
  urgencyRedBg:        '#FDEDED',

  // ─── Disabled ────────────────────────────────────────────────────────────
  disabledBackground:  '#E8F1EA',
  disabledText:        '#8AA091',

  // ─── Utility ─────────────────────────────────────────────────────────────
  white:               '#FFFFFF',
  black:               '#000000',
  overlay:             'rgba(31, 42, 36, 0.45)',
  transparent:         'transparent',

  // ─── Backward-compat aliases (for screens not yet migrated) ──────────────
  /** @deprecated use accent */
  accentGreen:         '#3A9B68',
  /** @deprecated use textMuted */
  textPlaceholder:     '#8A968E',
};

export const Typography = {
  // ─── Size scale ──────────────────────────────────────────────────────────
  fontSizeXs:       10,
  fontSizeCaption:  12,   // caption, meta
  fontSizeSm:       13,   // input label, small tags
  fontSizeBody:     15,   // body copy
  fontSizeMd:       15,   // alias for body
  fontSizeButton:   16,   // button text
  fontSizeLg:       16,   // secondary heading
  fontSizeHeader:   20,   // card title, modal title
  fontSizeXl:       22,   // section title
  fontSize2xl:      24,   // screen sub-title
  fontSizeTitle:    30,   // screen title
  fontSizeAuth:     34,   // auth / display title
  fontSizeMetric:   32,
  fontSize3xl:      30,
  fontSize4xl:      36,

  // ─── Weight ──────────────────────────────────────────────────────────────
  fontWeightLight:       '300' as const,
  fontWeightRegular:     '400' as const,
  fontWeightMedium:      '500' as const,
  fontWeightSemibold:    '600' as const,
  fontWeightBold:        '700' as const,
  fontWeightExtraBold:   '800' as const,
  fontWeightBlack:       '900' as const,

  // ─── Line height ─────────────────────────────────────────────────────────
  lineHeightTight:   1.2,
  lineHeightNormal:  1.5,
  lineHeightRelaxed: 1.8,

  // ─── Letter spacing ──────────────────────────────────────────────────────
  letterSpacingTight:  -0.3,
  letterSpacingNormal:  0,
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,

  // ─── Semantic spacing aliases ─────────────────────────────────────────────
  screenHorizontal: 24,
  sectionGap:       30,
  cardPaddingLarge: 24,
  cardPaddingMedium:20,
  elementGap:       14,
};

export const Sizes = {
  buttonHeight:  56,
  inputHeight:   56,
  chipHeight:    44,
  iconContainer: 48,
};

export const BorderRadius = {
  none:        0,
  sm:          6,
  md:          10,
  lg:          14,
  input:       18,   // was 14 — premium rounded inputs
  button:      18,   // was 14 — premium rounded button
  card:        28,   // was 20 — large card radius
  cardMedium:  22,   // medium card / modal sheet
  iconContainer: 16,
  xl:          20,
  full:        9999,
};

export const Shadows = {
  card: {
    shadowColor:   '#1F2A24',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius:  12,
    elevation:     2,
  },
  soft: {
    shadowColor:   '#1F2A24',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius:  6,
    elevation:     1,
  },
  // kept for backwards compat
  brutalist: {
    shadowColor:   'transparent',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },
};

/**
 * Returns urgency-specific color tokens for a FoodItem card or status badge.
 * No logic changes — only color values updated to Fridgy palette.
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
