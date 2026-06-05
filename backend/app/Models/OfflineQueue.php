<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfflineQueue extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'image_path',
        'status',
    ];

    /**
     * Status constants.
     */
    public const STATUS_PENDING  = 'pending';
    public const STATUS_UPLOADED = 'uploaded';
    public const STATUS_FAILED   = 'failed';

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
