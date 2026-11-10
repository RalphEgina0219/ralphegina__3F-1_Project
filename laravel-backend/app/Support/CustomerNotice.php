<?php

namespace App\Support;

/**
 * The wording of a customer's in-app notification when their order reaches a status, ported from
 * react-frontend/src/mocks/messages.ts.
 */
final class CustomerNotice
{
    /** @return array{type: string, message: string} */
    public static function for(string $orderNumber, string $status): array
    {
        return match ($status) {
            'received' => ['type' => 'order_received', 'message' => "Order {$orderNumber} received"],
            'ready_for_pickup' => [
                'type' => 'ready_for_pickup',
                'message' => "Ready for pickup! Order {$orderNumber} is ready at the shop.",
            ],
            'released' => ['type' => 'status_changed', 'message' => "Order {$orderNumber} is completed. Thank you!"],
            default => [
                'type' => 'status_changed',
                'message' => "Order {$orderNumber} is now ".StatusRules::label($status),
            ],
        };
    }

    /** "Maria Santos" -> "maria.santos@example.com": the demo address of each seeded account. */
    public static function demoEmail(string $fullName): string
    {
        $parts = preg_split('/\s+/', trim(preg_replace('/[^a-z\s]/', '', strtolower($fullName))));
        $first = $parts[0] !== '' ? $parts[0] : 'customer';
        $last = implode('', array_slice($parts, 1));

        return ($last !== '' ? "{$first}.{$last}" : $first).'@example.com';
    }
}
