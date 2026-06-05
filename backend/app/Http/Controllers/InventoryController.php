<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessReceiptOCR;
use App\Models\FoodItem;
use App\Models\HistoryLog;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * GET /api/inventory
     * Fetch all food items for the authenticated user, ordered by urgency (red → yellow → green).
     */
    public function index(Request $request)
    {
        $items = FoodItem::where('user_id', $request->user()->id)
            ->orderByUrgency()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $items,
        ]);
    }

    /**
     * GET /api/inventory/check
     * "Digital Refrigerator Check" — returns a concise list for pre-shopping review.
     */
    public function fridgeCheck(Request $request)
    {
        $items = FoodItem::where('user_id', $request->user()->id)
            ->orderByUrgency()
            ->select('id', 'product_name', 'quantity', 'unit', 'urgency_status', 'expiration_date')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $items,
        ]);
    }

    /**
     * POST /api/inventory/scan
     * Upload a receipt image → dispatch to OCR pipeline via Laravel Queue.
     * The PrivacyFilterMiddleware runs BEFORE this controller method.
     */
    public function scan(Request $request)
    {
        $request->validate([
            'receipt_image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
        ]);

        // Store image to local disk temporarily
        $imagePath = $request->file('receipt_image')->store('receipts', 'local');

        // Dispatch to queue (async) so the API responds immediately
        ProcessReceiptOCR::dispatch($request->user()->id, $imagePath);

        return response()->json([
            'success' => true,
            'message' => 'Receipt uploaded. Your inventory will update in a few seconds.',
        ], 202);
    }

    /**
     * PUT /api/inventory/{id}/slider
     * Update food item quantity using the consumption percentage slider.
     */
    public function updateSlider(Request $request, int $id)
    {
        $request->validate([
            'state' => 'required|in:100,50,25,0',
        ]);

        $item = FoodItem::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $multiplier  = FoodItem::SLIDER_MULTIPLIERS[$request->state];
        $newQuantity = round(((float) $item->original_quantity) * $multiplier, 4);

        // Slider at 0%: consume the item, archive it in history_logs
        if ($request->state === '0') {
            HistoryLog::create([
                'user_id'           => $request->user()->id,
                'product_name'      => $item->product_name,
                'quantity_consumed' => $item->original_quantity,
                'consumed_at'       => now(),
            ]);

            $item->delete();

            return response()->json([
                'success' => true,
                'message' => "{$item->product_name} marked as consumed and archived.",
            ]);
        }

        $item->update(['quantity' => $newQuantity]);

        return response()->json([
            'success' => true,
            'message' => "Quantity updated to {$newQuantity} {$item->unit}.",
            'data'    => $item->fresh(),
        ]);
    }

    /**
     * DELETE /api/inventory/{id}
     * Manual deletion of a food item.
     */
    public function destroy(Request $request, int $id)
    {
        $item = FoodItem::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => "{$item->product_name} deleted from inventory.",
        ]);
    }
}
