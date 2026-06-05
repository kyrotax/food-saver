<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudVisionService
{
    private string $apiKey;
    private string $endpoint;

    public function __construct()
    {
        $this->apiKey   = config('services.google.vision_api_key');
        $this->endpoint = config('services.google.vision_endpoint',
            'https://vision.googleapis.com/v1/images:annotate');
    }

    /**
     * Extract raw text from a receipt image using Google Cloud Vision OCR.
     *
     * @param  string  $imagePath  Local disk path to the image file
     * @return string  Raw extracted text
     * @throws \Exception
     */
    public function extractText(string $imagePath): string
    {
        $imageContent = base64_encode(file_get_contents(storage_path("app/{$imagePath}")));

        $response = Http::withQueryParameters(['key' => $this->apiKey])
            ->timeout(15)
            ->post($this->endpoint, [
                'requests' => [
                    [
                        'image'    => ['content' => $imageContent],
                        'features' => [['type' => 'TEXT_DETECTION', 'maxResults' => 1]],
                        'imageContext' => ['languageHints' => ['id', 'en']],
                    ],
                ],
            ]);

        if ($response->failed()) {
            Log::error('CloudVision API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \Exception('Cloud Vision API request failed: ' . $response->status());
        }

        $data = $response->json();

        $rawText = $data['responses'][0]['fullTextAnnotation']['text']
            ?? $data['responses'][0]['textAnnotations'][0]['description']
            ?? '';

        if (empty($rawText)) {
            throw new \Exception('No text could be extracted from the receipt image.');
        }

        return trim($rawText);
    }
}
