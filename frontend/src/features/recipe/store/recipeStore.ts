import { create } from 'zustand';
import { apiClient } from '@core/api/apiClient';

interface RecipeState {
  recipe:       string | null;
  usedItems:    string[];
  isGenerating: boolean;
  error:        string | null;

  generate:   () => Promise<void>;
  clearRecipe: () => void;
}

export const useRecipeStore = create<RecipeState>()((set) => ({
  recipe:       null,
  usedItems:    [],
  isGenerating: false,
  error:        null,

  generate: async () => {
    set({ isGenerating: true, error: null, recipe: null });
    try {
      const response = await apiClient.post('/recipe/generate');
      const { recipe, ingredients_used } = response.data.data;
      set({ recipe, usedItems: ingredients_used, isGenerating: false });
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to generate recipe.';
      set({ error: message, isGenerating: false });
      throw new Error(message);
    }
  },

  clearRecipe: () => set({ recipe: null, usedItems: [], error: null }),
}));
