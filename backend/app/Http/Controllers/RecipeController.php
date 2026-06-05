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

        if ($urgentItems->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No urgent items found. Your kitchen is looking good!',
            ], 404);
        }

        // Build ingredient snapshot for Gemini prompt
        $ingredientList = $urgentItems->map(function ($item) {
            return "{$item->product_name}: {$item->quantity} {$item->unit}";
        })->implode(', ');

        $recipe = $this->gemini->generateRecipe($ingredientList);

        return response()->json([
            'success' => true,
            'data'    => [
                'ingredients_used' => $urgentItems->pluck('product_name'),
                'recipe'           => $recipe,
            ],
        ]);
    }
}
