<?php

namespace App\Support;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Gap-free, race-free numbers. Each call must run inside the caller's transaction: the sequence
 * row stays locked (SELECT … FOR UPDATE) until it commits, so two counters can never receive the
 * same number, and a rolled-back order gives its number back.
 */
final class Sequences
{
    /**
     * Locks the day's order sequence without drawing a number. CreateOrder calls it first, so
     * orders taken in on the same day pass through their transaction one at a time: every other
     * lock (baskets, the gaps of the order_baskets index) is then taken in the same order, and
     * simultaneous orders can no longer deadlock each other.
     */
    public static function lockOrderDay(CarbonInterface $at): void
    {
        self::lockRow('order_sequences', 'sequence_date', $at->setTimezone('Asia/Manila')->format('Y-m-d'), ['last_number' => 0]);
    }

    /** LF-YYMMDD-NNNN, numbered per Manila day. */
    public static function nextOrderNumber(CarbonInterface $at): string
    {
        $day = $at->setTimezone('Asia/Manila')->format('Y-m-d');

        $row = self::lockRow('order_sequences', 'sequence_date', $day, ['last_number' => 0]);
        $next = (int) $row->last_number + 1;
        DB::table('order_sequences')->where('sequence_date', $day)->update(['last_number' => $next]);

        return 'LF-'.$at->setTimezone('Asia/Manila')->format('ymd').'-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    /** OR-000201, OR-000202, … the official receipt number of a payment. */
    public static function nextReceiptNumber(): string
    {
        $row = self::lockRow('receipt_sequences', 'id', 1, ['last_number' => 200]);
        $next = (int) $row->last_number + 1;
        DB::table('receipt_sequences')->where('id', 1)->update(['last_number' => $next]);

        return 'OR-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Locks a sequence row (SELECT … FOR UPDATE), creating it the first time.
     *
     * The row is locked first and inserted only when it is missing. An INSERT IGNORE on every call
     * would take a shared lock on the existing row, and two counters that both hold it and then
     * ask for the exclusive lock deadlock each other; with 20 simultaneous orders that happened on
     * every run.
     */
    private static function lockRow(string $table, string $key, mixed $value, array $defaults): object
    {
        $row = DB::table($table)->where($key, $value)->lockForUpdate()->first();
        if ($row === null) {
            DB::table($table)->insertOrIgnore([$key => $value] + $defaults);
            $row = DB::table($table)->where($key, $value)->lockForUpdate()->first();
        }

        return $row;
    }
}
