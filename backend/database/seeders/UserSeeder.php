<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Insert a demo user (email: demo@foodSaver.app, password: password123)
        DB::table('users')->insert([
            'name' => 'Demo User',
            'email' => 'demo@foodsaver.app',
            // bcrypt hash of "password123"
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
?>
