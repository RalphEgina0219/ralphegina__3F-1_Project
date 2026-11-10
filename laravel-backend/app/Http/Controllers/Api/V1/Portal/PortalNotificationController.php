<?php

namespace App\Http\Controllers\Api\V1\Portal;

use App\Http\Controllers\Api\V1\APIController;
use App\Http\Resources\V1\NotificationResource;
use App\Models\Notification;

/**
 * @group Customer portal
 */
class PortalNotificationController extends APIController
{
    protected int $perPage = 20;

    /**
     * My notifications
     *
     * The customer's own notices, newest first, each with its order number. `meta.unread` counts the unread ones.
     *
     * @response {"data":[{"type":"notification","id":119,"attributes":{"type":"status_changed","message":"Order LF-261110-0009 is now Washing","sentAt":"2026-11-10T02:54:00.000Z","readAt":null,"orderNumber":"LF-261110-0009"},"relationships":{"order":{"data":{"type":"order","id":1652}},"customer":{"data":{"type":"customer","id":1}}}}],"links":{"first":"http://laundryflow.test/api/v1/customer/notifications?page=1","last":"http://laundryflow.test/api/v1/customer/notifications?page=1","prev":null,"next":null},"meta":{"current_page":1,"last_page":1,"per_page":20,"total":2,"unread":1}}
     */
    public function index()
    {
        $own = fn () => Notification::query()
            ->where('recipient_type', Notification::CUSTOMER)
            ->where('customer_id', auth('customer')->user()->customer_id);

        return NotificationResource::collection(
            $own()->with('order:id,order_number')->orderByDesc('sent_at')->orderByDesc('id')->paginate($this->perPage())
        )->additional(['meta' => ['unread' => $own()->whereNull('read_at')->count()]]);
    }

    /** Mark one of my notifications as read */
    public function read(int $notification)
    {
        $row = Notification::query()
            ->where('recipient_type', Notification::CUSTOMER)
            ->where('customer_id', auth('customer')->user()->customer_id)
            ->with('order:id,order_number')
            ->find($notification);

        if (! $row) {
            abort(404, 'Notification not found.');
        }

        if ($row->read_at === null) {
            $row->forceFill(['read_at' => now()])->save();
        }

        return new NotificationResource($row);
    }
}
