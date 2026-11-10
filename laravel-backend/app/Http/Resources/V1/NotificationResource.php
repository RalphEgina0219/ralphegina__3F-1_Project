<?php

namespace App\Http\Resources\V1;

use App\Models\Notification;
use Illuminate\Http\Request;

/**
 * An in-app notice: a staff one (ready for pickup, low stock), or a customer's own, which also
 * names the order by its number (never by an internal id in a link).
 *
 * @mixin Notification
 */
class NotificationResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        $forCustomer = $this->recipient_type === 'customer';

        return [
            'type' => 'notification',
            'id' => $this->id,
            'attributes' => [
                'type' => $this->type,
                'message' => $this->message,
                'sentAt' => $this->iso($this->sent_at),
                'readAt' => $this->iso($this->read_at),
                $this->mergeWhen(! $forCustomer, fn () => [
                    'channel' => $this->channel,
                    'status' => $this->status,
                ]),
                $this->mergeWhen($forCustomer, fn () => [
                    'orderNumber' => $this->order?->order_number ?? '',
                ]),
            ],
            'relationships' => [
                'order' => $this->ref('order', $this->order_id),
                $this->mergeWhen($forCustomer, fn () => [
                    'customer' => $this->ref('customer', $this->customer_id),
                ]),
            ],
        ];
    }
}
