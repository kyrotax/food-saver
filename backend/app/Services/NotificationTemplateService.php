<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Collection;

class NotificationTemplateService
{
    /**
     * Static notification copy templates, keyed by persona and urgency level.
     * Uses static templates (no Gemini API call) to conserve API quota — per Appendix B strategy.
     *
     * Each template supports {item}, {count}, and {days} placeholders.
     */
    private const TEMPLATES = [
        'minimalist' => [
            'single' => [
                '⚠️ {item} expires soon. Cook it today!',
                '🔴 {item} is almost gone. Use it now!',
                '⏰ {item} expires in {days} day(s). Don\'t waste it!',
            ],
            'multi' => [
                '⚠️ {count} item(s) expiring soon. Check your kitchen!',
                '🔴 {count} food(s) need attention. Open Food Saver now!',
            ],
        ],
        'professional' => [
            'single' => [
                'Inventory Alert: {item} requires consumption within {days} day(s).',
                'Notice: {item} will expire soon. Immediate use is recommended.',
                'Food Expiry Warning: {item} — {days} day(s) remaining.',
            ],
            'multi' => [
                'Inventory Update: {count} item(s) approaching expiration threshold.',
                'Action Required: {count} food item(s) need immediate attention.',
            ],
        ],
        'chef' => [
            'single' => [
                'Hey! Your {item} is almost done 🍳 Time to cook something creative!',
                '🧑‍🍳 {item} expires in {days} day(s) — perfect for tonight\'s dinner!',
                'Chef mode: ON 🔥 {item} needs to go into a pot ASAP!',
            ],
            'multi' => [
                '🍽️ You have {count} ingredients that need cooking! Open Food Saver!',
                '🧑‍🍳 {count} items are expiring — time to make magic in the kitchen!',
            ],
        ],
    ];

    /**
     * Build a notification payload for a user's persona given their urgent food items.
     *
     * @param  string      $persona      'minimalist' | 'professional' | 'chef'
     * @param  Collection  $urgentItems  FoodItem collection (yellow + red)
     * @return array  ['title' => string, 'body' => string, 'data' => array]
     */
    public static function forPersona(string $persona, Collection $urgentItems): array
    {
        $templates = self::TEMPLATES[$persona] ?? self::TEMPLATES['minimalist'];
        $count     = $urgentItems->count();
        $firstItem = $urgentItems->first();
        $daysLeft  = now()->diffInDays($firstItem->expiration_date, false);
        $daysLeft  = max((int) $daysLeft, 0);

        if ($count === 1) {
            $pool = $templates['single'];
            $body = $pool[array_rand($pool)];
            $body = str_replace(['{item}', '{days}'], [$firstItem->product_name, $daysLeft], $body);
        } else {
            $pool = $templates['multi'];
            $body = $pool[array_rand($pool)];
            $body = str_replace('{count}', $count, $body);
        }

        return [
            'title' => 'Food Saver 🥘',
            'body'  => $body,
            'data'  => [
                'screen'        => 'Dashboard',
                'urgency_count' => $count,
            ],
        ];
    }
}
