<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'persona',
        'notification_time',
        'fcm_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'notification_time' => 'datetime:H:i',
        ];
    }

    /**
     * Persona options for notification tone.
     */
    public const PERSONAS = ['minimalist', 'professional', 'chef'];

    /**
     * Relationship: one user has many food items.
     */
    public function foodItems()
    {
        return $this->hasMany(FoodItem::class);
    }

    /**
     * Relationship: one user has many history logs.
     */
    public function historyLogs()
    {
        return $this->hasMany(HistoryLog::class);
    }
}
