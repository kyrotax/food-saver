<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

echo "Mulai testing API...\n";

// Test Gemini
echo "\n--- 1. Testing Gemini API ---\n";
$geminiKey = env('GOOGLE_GEMINI_API_KEY');
$geminiUrl = env('GOOGLE_GEMINI_ENDPOINT');
echo "Key: " . substr($geminiKey, 0, 10) . "...\n";

$response = Http::withQueryParameters(['key' => $geminiKey])
    ->post($geminiUrl, [
        'contents' => [
            ['parts' => [['text' => 'Halo, ini tes sederhana. Tolong balas dengan kata "Sukses" jika kamu menerima pesan ini.']]],
        ]
    ]);

if ($response->successful()) {
    echo "✅ Gemini API Berjalan Baik!\n";
    echo "Balasan: " . $response->json('candidates.0.content.parts.0.text') . "\n";
} else {
    echo "❌ Gemini API GAGAL!\n";
    echo "Status: " . $response->status() . "\n";
    echo "Error: " . $response->body() . "\n";
}

// Test Cloud Vision
echo "\n--- 2. Testing Cloud Vision API ---\n";
$visionKey = env('GOOGLE_CLOUD_VISION_API_KEY');
$visionUrl = env('GOOGLE_CLOUD_VISION_ENDPOINT', 'https://vision.googleapis.com/v1/images:annotate');
echo "Vision Key: " . substr($visionKey, 0, 10) . "...\n";

// 1x1 transparent GIF base64
$dummyImageBase64 = 'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

$response = Http::withQueryParameters(['key' => $visionKey])
    ->post($visionUrl, [
        'requests' => [
            [
                'image'    => ['content' => $dummyImageBase64],
                'features' => [['type' => 'TEXT_DETECTION', 'maxResults' => 1]],
            ],
        ],
    ]);

if ($response->successful()) {
    echo "✅ Cloud Vision API Berjalan Baik!\n";
    echo "Status: Berhasil connect menggunakan API Key.\n";
} else {
    echo "❌ Cloud Vision API GAGAL!\n";
    echo "Status: " . $response->status() . "\n";
    echo "Error: " . $response->body() . "\n";
}
