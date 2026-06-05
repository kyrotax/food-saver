<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessReceiptOCR;
use App\Models\OfflineQueue;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    /**
     * POST /api/sync/upload
     * Batch upload receipt images queued while offline.
     * Accepts up to 5 images per request (per NFR-08).
     */
    public function uploadBatch(Request $request)
    {
        $request->validate([
            'images'   => 'required|array|max:5',
            'images.*' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
        ]);

        $dispatched = 0;
        $userId     = $request->user()->id;

        foreach ($request->file('images') as $image) {
            $imagePath = $image->store('receipts/sync', 'local');

            // Track in DB for audit
            OfflineQueue::create([
                'user_id'    => $userId,
                'image_path' => $imagePath,
                'status'     => OfflineQueue::STATUS_PENDING,
            ]);

            // Dispatch async OCR job
            ProcessReceiptOCR::dispatch($userId, $imagePath);
            $dispatched++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$dispatched} receipt(s) queued for processing. Inventory will update shortly.",
            'data'    => ['queued_count' => $dispatched],
        ], 202);
    }
}
