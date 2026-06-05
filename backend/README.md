# Food Saver — Backend Setup Guide
## Laravel 11 + MySQL

---

## Prerequisites

- PHP 8.2+
- Composer
- MySQL 8.0+
- Redis (optional, for queue; uses `database` driver by default)

---

## 1. Install Dependencies

```bash
cd app_build/backend
composer install
```

---

## 2. Environment Configuration

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` with your values:

```env
DB_DATABASE=food_saver
DB_USERNAME=root
DB_PASSWORD=your_password

GOOGLE_CLOUD_VISION_API_KEY=your_key
GOOGLE_GEMINI_API_KEY=your_key
FCM_SERVER_KEY=your_key
```

Also add these to `config/services.php`:

```php
'google' => [
    'vision_api_key'  => env('GOOGLE_CLOUD_VISION_API_KEY'),
    'vision_endpoint' => env('GOOGLE_CLOUD_VISION_ENDPOINT'),
    'gemini_api_key'  => env('GOOGLE_GEMINI_API_KEY'),
    'gemini_endpoint' => env('GOOGLE_GEMINI_ENDPOINT'),
],
'fcm' => [
    'server_key' => env('FCM_SERVER_KEY'),
    'endpoint'   => env('FCM_ENDPOINT'),
],
```

---

## 3. Database Setup

```bash
# Create MySQL database first
mysql -u root -p -e "CREATE DATABASE food_saver;"

# Run migrations
php artisan migrate

# Create jobs table (for queue)
php artisan queue:table
php artisan migrate
```

---

## 4. Run the Application

```bash
# Start Laravel dev server
php artisan serve --port=8000

# In a separate terminal — start queue worker
php artisan queue:work --tries=3

# In a separate terminal — start scheduler (for notifications)
php artisan schedule:work
```

---

## 5. API Endpoints Reference

| Method | Endpoint                     | Auth | Description           |
|--------|------------------------------|------|-----------------------|
| POST   | /api/auth/register           | ❌   | Register user         |
| POST   | /api/auth/login              | ❌   | Login → get token     |
| POST   | /api/auth/logout             | ✅   | Revoke token          |
| PUT    | /api/auth/profile            | ✅   | Update profile        |
| GET    | /api/inventory               | ✅   | Get all food items    |
| GET    | /api/inventory/check         | ✅   | Fridge check list     |
| POST   | /api/inventory/scan          | ✅   | Upload receipt        |
| PUT    | /api/inventory/{id}/slider   | ✅   | Update slider         |
| DELETE | /api/inventory/{id}          | ✅   | Delete item           |
| POST   | /api/recipe/generate         | ✅   | Generate AI recipe    |
| POST   | /api/sync/upload             | ✅   | Batch sync upload     |
