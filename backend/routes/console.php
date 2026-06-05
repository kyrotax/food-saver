<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Food Saver — Console Routes (Task Scheduling)
|--------------------------------------------------------------------------
| This file defines the Laravel task scheduler for:
| - Urgency status recalculation (runs every hour)
| - Personalized push notification dispatch (runs every minute)
|--------------------------------------------------------------------------
*/

/**
 * Every hour: recalculate urgency_status for all food items
 * based on days remaining until expiration_date.
 */
Schedule::call(function () {
    $items = \App\Models\FoodItem::all();
    foreach ($items as $item) {
        $daysRemaining = now()->diffInDays($item->expiration_date, false);

        $status = 'green';
        if ($daysRemaining <= 1) {
            $status = 'red';
        } elseif ($daysRemaining <= 3) {
            $status = 'yellow';
        }

        if ($item->urgency_status !== $status) {
            $item->update(['urgency_status' => $status]);
        }
    }
})->hourly()->name('recalculate-urgency');

/**
 * Every minute: dispatch personalized FCM notifications to users
 * whose preferred notification_time matches the current HH:MM.
 */
Schedule::call(function () {
    $currentTime = now()->format('H:i');

    $users = \App\Models\User::whereTime('notification_time', $currentTime)
        ->whereNotNull('fcm_token')
        ->get();

    foreach ($users as $user) {
        $urgentItems = \App\Models\FoodItem::where('user_id', $user->id)
            ->whereIn('urgency_status', ['yellow', 'red'])
            ->get();

        if ($urgentItems->isEmpty()) {
            continue;
        }

        $message = \App\Services\NotificationTemplateService::forPersona(
            $user->persona,
            $urgentItems
        );

        app(\App\Services\FCMService::class)->sendToDevice($user->fcm_token, $message);
    }
})->everyMinute()->name('dispatch-notifications');
