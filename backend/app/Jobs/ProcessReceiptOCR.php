<?php

namespace App\Jobs;

use App\Http\Middleware\PrivacyFilterMiddleware;
use App\Models\FoodItem;
use App\Models\OfflineQueue;
use App\Services\CloudVisionService;
use App\Services\ExpirationCalculatorService;
use App\Services\GeminiService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessReceiptOCR implements ShouldQueue
{
    use Queueable, InteractsWithQueue;

    /**
     * Maximum number of job attempts before failing.
     */
    public int $tries = 3;

    /**
     * Timeout in seconds per attempt (NFR-02: ≤ 7s pipeline).
     */
    public int $timeout = 60;

    public function __construct(
        private int    $userId,
        private string $imagePath
    ) {}

    /**
     * Execute the OCR → Privacy Filter → Gemini → DB pipeline.
     */
    public function handle(
        CloudVisionService       $vision,
        GeminiService            $gemini,
        ExpirationCalculatorService $expiry,
        PrivacyFilterMiddleware  $privacyFilter
    ): void {
        try {
            Log::info("ProcessReceiptOCR: Starting for user {$this->userId}");

            // Step 1: Extract raw text via Cloud Vision OCR
            $rawText = $vision->extractText($this->imagePath);

            // Step 2: Apply privacy filter to strip financial data
            $sanitizedText = $privacyFilter->scrub($rawText);

            // Step 3: Parse items via Gemini AI
            $parsedItems = $gemini->parseReceiptItems($sanitizedText);

            // Step 4: Classify each item and persist to food_items table
            foreach ($parsedItems as $item) {
                if (empty($item['product_name'])) {
                    continue;
                }

                $storageLocation = $item['storage_location'] ?? 'room_temp';
                $isScalable      = $item['is_scalable'] ?? false;

                // Calculate expiration date
                $expirationDate = $expiry->calculate($item['product_name'], $storageLocation);

                // Determine initial urgency status
                $daysRemaining = now()->diffInDays($expirationDate, false);
                $urgencyStatus = 'green';
                if ($daysRemaining <= 1) {
                    $urgencyStatus = 'red';
                } elseif ($daysRemaining <= 3) {
                    $urgencyStatus = 'yellow';
                }

                FoodItem::create([
                    'user_id'           => $this->userId,
                    'product_name'      => $item['product_name'],
                    'quantity'          => $item['quantity'] ?? 1,
                    'original_quantity' => $item['quantity'] ?? 1,
                    'unit'              => $item['unit'] ?? 'pcs',
                    'storage_location'  => $storageLocation,
                    'expiration_date'   => $expirationDate,
                    'urgency_status'    => $urgencyStatus,
                    'is_scalable'       => $isScalable,
                ]);
            }

            // Step 5: Mark offline queue entry as uploaded (if applicable)
            OfflineQueue::where('image_path', $this->imagePath)
                ->update(['status' => OfflineQueue::STATUS_UPLOADED]);

            // Step 6: Clean up the temporary image file
            Storage::disk('local')->delete($this->imagePath);

            Log::info("ProcessReceiptOCR: Completed for user {$this->userId}. Items saved: " . count($parsedItems));

        } catch (\Exception $e) {
            Log::error("ProcessReceiptOCR failed for user {$this->userId}: " . $e->getMessage());

            OfflineQueue::where('image_path', $this->imagePath)
                ->update(['status' => OfflineQueue::STATUS_FAILED]);

            $this->fail($e);
        }
    }
}
