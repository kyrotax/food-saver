<?php

namespace App\Http\Controllers;

use App\Models\FoodItem;
use App\Services\GeminiService;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function __construct(private GeminiService $gemini) {}

    /**
     * POST /api/recipe/generate
     * Compile all Yellow/Red urgency items and generate an Indonesian recipe via Gemini.
     */
    public function generate(Request $request)
    {
        $userId      = $request->user()->id;
        $urgentItems = FoodItem::where('user_id', $userId)->urgent()->get();
        $ingredientsToUse = $urgentItems;

        if ($urgentItems->isEmpty()) {
            $allItems = FoodItem::where('user_id', $userId)->get();
            if ($allItems->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your kitchen is empty. Add ingredients to generate recipes!',
                ], 404);
            }
            // Pick up to 8 random ingredients to avoid overwhelming the prompt
            $ingredientsToUse = $allItems->random(min(8, $allItems->count()));
        }

        // Build ingredient snapshot for Gemini prompt
        $ingredientList = $ingredientsToUse->map(function ($item) {
            return "{$item->product_name}: {$item->quantity} {$item->unit}";
        })->implode(', ');

        $recipe = $this->gemini->generateRecipe($ingredientList);

        return response()->json([
            'success' => true,
            'data'    => [
                'ingredients_used' => $ingredientsToUse->pluck('product_name'),
                'recipe'           => $recipe,
            ],
        ]);
    }
}
