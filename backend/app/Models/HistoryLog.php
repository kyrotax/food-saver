<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_name',
        'quantity_consumed',
        'consumed_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity_consumed' => 'decimal:4',
            'consumed_at'       => 'datetime',
        ];
    }

    public $timestamps = false;

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
