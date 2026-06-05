<?php

return [
    'google' => [
        'vision_api_key'  => env('GOOGLE_CLOUD_VISION_API_KEY'),
        'vision_endpoint' => env('GOOGLE_CLOUD_VISION_ENDPOINT', 'https://vision.googleapis.com/v1/images:annotate'),
        'gemini_api_key'  => env('GOOGLE_GEMINI_API_KEY'),
        'gemini_endpoint' => env('GOOGLE_GEMINI_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'),
    ],
    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY'),
        'endpoint'   => env('FCM_ENDPOINT', 'https://fcm.googleapis.com/fcm/send'),
    ],
];
