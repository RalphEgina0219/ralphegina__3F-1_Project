<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\Order;

/**
 * Writes in-app notifications, inside the caller's transaction: the staff bell (ready for pickup,
 * low stock) and the customer's own notices about their order.
 */
final class Notifier
{
    public static function staff(string $type, string $message, ?int $orderId = null): Notification
    {
        return Notification::query()->create([
            'recipient_type' => Notification::STAFF,
            'customer_id' => null,
            'order_id' => $orderId,
            'type' => $type,
            'channel' => 'in_app',
            'message' => $message,
            'status' => 'recorded',
            'sent_at' => now(),
        ]);
    }

    /** The customer's notice when their order reaches $status. */
    public static function customer(Order $order, string $status): Notification
    {
        $notice = CustomerNotice::for($order->order_number, $status);

        return Notification::query()->create([
            'recipient_type' => Notification::CUSTOMER,
            'customer_id' => $order->customer_id,
            'order_id' => $order->id,
            'type' => $notice['type'],
            'channel' => 'in_app',
            'message' => $notice['message'],
            'status' => 'recorded',
            'sent_at' => now(),
        ]);
    }
}
