<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\NotificationResource;
use App\Models\Notification;
use App\Support\Audit;

/**
 * @group Notifications
 *
 * The staff bell: orders ready for pickup and low stock.
 */
class NotificationController extends APIController
{
    protected int $perPage = 20;

    /**
     * List staff notifications
     *
     * Newest first. `meta.unread` counts the unread ones.
     */
    public function index()
    {
        if (! $this->isAble('viewAny', Notification::class)) {
            return $this->notAuthorized('You are not authorized to view notifications.');
        }

        $staff = fn () => Notification::query()->where('recipient_type', Notification::STAFF);

        return NotificationResource::collection(
            $staff()->orderByDesc('sent_at')->orderByDesc('id')->paginate($this->perPage())
        )->additional(['meta' => ['unread' => $staff()->whereNull('read_at')->count()]]);
    }

    /** Mark a notification as read */
    public function read(Notification $notification)
    {
        if (! $this->isAble('markRead', $notification)) {
            // A customer's notice answers like a missing one.
            abort(404, 'Notification not found.');
        }

        if ($notification->read_at === null) {
            $notification->forceFill(['read_at' => now()])->save();
            Audit::record(request()->user()->id, 'notification.read', 'notification', $notification->id);
        }

        return new NotificationResource($notification);
    }
}
