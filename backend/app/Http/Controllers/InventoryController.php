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
     * Upload a receipt image → process OCR synchronously → return parsed draft items.
     */
    public function scan(
        Request $request,
        \App\Services\CloudVisionService $vision,
        \App\Services\GeminiService $gemini,
        \App\Services\ExpirationCalculatorService $expiry,
        \App\Http\Middleware\PrivacyFilterMiddleware $privacyFilter
    ) {
        $request->validate([
            'receipt_image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
        ]);

        // Store image to local disk temporarily
        $imagePath = $request->file('receipt_image')->store('receipts', 'local');
        $absolutePath = storage_path("app/{$imagePath}");

        // Strip EXIF metadata
        $this->stripExif($absolutePath);

        try {
            // Step 1: Extract text
            $rawText = $vision->extractText($imagePath);

            // Step 2: Apply privacy filter
            $sanitizedText = $privacyFilter->scrub($rawText);

            // Step 3: Parse ingredients via Gemini AI
            $parsedItems = $gemini->parseReceiptItems($sanitizedText);

            $processedItems = [];
            foreach ($parsedItems as $item) {
                if (empty($item['product_name'])) {
                    continue;
                }

                $storageLocation = $item['storage_location'] ?? 'room_temp';
                $isScalable      = $item['is_scalable'] ?? false;

                // Calculate expiration date
                $expirationDate = $expiry->calculate($item['product_name'], $storageLocation);

                $processedItems[] = [
                    'product_name'     => $item['product_name'],
                    'quantity'         => $item['quantity'] ?? 1,
                    'unit'             => $item['unit'] ?? 'pcs',
                    'storage_location' => $storageLocation,
                    'expiration_date'  => $expirationDate->toDateString(),
                    'is_scalable'      => $isScalable,
                ];
            }

            // Clean up temporary image
            \Illuminate\Support\Facades\Storage::disk('local')->delete($imagePath);

            return response()->json([
                'success' => true,
                'data'    => $processedItems,
            ]);

        } catch (\Exception $e) {
            // Clean up temporary image in case of error
            \Illuminate\Support\Facades\Storage::disk('local')->delete($imagePath);

            \Illuminate\Support\Facades\Log::error("Synchronous scan failed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse receipt: ' . $e->getMessage(),
            ], 500);
        }
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

    /**
     * POST /api/inventory
     * Batch save confirmed inventory items.
     */
    public function store(Request $request)
    {
        $request->validate([
            'items'                    => 'required|array|min:1',
            'items.*.product_name'     => 'required|string|max:150',
            'items.*.quantity'         => 'required|numeric|min:0',
            'items.*.unit'             => 'required|string|max:30',
            'items.*.storage_location' => 'required|in:freezer,chiller,room_temp',
            'items.*.expiration_date'  => 'required|date_format:Y-m-d',
            'items.*.is_scalable'      => 'sometimes|boolean',
        ]);

        $savedItems = [];
        $userId = $request->user()->id;

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $userId, &$savedItems) {
            foreach ($request->input('items') as $item) {
                // Determine urgency status based on expiration date
                $expirationDate = \Carbon\Carbon::parse($item['expiration_date']);
                $daysRemaining  = now()->diffInDays($expirationDate, false);

                $urgencyStatus = 'green';
                if ($daysRemaining <= 1) {
                    $urgencyStatus = 'red';
                } elseif ($daysRemaining <= 3) {
                    $urgencyStatus = 'yellow';
                }

                $savedItems[] = FoodItem::create([
                    'user_id'           => $userId,
                    'product_name'      => $item['product_name'],
                    'quantity'          => $item['quantity'],
                    'original_quantity' => $item['quantity'],
                    'unit'              => $item['unit'],
                    'storage_location'  => $item['storage_location'],
                    'expiration_date'   => $item['expiration_date'],
                    'urgency_status'    => $urgencyStatus,
                    'is_scalable'       => $item['is_scalable'] ?? false,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => count($savedItems) . ' item(s) saved to kitchen.',
            'data'    => $savedItems,
        ], 201);
    }

    /**
     * Recreate image from file to discard all EXIF metadata.
     */
    private function stripExif(string $absolutePath): void
    {
        if (!function_exists('mime_content_type')) {
            return;
        }

        $mime = @mime_content_type($absolutePath);
        if (!$mime) {
            return;
        }

        if ($mime === 'image/jpeg' || $mime === 'image/jpg') {
            $image = @imagecreatefromjpeg($absolutePath);
            if ($image) {
                imagejpeg($image, $absolutePath, 90);
                imagedestroy($image);
            }
        } elseif ($mime === 'image/png') {
            $image = @imagecreatefrompng($absolutePath);
            if ($image) {
                imagepng($image, $absolutePath);
                imagedestroy($image);
            }
        } elseif ($mime === 'image/webp') {
            $image = @imagecreatefromwebp($absolutePath);
            if ($image) {
                imagewebp($image, $absolutePath);
                imagedestroy($image);
            }
        }
    }
}
