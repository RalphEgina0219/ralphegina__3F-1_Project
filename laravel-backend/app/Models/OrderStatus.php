<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Model;

/** The six stages. The last keeps the code "released" and is labelled "Completed". */
#[Fillable(['code', 'label', 'sort_order'])]
#[WithoutTimestamps]
class OrderStatus extends Model
{
    /** @var array<string, int>|null code => id, read once. */
    private static ?array $ids = null;

    public static function idFor(string $code): int
    {
        return (int) (self::ids()[$code] ?? 0);
    }

    public static function codeFor(?int $id): ?string
    {
        if ($id === null) {
            return null;
        }
        $code = array_search($id, self::ids(), true);

        return $code === false ? null : (string) $code;
    }

    /** @return array<string, int> */
    private static function ids(): array
    {
        if (self::$ids === null || self::$ids === []) {
            self::$ids = static::query()->pluck('id', 'code')->map(fn ($id) => (int) $id)->all();
        }

        return self::$ids;
    }

    /** Forgets the cached ids, for tests that re-seed the table. */
    public static function flushCache(): void
    {
        self::$ids = null;
    }
}
