<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * php artisan migrate:fresh --seed: the reference data, then 120 days of demo history
     * (deterministic, the same shop the frontend's mock shows).
     */
    public function run(): void
    {
        $this->call(DemoSeeder::class);
    }
}
