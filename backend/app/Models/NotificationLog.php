<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'notification_type',
        'scheduled_for',
        'sent_at',
        'status',
    ];

    protected $casts = [
        'scheduled_for' => 'date',
        'sent_at'       => 'datetime',
    ];

    /**
     * Relationship: belongs to a User.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
