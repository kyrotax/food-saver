<?php

namespace App\Services;

use Carbon\Carbon;

class ExpirationCalculatorService
{
    /**
     * Base shelf life (in days at room temperature) for common food categories.
     * Used as the baseline for expiry calculation with storage multipliers.
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
     * Storage multipliers applied to the base shelf life.
     * Freezer: 4x | Chiller: 1x | Room temp: 0.5x
     */
    private const STORAGE_MULTIPLIERS = [
        'freezer'   => 4.0,
        'chiller'   => 1.0,
        'room_temp' => 0.5,
    ];

    /**
     * Calculate the expiration date based on product name and storage location.
     *
     * @param  string  $productName
     * @param  string  $storageLocation  'freezer' | 'chiller' | 'room_temp'
     * @return Carbon
     */
    public function calculate(string $productName, string $storageLocation): Carbon
    {
        $baseLife   = $this->getBaseShelfLife($productName);
        $multiplier = self::STORAGE_MULTIPLIERS[$storageLocation] ?? 1.0;

        $daysToAdd = (int) round($baseLife * $multiplier);

        return Carbon::now()->addDays(max($daysToAdd, 1));
    }

    /**
     * Lookup base shelf life by matching product name keywords.
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
