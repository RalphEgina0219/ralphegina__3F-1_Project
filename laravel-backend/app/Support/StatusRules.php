<?php

namespace App\Support;

/**
 * Order status rules, ported from react-frontend/src/lib/status.ts (checkTransition) with
 * identical results and messages.
 */
final class StatusRules
{
    public const ORDER = ['received', 'washing', 'drying', 'folding', 'ready_for_pickup', 'released'];

    /** The internal code stays "released"; people only ever see "Completed". */
    public const LABELS = [
        'received' => 'Received',
        'washing' => 'Washing',
        'drying' => 'Drying',
        'folding' => 'Folding',
        'ready_for_pickup' => 'Ready for Pickup',
        'released' => 'Completed',
    ];

    /** The board shows every stage before Completed. */
    public const BOARD = ['received', 'washing', 'drying', 'folding', 'ready_for_pickup'];

    /** How each failed check answers over HTTP: permission 403, missing input 422, state 409. */
    public const HTTP_STATUS = [
        'revert_not_allowed' => 403,
        'revert_reason_required' => 422,
        'already_completed' => 409,
        'same_status' => 409,
        'skip_not_allowed' => 409,
        'balance_due' => 409,
    ];

    public static function index(string $status): int
    {
        $index = array_search($status, self::ORDER, true);

        return $index === false ? -1 : $index;
    }

    public static function label(string $status): string
    {
        // The shop may have renamed a status (Settings > Branding); the codes never change.
        return Branding::statusLabel($status);
    }

    public static function next(string $status): ?string
    {
        return self::ORDER[self::index($status) + 1] ?? null;
    }

    public static function previous(string $status): ?string
    {
        return self::ORDER[self::index($status) - 1] ?? null;
    }

    /** Orders still in the shop: everything before Completed. */
    public static function isActive(string $status): bool
    {
        return $status !== 'released';
    }

    /**
     * The single source of truth for status changes.
     *
     * @return array{ok: true, direction: 'forward'|'revert'}|array{ok: false, code: string, message: string}
     */
    public static function checkTransition(string $from, string $to, string $role, int $balanceCents, ?string $note = null): array
    {
        // A completed transaction is a closed record: its baskets may hold someone else's laundry.
        if ($from === 'released') {
            return self::fail('already_completed', 'This transaction is completed.');
        }

        $distance = self::index($to) - self::index($from);

        if ($distance === 0) {
            return self::fail('same_status', 'The order is already '.self::label($to).'.');
        }

        if ($distance === 1) {
            if ($to === 'released' && $balanceCents > 0) {
                return self::fail('balance_due', 'Settle the balance before completing this order.');
            }

            return ['ok' => true, 'direction' => 'forward'];
        }

        if ($distance > 1) {
            return self::fail(
                'skip_not_allowed',
                'Orders move one stage at a time. Next is '.self::label((string) self::next($from)).'.',
            );
        }

        if ($distance !== -1 || $role !== 'admin') {
            return self::fail('revert_not_allowed', 'Only an administrator can move an order back, and only one stage.');
        }

        if (trim((string) $note) === '') {
            return self::fail('revert_reason_required', 'Give a reason for moving this order back.');
        }

        return ['ok' => true, 'direction' => 'revert'];
    }

    /** @return array{ok: false, code: string, message: string} */
    private static function fail(string $code, string $message): array
    {
        return ['ok' => false, 'code' => $code, 'message' => $message];
    }
}
