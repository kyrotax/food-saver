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
    $today       = now()->toDateString();

    $users = \App\Models\User::whereTime('notification_time', $currentTime)
        ->whereHas('fcmTokens')
        ->get();

    foreach ($users as $user) {
        // Prevent duplicate alerts on the same day
        $alreadyLogged = \App\Models\NotificationLog::where('user_id', $user->id)
            ->where('notification_type', 'expiration_alert')
            ->where('scheduled_for', $today)
            ->exists();

        if ($alreadyLogged) {
            continue;
        }

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

        // Record pending log to prevent race conditions during queue processing
        $logEntry = \App\Models\NotificationLog::create([
            'user_id'           => $user->id,
            'notification_type' => 'expiration_alert',
            'scheduled_for'     => $today,
            'status'            => 'pending',
        ]);

        // Dispatch async FCM push notification job
        \App\Jobs\SendPushNotification::dispatch($user->id, $message, $logEntry->id);
    }
})->everyMinute()->name('dispatch-notifications');
