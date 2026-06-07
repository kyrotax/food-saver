import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@features/auth/store/authStore';

// ─── Fridgy Design Tokens (inline — isolated from legacy theme) ───────────────
const C = {
  bg:            '#FFFFFF',
  bgSoft:        '#F8FAF8',
  surfaceGreen:  '#EAF5EE',
  primary:       '#3A9B68',
  primaryDark:   '#2F8F5B',
  textPrimary:   '#1F2A24',
  textSecondary: '#6F7D73',
  textMuted:     '#8A968E',
  border:        '#E7EDE7',
  error:         '#E75D5D',
  disabled:      '#E8F1EA',
  disabledText:  '#8AA091',
  white:         '#FFFFFF',
};

// ─── Fridgy logo ──────────────────────────────────────────────────────────────
const LOGO = require('../../../../assets/logo.png');

// ─── Persona options
// UI labels and icons are remapped for Fridgy context.
// Internal `key` values match authStore type: 'minimalist' | 'professional' | 'chef'
// DO NOT change the key values — they are sent to the API.
const PERSONA_OPTIONS = [
  {
    key:   'minimalist' as const,
    label: 'Minimalist',
    desc:  'Simple tracking and quick reminders',
    icon:  'check-square' as const,
  },
  {
    key:   'professional' as const,
    label: 'Planner',
    desc:  'Organised inventory and expiry control',
    icon:  'calendar' as const,
  },
  {
    key:   'chef' as const,
    label: 'Home Cook',
    desc:  'Recipe-first guidance for daily meals',
    icon:  'coffee' as const,   // closest to cooking in Feather icons
  },
] as const;

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const RegisterScreen: React.FC = () => {
  // ── Auth state — DO NOT TOUCH logic ──────────────────────────────────────
  const navigation = useNavigation<any>();
  const register   = useAuthStore((s) => s.register);
  const isLoading  = useAuthStore((s) => s.isLoading);

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [persona,  setPersona]  = useState<'minimalist' | 'professional' | 'chef'>('minimalist');

  const [nameFocused,     setNameFocused]     = useState(false);
  const [emailFocused,    setEmailFocused]    = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused,  setConfirmFocused]  = useState(false);

  // ── Register handler — DO NOT TOUCH ──────────────────────────────────────
  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Validation', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }
    try {
      await register({
        name,
        email:                email.trim(),
        password,
        password_confirmation: confirm,
        persona,
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Brand Area ───────────────────────────────────────────────── */}
        <View style={styles.brandArea}>
          <Image
            source={LOGO}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="Fridgy logo"
          />
        </View>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Start tracking ingredients and reducing food waste.
          </Text>
        </View>

        {/* ── Form Card ────────────────────────────────────────────────── */}
        <View style={styles.card}>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, nameFocused && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={C.textMuted}
              autoCapitalize="words"
              onFocus={() => setNameFocused(true)}
              onBlur={()  => setNameFocused(false)}
              editable={!isLoading}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={C.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setEmailFocused(true)}
              onBlur={()  => setEmailFocused(false)}
              editable={!isLoading}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[styles.input, passwordFocused && styles.inputFocused]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              onFocus={() => setPasswordFocused(true)}
              onBlur={()  => setPasswordFocused(false)}
              editable={!isLoading}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={[styles.input, confirmFocused && styles.inputFocused]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat your password"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              onFocus={() => setConfirmFocused(true)}
              onBlur={()  => setConfirmFocused(false)}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* ── Persona Section (outside form card for breathing room) ─── */}
        <View style={styles.personaSection}>
          <Text style={styles.personaSectionTitle}>Choose your kitchen style</Text>
          <Text style={styles.personaSectionDesc}>
            Fridgy personalises reminders and recipe suggestions for you.
          </Text>

          <View style={styles.personaList}>
            {PERSONA_OPTIONS.map((p) => {
              const selected = persona === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.personaCard, selected && styles.personaCardSelected]}
                  onPress={() => setPersona(p.key)}
                  activeOpacity={0.75}
                >
                  {/* Icon container */}
                  <View style={[
                    styles.personaIconBox,
                    selected && styles.personaIconBoxSelected,
                  ]}>
                    <Feather
                      name={p.icon}
                      size={20}
                      color={selected ? C.primary : C.textSecondary}
                    />
                  </View>

                  {/* Labels */}
                  <View style={styles.personaTextBlock}>
                    <Text style={[
                      styles.personaLabel,
                      selected && styles.personaLabelSelected,
                    ]}>
                      {p.label}
                    </Text>
                    <Text style={styles.personaDesc}>{p.desc}</Text>
                  </View>

                  {/* Selection indicator */}
                  {selected && (
                    <Feather name="check-circle" size={18} color={C.primary} style={styles.personaCheck} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── CTA Card ─────────────────────────────────────────────────── */}
        <View style={styles.ctaArea}>
          {/* Primary Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.82}
          >
            {isLoading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Secondary — Navigate back to Login (DO NOT change navigation.goBack) */}
          <TouchableOpacity
            style={styles.secondaryRow}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryText}>
              Already have an account?{' '}
              <Text style={styles.secondaryLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom breathe space */}
        <View style={{ height: 40 }} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow:          1,
    paddingHorizontal: 24,
    paddingTop:        Platform.OS === 'ios' ? 56 : 40,
    paddingBottom:     24,
  },

  // ── Brand ─────────────────────────────────────────────────────────────────
  brandArea: {
    alignItems:   'center',
    marginBottom: 20,
  },
  logoImage: {
    width:  160,
    height: 64,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    marginBottom: 20,
  },
  title: {
    color:         C.textPrimary,
    fontSize:      28,
    fontWeight:    '700',
    letterSpacing: -0.4,
    marginBottom:  6,
  },
  subtitle: {
    color:      C.textSecondary,
    fontSize:   15,
    fontWeight: '400',
    lineHeight: 22,
  },

  // ── Form Card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    28,
    padding:         24,
    marginBottom:    20,
    // Soft premium shadow
    shadowColor:     '#1F2A24',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    16,
    elevation:       3,
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color:        C.textSecondary,
    fontSize:     13,
    fontWeight:   '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor:  C.bgSoft,
    borderWidth:      1,
    borderColor:      C.border,
    borderRadius:     18,
    color:            C.textPrimary,
    fontSize:         15,
    fontWeight:       '400',
    height:           56,
    paddingHorizontal: 18,
  },
  inputFocused: {
    borderColor:     C.primary,
    backgroundColor: C.white,
  },

  // ── Persona Section ────────────────────────────────────────────────────────
  personaSection: {
    marginBottom: 20,
  },
  personaSectionTitle: {
    color:         C.textPrimary,
    fontSize:      18,
    fontWeight:    '600',
    letterSpacing: -0.2,
    marginBottom:  4,
  },
  personaSectionDesc: {
    color:        C.textSecondary,
    fontSize:     14,
    lineHeight:   20,
    marginBottom: 14,
  },
  personaList: {
    gap: 10,
  },

  // ── Persona Card ───────────────────────────────────────────────────────────
  personaCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.bgSoft,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    20,
    padding:         16,
    gap:             14,
  },
  personaCardSelected: {
    backgroundColor: C.surfaceGreen,
    borderColor:     C.primary,
  },
  personaIconBox: {
    width:           44,
    height:          44,
    borderRadius:    14,
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  personaIconBoxSelected: {
    backgroundColor: C.white,
    borderColor:     C.primary,
  },
  personaTextBlock: {
    flex: 1,
  },
  personaLabel: {
    color:        C.textPrimary,
    fontSize:     15,
    fontWeight:   '600',
    marginBottom: 2,
  },
  personaLabelSelected: {
    color: C.primary,
  },
  personaDesc: {
    color:      C.textSecondary,
    fontSize:   13,
    lineHeight: 18,
  },
  personaCheck: {
    flexShrink: 0,
  },

  // ── CTA Area ──────────────────────────────────────────────────────────────
  ctaArea: {
    gap: 0,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius:    18,
    height:          56,
    alignItems:      'center',
    justifyContent:  'center',
  },
  primaryBtnDisabled: {
    backgroundColor: C.disabled,
  },
  primaryBtnText: {
    color:         C.white,
    fontSize:      16,
    fontWeight:    '600',
    letterSpacing: 0.1,
  },
  secondaryRow: {
    marginTop:  20,
    alignItems: 'center',
  },
  secondaryText: {
    color:      C.textSecondary,
    fontSize:   14,
    fontWeight: '400',
  },
  secondaryLink: {
    color:      C.primary,
    fontWeight: '600',
  },
});
