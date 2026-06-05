<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;
    private string $endpoint;

    public function __construct()
    {
        $this->apiKey   = config('services.google.gemini_api_key');
        $this->endpoint = config('services.google.gemini_endpoint',
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent');
    }

    /**
     * Parse raw OCR text from a grocery receipt into structured food items.
     * Returns an array of ['product_name', 'quantity', 'unit'] objects.
     *
     * @param  string  $rawText  Sanitized OCR text from Cloud Vision
     * @return array
     * @throws \Exception
     */
    public function parseReceiptItems(string $rawText): array
    {
        $prompt = <<<PROMPT
You are a grocery receipt parser for an Indonesian food management app.

Given the following raw OCR text from a grocery receipt, extract all food and beverage items.
Return ONLY a valid JSON array with no markdown, no explanation, no extra text.
Each element must have exactly these fields:
- "product_name": string (clean, readable product name in Indonesian or English)
- "quantity": number (decimal allowed, e.g. 0.5, 1, 250)
- "unit": string (e.g. "pcs", "kg", "g", "liter", "ml", "bungkus", "botol")

Ignore: prices, totals, tax amounts, store names, cashier codes, payment info.

Raw OCR text:
---
{$rawText}
---

JSON array:
PROMPT;

        $response = $this->callGemini($prompt);
        return $this->parseJsonFromResponse($response, 'array');
    }

    /**
     * Classify a food item to determine its optimal storage location
     * and smart default expiration baseline.
     *
     * @param  string  $productName
     * @return array  ['storage_location' => string, 'base_shelf_life_days' => int, 'is_scalable' => bool, 'education_note' => string]
     */
    public function classifyFoodItem(string $productName): array
    {
        $prompt = <<<PROMPT
You are a food storage expert for Indonesian households.

Given this food item: "{$productName}"

Return ONLY a JSON object with these fields:
- "storage_location": one of "freezer", "chiller", or "room_temp"
- "base_shelf_life_days": integer (shelf life at room temperature in days)
- "is_scalable": boolean (true if this is a packaged good measured by percentage, e.g. oil, flour, sugar)
- "education_note": string (1-sentence tip in Bahasa Indonesia about why this storage location is optimal)

JSON object:
PROMPT;

        $response = $this->callGemini($prompt);
        return $this->parseJsonFromResponse($response, 'object');
    }

    /**
     * Generate an adaptive Indonesian recipe from a list of urgent ingredients.
     *
     * @param  string  $ingredientList  e.g. "Ayam: 0.5 kg, Wortel: 2 pcs, Minyak: 0.25 liter"
     * @return string  Recipe text in Bahasa Indonesia
     */
    public function generateRecipe(string $ingredientList): string
    {
        $prompt = <<<PROMPT
Kamu adalah chef Indonesia yang kreatif dan hemat.

Buat 1 resep masakan Indonesia yang praktis menggunakan bahan-bahan berikut yang tersisa:
{$ingredientList}

Persyaratan:
- Resep harus realistis dan mudah dimasak di dapur rumahan
- Sesuaikan takaran bahan dengan jumlah yang tersedia persis (ubah ke sendok makan/teh jika diperlukan)
- Format resep:
  1. **Nama Masakan**
  2. **Bahan-bahan** (dengan takaran yang disesuaikan)
  3. **Langkah Memasak** (numbered steps)
  4. **Tips Hemat** (1 tips singkat)
PROMPT;

        return $this->callGemini($prompt);
    }

    /**
     * Make a request to the Gemini API.
     */
    private function callGemini(string $prompt): string
    {
        $response = Http::withQueryParameters(['key' => $this->apiKey])
            ->timeout(30)
            ->post($this->endpoint, [
                'contents' => [
                    ['parts' => [['text' => $prompt]]],
                ],
                'generationConfig' => [
                    'temperature'     => 0.3,
                    'maxOutputTokens' => 2048,
                ],
            ]);

        if ($response->failed()) {
            Log::error('Gemini API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \Exception('Gemini API request failed: ' . $response->status());
        }

        return $response->json('candidates.0.content.parts.0.text', '');
    }

    /**
     * Parse JSON from Gemini's text response.
     */
    private function parseJsonFromResponse(string $text, string $type): mixed
    {
        // Strip markdown code blocks if present
        $text = preg_replace('/```(?:json)?\s*([\s\S]*?)\s*```/', '$1', trim($text));

        $decoded = json_decode(trim($text), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('Gemini returned invalid JSON', ['raw' => $text]);
            throw new \Exception('Gemini returned malformed JSON: ' . json_last_error_msg());
        }

        if ($type === 'array' && ! is_array($decoded)) {
            throw new \Exception('Expected JSON array from Gemini.');
        }

        return $decoded;
    }
}
