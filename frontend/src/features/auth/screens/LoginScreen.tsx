import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore }  from '@features/auth/store/authStore';

// ─── Fridgy Design Tokens (inline — decoupled from legacy cream theme) ───────
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

// ─── Fridgy logo asset ───────────────────────────────────────────────────────
const LOGO = require('../../../../assets/logo.png');

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const LoginScreen: React.FC = () => {
  // ── Auth state (DO NOT TOUCH — logic unchanged) ──────────────────────────
  const navigation = useNavigation<any>();
  const login      = useAuthStore((s) => s.login);
  const isLoading  = useAuthStore((s) => s.isLoading);

  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [emailFocused,    setEmailFocused]    = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ── Login handler (DO NOT TOUCH — logic unchanged) ───────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
      // Navigation handled by AppNavigator based on auth state
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
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

        {/* ── Brand Area ─────────────────────────────────────────────── */}
        <View style={styles.brandArea}>
          <Image
            source={LOGO}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="Fridgy logo"
          />
        </View>

        {/* ── Form Card ──────────────────────────────────────────────── */}
        <View style={styles.card}>

          {/* Card Header */}
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>
            Manage your kitchen smarter with Fridgy.
          </Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[
                styles.input,
                emailFocused && styles.inputFocused,
              ]}
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

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[
                styles.input,
                passwordFocused && styles.inputFocused,
              ]}
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

          {/* Primary Button — Sign In */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              isLoading && styles.primaryBtnDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.82}
          >
            {isLoading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Secondary — Navigate to Register (DO NOT change route name) */}
          <TouchableOpacity
            style={styles.secondaryRow}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryText}>
              Don't have an account?{' '}
              <Text style={styles.secondaryLink}>Create one</Text>
            </Text>
          </TouchableOpacity>

        </View>

        {/* Bottom breathe space */}
        <View style={{ height: 32 }} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: 24,
    paddingTop:        Platform.OS === 'ios' ? 56 : 40,
    paddingBottom:     24,
  },

  // ── Brand Area ────────────────────────────────────────────────────────────
  brandArea: {
    alignItems:   'center',
    marginBottom: 32,
  },
  logoImage: {
    width:  200,
    height: 80,
  },

  // ── Form Card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    28,
    padding:         24,
    // Soft premium shadow
    shadowColor:     '#1F2A24',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    16,
    elevation:       3,
  },
  cardTitle: {
    color:         C.textPrimary,
    fontSize:      24,
    fontWeight:    '700',
    letterSpacing: -0.3,
    marginBottom:  6,
  },
  cardSubtitle: {
    color:        C.textSecondary,
    fontSize:     14,
    fontWeight:   '400',
    lineHeight:   20,
    marginBottom: 24,
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
    backgroundColor: C.bgSoft,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    18,
    color:           C.textPrimary,
    fontSize:        15,
    fontWeight:      '400',
    height:          56,
    paddingHorizontal: 18,
  },
  inputFocused: {
    borderColor:     C.primary,
    backgroundColor: C.white,
  },

  // ── Primary Button ────────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius:    18,
    height:          56,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       8,
  },
  primaryBtnDisabled: {
    backgroundColor: C.disabled,
  },
  primaryBtnText: {
    color:      C.white,
    fontSize:   16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Secondary Link ────────────────────────────────────────────────────────
  secondaryRow: {
    marginTop:  20,
    alignItems: 'center',
  },
  secondaryText: {
    color:    C.textSecondary,
    fontSize: 14,
    fontWeight: '400',
  },
  secondaryLink: {
    color:      C.primary,
    fontWeight: '600',
  },
});
