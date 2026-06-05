import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@features/auth/store/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '@app/theme/theme';

export const LoginScreen: React.FC = () => {
  const navigation  = useNavigation<any>();
  const login       = useAuthStore((s) => s.login);
  const isLoading   = useAuthStore((s) => s.isLoading);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  
  // Input focus states for active border rendering (Lime accent)
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo / Hero */}
        <View style={styles.hero}>
          <Text style={styles.logo}>🥘</Text>
          <Text style={styles.appName}>Food Saver</Text>
          <Text style={styles.tagline}>Smart Kitchen. Zero Waste.</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

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

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.textInverse} />
              : <Text style={styles.primaryBtnText}>Sign In →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>
              No account? <Text style={styles.secondaryBtnLink}>Register here</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow:        1,
    justifyContent:  'center',
    padding:         Spacing.xl,
  },
  hero: {
    alignItems:    'center',
    marginBottom:  Spacing.xxxl,
  },
  logo: {
    fontSize:     72,
    marginBottom: Spacing.md,
  },
  appName: {
    color:        Colors.textPrimary,
    fontSize:     Typography.fontSizeTitle, // 28sp
    fontWeight:   Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
  },
  tagline: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeMd,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.card, // 20px
    padding:         Spacing.xl,
  },
  cardTitle: {
    color:        Colors.textPrimary,
    fontSize:     Typography.fontSizeXl,
    fontWeight:   Typography.fontWeightBold,
    marginBottom: Spacing.xl,
    letterSpacing: Typography.letterSpacingTight,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
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
  secondaryBtn: {
    marginTop:   Spacing.lg,
    alignItems:  'center',
  },
  secondaryBtnText: {
    color:    Colors.textSecondary,
    fontSize: Typography.fontSizeMd,
  },
  secondaryBtnLink: {
    color:      Colors.accent,
    fontWeight: Typography.fontWeightSemibold,
  },
});
