<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:100',
            'email'             => 'required|email|unique:users,email|max:150',
            'password'          => 'required|string|min:8|confirmed',
            'persona'           => 'sometimes|in:minimalist,professional,chef',
            'notification_time' => 'sometimes|date_format:H:i',
        ]);

        $user = User::create([
            'name'              => $validated['name'],
            'email'             => $validated['email'],
            'password'          => Hash::make($validated['password']),
            'persona'           => $validated['persona'] ?? 'minimalist',
            'notification_time' => $validated['notification_time'] ?? '08:00',
        ]);

        $token = $user->createToken('food-saver-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'data'    => [
                'user'  => $this->formatUser($user),
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login an existing user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update FCM token if provided
        if ($request->has('fcm_token')) {
            $user->fcmTokens()->updateOrCreate(
                ['fcm_token' => $request->fcm_token],
                [
                    'device_name'  => $request->input('device_name', $request->header('User-Agent')),
                    'last_used_at' => now(),
                ]
            );
        }

        // Expire old tokens and issue a new one
        $user->tokens()->delete();
        $token = $user->createToken('food-saver-token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data'    => [
                'user'  => $this->formatUser($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout (revoke current token).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Update user profile (persona, notification_time, fcm_token).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'persona'           => 'sometimes|in:minimalist,professional,chef',
            'notification_time' => 'sometimes|date_format:H:i',
            'fcm_token'         => 'sometimes|string',
            'device_name'       => 'sometimes|string',
            'name'              => 'sometimes|string|max:100',
        ]);

        $userData = collect($validated)->except(['fcm_token', 'device_name'])->toArray();
        $request->user()->update($userData);

        if (isset($validated['fcm_token'])) {
            $request->user()->fcmTokens()->updateOrCreate(
                ['fcm_token' => $validated['fcm_token']],
                [
                    'device_name'  => $validated['device_name'] ?? $request->header('User-Agent'),
                    'last_used_at' => now(),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data'    => ['user' => $this->formatUser($request->user()->fresh())],
        ]);
    }

    /**
     * Format user data for API response.
     */
    private function formatUser(User $user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'persona'           => $user->persona,
            'notification_time' => $user->notification_time,
        ];
    }
}
