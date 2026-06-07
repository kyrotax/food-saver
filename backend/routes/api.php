<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Food Saver — API Routes
|--------------------------------------------------------------------------
| All routes are prefixed with /api (configured in bootstrap/app.php)
| Protected routes require a valid Laravel Sanctum bearer token.
|--------------------------------------------------------------------------
*/

// ─── Public Routes (No auth required) ───────────────────────────────────────
Route::get('/login', function () {
    return response()->json([
        'success' => false,
        'message' => 'Unauthenticated. Please login first.',
    ], 401);
})->name('login');

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:10,1');
});

// ─── Protected Routes (Sanctum auth required) ────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::put('/profile',  [AuthController::class, 'updateProfile']);
    });

    // Inventory
    Route::prefix('inventory')->group(function () {
        Route::get('/',              [InventoryController::class, 'index']);
        Route::get('/check',         [InventoryController::class, 'fridgeCheck']);
        Route::post('/scan',         [InventoryController::class, 'scan'])->middleware(['privacy.filter', 'throttle:5,1']);
        Route::put('/{id}/slider',   [InventoryController::class, 'updateSlider']);
        Route::put('/{id}',          [InventoryController::class, 'update']);
        Route::delete('/{id}',       [InventoryController::class, 'destroy']);
        Route::post('/',             [InventoryController::class, 'store']);
    });

    // Recipe Generator
    Route::post('/recipe/generate', [RecipeController::class, 'generate'])->middleware('throttle:3,1');

    // Offline Sync
    Route::post('/sync/upload', [SyncController::class, 'uploadBatch'])->middleware(['privacy.filter', 'throttle:5,1']);
});
