<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FoodItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_name',
        'quantity',
        'unit',
        'storage_location',
        'expiration_date',
        'urgency_status',
        'is_scalable',
        'original_quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity'          => 'decimal:4',
            'original_quantity' => 'decimal:4',
            'expiration_date'   => 'date',
            'is_scalable'       => 'boolean',
        ];
    }

    /**
     * Urgency status constants.
     */
    public const URGENCY_GREEN  = 'green';
    public const URGENCY_YELLOW = 'yellow';
    public const URGENCY_RED    = 'red';

    /**
     * Storage location constants.
     */
    public const STORAGE_FREEZER   = 'freezer';
    public const STORAGE_CHILLER   = 'chiller';
    public const STORAGE_ROOM_TEMP = 'room_temp';

    /**
     * Slider state multiplier map.
     */
    public const SLIDER_MULTIPLIERS = [
        '100' => 1.0,
        '50'  => 0.5,
        '25'  => 0.25,
        '0'   => 0.0,
    ];

    /**
     * Relationship: belongs to a user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: urgency items (yellow + red) for recipe/notification use.
     */
    public function scopeUrgent($query)
    {
        return $query->whereIn('urgency_status', [self::URGENCY_YELLOW, self::URGENCY_RED]);
    }

    /**
     * Scope: order by urgency (red first, then yellow, then green).
     */
    public function scopeOrderByUrgency($query)
    {
        return $query->orderByRaw("CASE urgency_status WHEN 'red' THEN 1 WHEN 'yellow' THEN 2 WHEN 'green' THEN 3 ELSE 4 END");
    }
}
