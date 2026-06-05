import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@features/auth/store/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '@app/theme/theme';

const PERSONA_OPTIONS = [
  { key: 'minimalist',   label: '🎒 Minimalist',   desc: 'Simple and quick' },
  { key: 'professional', label: '💼 Professional',  desc: 'Clear and structured' },
  { key: 'chef',         label: '🧑‍🍳 Chef',          desc: 'Fun and creative' },
] as const;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const register   = useAuthStore((s) => s.register);
  const isLoading  = useAuthStore((s) => s.isLoading);

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [persona,  setPersona]  = useState<'minimalist' | 'professional' | 'chef'>('minimalist');

  // Input focus states for active border rendering (Lime accent)
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Food Saver and start saving food.</Text>
        </View>

        <View style={styles.card}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={[styles.input, nameFocused && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              placeholderTextColor={Colors.textMuted}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={[styles.input, passwordFocused && styles.inputFocused]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <TextInput
              style={[styles.input, confirmFocused && styles.inputFocused]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
            />
          </View>

          {/* Persona Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>YOUR PERSONA</Text>
            <Text style={styles.personaHint}>
              This shapes how Food Saver sends you notifications.
            </Text>
            <View style={styles.personaOptions}>
              {PERSONA_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.personaOption, persona === p.key && styles.personaOptionSelected]}
                  onPress={() => setPersona(p.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.personaLabel}>{p.label}</Text>
                  <Text style={styles.personaDesc}>{p.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.textInverse} />
              : <Text style={styles.primaryBtnText}>Create Account →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkAccent}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { flexGrow: 1, padding: Spacing.xl },
  header:    { marginBottom: Spacing.xl, marginTop: Spacing.xl },
  title: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeTitle, // 28sp
    fontWeight: Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
  },
  subtitle: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeBody,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.card, // 20px
    padding:         Spacing.xl,
  },
  inputGroup:  { marginBottom: Spacing.md },
  inputLabel: {
    color:        Colors.textSecondary,
    fontSize:     Typography.fontSizeXs,
    fontWeight:   Typography.fontWeightMedium,
    letterSpacing: 1.0,
    marginBottom:  Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.input, // 14px
    color:           Colors.textPrimary,
    fontSize:        Typography.fontSizeMd,
    padding:         Spacing.md,
  },
  inputFocused: {
    borderColor: Colors.accent, // lime focus border
  },
  personaHint: {
    color:        Colors.textSecondary,
    fontSize:     Typography.fontSizeSm,
    marginBottom: Spacing.sm,
  },
  personaOptions: { gap: Spacing.sm },
  personaOption: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.input, // 14px
    padding:         Spacing.md,
  },
  personaOptionSelected: {
    borderColor:     Colors.accent,
    backgroundColor: Colors.urgencyGreenBg, // Lime bg at 10% opacity
  },
  personaLabel: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeMd,
    fontWeight: Typography.fontWeightSemibold,
  },
  personaDesc: {
    color:    Colors.textSecondary,
    fontSize: Typography.fontSizeSm,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius:    BorderRadius.button, // 14px
    height:          52,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       Spacing.lg,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color:      Colors.textInverse,
    fontSize:   Typography.fontSizeButton, // 15sp
    fontWeight: Typography.fontWeightSemibold,
  },
  loginLink:     { marginTop: Spacing.lg, alignItems: 'center' },
  loginLinkText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMd },
  loginLinkAccent: {
    color:      Colors.accent,
    fontWeight: Typography.fontWeightSemibold,
  },
});
