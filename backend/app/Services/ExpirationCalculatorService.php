<?php

namespace App\Services;

use Carbon\Carbon;

class ExpirationCalculatorService
{
    /**
     * Category guardrails defining maximum safe shelf life in days.
     */
    private const CATEGORY_GUARDRAILS = [
        'dry_goods' => [
            'keywords' => ['beras', 'minyak', 'tepung', 'gula', 'garam', 'mie', 'indomie', 'pasta', 'kecap', 'saos', 'saus', 'kopi', 'teh', 'bumbu', 'bubuk', 'kental manis', 'uht'],
            'max_shelf_life' => ['freezer' => 730, 'chiller' => 730, 'room_temp' => 730]
        ],
        'meat_poultry_fish' => [
            'keywords' => ['ayam', 'daging', 'ikan', 'sapi', 'kambing', 'seafood', 'udang', 'cumi', 'bakso', 'sosis'],
            'max_shelf_life' => ['freezer' => 180, 'chiller' => 5, 'room_temp' => 1]
        ],
        'tofu_tempeh' => [
            'keywords' => ['tahu', 'tempe'],
            'max_shelf_life' => ['freezer' => 14, 'chiller' => 5, 'room_temp' => 1]
        ],
        'fresh_dairy' => [
            'keywords' => ['susu', 'yogurt'],
            'max_shelf_life' => ['freezer' => 90, 'chiller' => 14, 'room_temp' => 1]
        ],
        'hard_dairy' => [
            'keywords' => ['keju', 'butter', 'mentega', 'cream'],
            'max_shelf_life' => ['freezer' => 180, 'chiller' => 30, 'room_temp' => 14]
        ],
        'tubers_alliums' => [
            'keywords' => ['kentang', 'bawang', 'singkong', 'ubi'],
            'max_shelf_life' => ['freezer' => 90, 'chiller' => 90, 'room_temp' => 60]
        ],
        'vegetables_fruits' => [
            'keywords' => ['bayam', 'kangkung', 'wortel', 'tomat', 'kubis', 'sawi', 'pisang', 'apel', 'jeruk', 'mangga', 'semangka', 'sayur', 'buah', 'cabe', 'cabai'],
            'max_shelf_life' => ['freezer' => 30, 'chiller' => 14, 'room_temp' => 7]
        ]
    ];

    /**
     * Base shelf life (in days at room temperature) for common food categories.
     * Used as fallback if AI prediction is unavailable.
     */
    private const BASE_SHELF_LIFE = [
        // Proteins
        'ayam'       => 2,   'daging sapi'  => 3,  'ikan'       => 1,
        'telur'      => 21,  'tahu'         => 3,  'tempe'      => 3,
        // Dairy
        'susu'       => 5,   'keju'         => 14, 'yogurt'     => 7,
        'butter'     => 30,
        // Vegetables (sayuran)
        'bayam'      => 2,   'kangkung'     => 2,  'wortel'     => 7,
        'tomat'      => 5,   'bawang merah' => 30, 'bawang putih' => 60,
        'kentang'    => 14,  'kubis'        => 14, 'sawi'       => 3,
        // Fruits (buah)
        'pisang'     => 5,   'apel'         => 14, 'jeruk'      => 10,
        'mangga'     => 4,   'semangka'     => 7,
        // Packaged/dry goods
        'minyak'     => 365, 'tepung terigu' => 365, 'beras'    => 365,
        'gula'       => 730, 'garam'        => 1825, 'mie instan' => 180,
        'kecap'      => 365, 'saos'         => 180,
        // Default fallback
        'default'    => 7,
    ];

    /**
     * Storage multipliers applied to the base shelf life (fallback only).
     */
    private const STORAGE_MULTIPLIERS = [
        'freezer'   => 4.0,
        'chiller'   => 1.0,
        'room_temp' => 0.5,
    ];

    /**
     * Apply category-based safety guardrails to the predicted shelf life.
     */
    public function applyGuardrails(string $productName, array $predictedShelfLife): array
    {
        $lower = strtolower($productName);
        $maxShelfLife = ['freezer' => 365, 'chiller' => 90, 'room_temp' => 30]; // default caps

        // Define order of checking to ensure dry/processed versions are matched first
        $order = [
            'dry_goods',
            'meat_poultry_fish',
            'tofu_tempeh',
            'fresh_dairy',
            'hard_dairy',
            'tubers_alliums',
            'vegetables_fruits'
        ];

        foreach ($order as $catKey) {
            $catData = self::CATEGORY_GUARDRAILS[$catKey];
            foreach ($catData['keywords'] as $keyword) {
                // Use regex word boundaries to prevent matches like 'bayam' matching 'ayam'
                $pattern = '/\b' . preg_quote($keyword, '/') . '\b/i';
                if (preg_match($pattern, $lower)) {
                    $maxShelfLife = $catData['max_shelf_life'];
                    break 2;
                }
            }
        }

        $capped = [];
        foreach (['freezer', 'chiller', 'room_temp'] as $loc) {
            $predicted = (int) ($predictedShelfLife[$loc] ?? 1);
            $maxLimit = $maxShelfLife[$loc];
            $capped[$loc] = max(min($predicted, $maxLimit), 1);
        }

        return $capped;
    }

    /**
     * Calculate the expiration date based on product name and storage location.
     * Optionally takes the capped predicted shelf life.
     */
    public function calculate(string $productName, string $storageLocation, ?array $predictedShelfLife = null): Carbon
    {
        if ($predictedShelfLife) {
            $daysToAdd = $predictedShelfLife[$storageLocation] ?? 1;
        } else {
            $baseLife   = $this->getBaseShelfLife($productName);
            $multiplier = self::STORAGE_MULTIPLIERS[$storageLocation] ?? 1.0;
            $daysToAdd = (int) round($baseLife * $multiplier);
        }

        return Carbon::now()->addDays(max($daysToAdd, 1));
    }

    /**
     * Lookup base shelf life by matching product name keywords (fallback only).
     */
    private function getBaseShelfLife(string $productName): int
    {
        $lower = strtolower($productName);

        foreach (self::BASE_SHELF_LIFE as $keyword => $days) {
            if ($keyword !== 'default' && str_contains($lower, $keyword)) {
                return $days;
            }
        }

        return self::BASE_SHELF_LIFE['default'];
    }
}
