<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Builds staff User rows for tests. Roles: 1 admin, 2 staff (ReferenceDataSeeder).
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'role_id' => 2,
            'name' => fake()->name(),
            'username' => Str::lower(Str::random(8)),
            'password' => static::$password ??= 'password123',
            'is_active' => true,
            'must_change_password' => false,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role_id' => 1]);
    }

    public function disabled(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
