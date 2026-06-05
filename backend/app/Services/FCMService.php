<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FCMService
{
    private string $serverKey;
    private string $endpoint;

    public function __construct()
    {
        $this->serverKey = config('services.fcm.server_key');
        $this->endpoint  = config('services.fcm.endpoint', 'https://fcm.googleapis.com/fcm/send');
    }

    /**
     * Send a push notification to a single device via FCM.
     *
     * @param  string  $fcmToken  Device FCM registration token
     * @param  array   $message   ['title' => string, 'body' => string, 'data' => array]
     * @return bool
     */
    public function sendToDevice(string $fcmToken, array $message): bool
    {
        $payload = [
            'to'           => $fcmToken,
            'notification' => [
                'title' => $message['title'],
                'body'  => $message['body'],
                'sound' => 'default',
                'badge' => '1',
            ],
            'data'         => $message['data'] ?? [],
            'priority'     => 'high',
        ];

        $response = Http::withHeaders([
            'Authorization' => "key={$this->serverKey}",
            'Content-Type'  => 'application/json',
        ])->timeout(10)->post($this->endpoint, $payload);

        if ($response->failed()) {
            Log::error('FCM send failed', [
                'token'  => substr($fcmToken, 0, 10) . '...',
                'status' => $response->status(),
            ]);
            return false;
        }

        $result = $response->json();
        if (isset($result['failure']) && $result['failure'] > 0) {
            Log::warning('FCM delivery failed', ['result' => $result]);
            return false;
        }

        return true;
    }
}
