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
            $absolutePath = storage_path("app/{$imagePath}");

            // Strip EXIF metadata
            $this->stripExif($absolutePath);

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
