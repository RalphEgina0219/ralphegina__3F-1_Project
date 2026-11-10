<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\ChangeOrderStatus;
use App\Http\Requests\Api\V1\ChangeStatusRequest;
use App\Http\Resources\V1\OrderResource;
use App\Models\Order;

/**
 * @group Orders
 */
class OrderStatusController extends APIController
{
    /**
     * Move an order to another stage
     *
     * Forward one stage at a time. An admin may go back one stage with a note. Completed needs a
     * zero balance and frees the baskets. 409 for a skip, the same status, a balance due, a completed
     * order or a stale scan; 403 for a move back without orders.revert; 422 for a move back without a note.
     */
    public function store(ChangeStatusRequest $request, Order $order, ChangeOrderStatus $changeStatus)
    {
        if (! $this->isAble('changeStatus', $order)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        $updated = $changeStatus(
            $order,
            (string) $request->input('data.attributes.toStatus'),
            $request->input('data.attributes.note'),
            $request->relationshipId('basket'),
            $request->user(),
            $this->isAble('revert', $order),
        );

        return new OrderResource($updated->loadDetail());
    }
}
