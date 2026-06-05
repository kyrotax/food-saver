import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecipeStore } from '@features/recipe/store/recipeStore';
import { Colors, Typography, Spacing, BorderRadius } from '@app/theme/theme';

/**
 * RecipeScreen — AI-powered Indonesian recipe generator
 * Triggers Gemini API via Laravel backend (FR-16, FR-17)
 */
export const RecipeScreen: React.FC = () => {
  const navigation    = useNavigation<any>();
  const { recipe, usedItems, isGenerating, error, generate, clearRecipe } = useRecipeStore();

  useEffect(() => {
    // Auto-generate on screen mount
    generate().catch(() => {});
    return () => clearRecipe();
  }, []);

  const handleRegenerate = async () => {
    clearRecipe();
    try {
      await generate();
    } catch (err: any) {
      Alert.alert('Recipe Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🍳 AI Recipe</Text>
          <Text style={styles.subtitle}>From your urgent ingredients</Text>
        </View>
        <TouchableOpacity onPress={handleRegenerate} style={styles.regenBtn} disabled={isGenerating}>
          <Text style={styles.regenBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isGenerating && (
          <View style={styles.generating}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.generatingText}>
              🤖 Gemini AI is crafting your recipe...
            </Text>
            <Text style={styles.generatingSubtext}>
              Analyzing your urgent ingredients and adapting measurements.
            </Text>
          </View>
        )}

        {error && !isGenerating && (
          <View style={styles.errorCard}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorTitle}>No Recipe Available</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRegenerate}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {recipe && !isGenerating && (
          <>
            {/* Ingredients used */}
            {usedItems.length > 0 && (
              <View style={styles.ingredientBadges}>
                <Text style={styles.sectionLabel}>INGREDIENTS USED</Text>
                <View style={styles.badgeRow}>
                  {usedItems.map((item, i) => (
                    <View key={i} style={styles.badge}>
                      <Text style={styles.badgeText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recipe Content */}
            <View style={styles.recipeCard}>
              <Text style={styles.recipeText}>{recipe}</Text>
            </View>

            <TouchableOpacity style={styles.regenFullBtn} onPress={handleRegenerate}>
              <Text style={styles.regenFullBtnText}>🔄 Generate Different Recipe</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         Spacing.xl,
    paddingTop:      Spacing.xxxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'transparent',
    gap:             Spacing.md,
  },
  backBtn:     { padding: Spacing.xs },
  backBtnText: { color: Colors.accent, fontSize: Typography.fontSizeMd, fontWeight: Typography.fontWeightSemibold },
  title: {
    flex:       1,
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeHeader,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: Typography.letterSpacingTight,
  },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.fontSizeSm },
  regenBtn: {
    padding:         Spacing.sm,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.button, // 14px
    backgroundColor: Colors.transparent,
  },
  regenBtnText: { fontSize: Typography.fontSizeLg },
  scroll:       { padding: Spacing.xl, flexGrow: 1 },
  generating: {
    alignItems:    'center',
    paddingTop:    Spacing.xxxl,
    gap:           Spacing.lg,
  },
  generatingText: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeLg,
    fontWeight: Typography.fontWeightSemibold,
    textAlign:  'center',
  },
  generatingSubtext: {
    color:     Colors.textSecondary,
    fontSize:  Typography.fontSizeMd,
    textAlign: 'center',
  },
  errorCard: {
    alignItems:     'center',
    paddingTop:     Spacing.xxxl,
    gap:            Spacing.md,
  },
  errorEmoji: { fontSize: 64 },
  errorTitle: { color: Colors.textPrimary, fontSize: Typography.fontSizeXl, fontWeight: Typography.fontWeightBold },
  errorText:  { color: Colors.textSecondary, fontSize: Typography.fontSizeMd, textAlign: 'center' },
  retryBtn: {
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.button, // 14px
    paddingVertical:   Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.transparent,
    marginTop:       Spacing.sm,
  },
  retryBtnText: { color: Colors.textPrimary, fontSize: Typography.fontSizeMd, fontWeight: Typography.fontWeightSemibold },
  ingredientBadges: { marginBottom: Spacing.lg },
  sectionLabel: {
    color:        Colors.textSecondary,
    fontSize:     Typography.fontSizeXs,
    fontWeight:   Typography.fontWeightMedium,
    letterSpacing: 1.0,
    marginBottom:  Spacing.sm,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badge: {
    backgroundColor: Colors.urgencyYellowBg,
    borderWidth:     1,
    borderColor:     Colors.urgencyYellow,
    borderRadius:    BorderRadius.full,
    paddingVertical:   Spacing.xs - 2,
    paddingHorizontal: Spacing.sm,
  },
  badgeText: { color: Colors.urgencyYellow, fontSize: Typography.fontSizeCaption, fontWeight: Typography.fontWeightSemibold },
  recipeCard: {
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.card, // 20px
    padding:         Spacing.xl,
    marginBottom:    Spacing.xl,
  },
  recipeText: {
    color:      Colors.textPrimary,
    fontSize:   Typography.fontSizeMd,
    lineHeight: Typography.fontSizeMd * Typography.lineHeightRelaxed,
  },
  regenFullBtn: {
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.button, // 14px
    height:          52,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.transparent,
    marginBottom:    Spacing.xxl,
  },
  regenFullBtnText: { color: Colors.textPrimary, fontSize: Typography.fontSizeButton, fontWeight: Typography.fontWeightSemibold },
});
