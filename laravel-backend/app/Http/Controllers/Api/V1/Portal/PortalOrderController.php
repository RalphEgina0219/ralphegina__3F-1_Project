<?php

namespace App\Http\Controllers\Api\V1\Portal;

use App\Http\Controllers\Api\V1\APIController;
use App\Http\Resources\V1\PortalOrderResource;
use App\Models\CustomerAccount;
use App\Models\Order;
use App\Models\OrderStatus;
use Illuminate\Database\Eloquent\Builder;

/**
 * @group Customer portal
 *
 * The signed-in customer's own orders. Every query is scoped to that customer: another
 * customer's order answers 404, exactly like one that does not exist, so numbers cannot be probed.
 */
class PortalOrderController extends APIController
{
    protected int $perPage = 10;

    /**
     * My orders
     *
     * Newest first. `meta.active` and `meta.completed` count the customer's orders.
     *
     * @queryParam status string active or completed. Example: active
     *
     * @response {"data":[{"type":"portalOrder","id":"LF-261110-0009","attributes":{"orderNumber":"LF-261110-0009","receivedAt":"2026-11-10T01:20:00.000Z","promisedAt":"2026-11-11T02:00:00.000Z","releasedAt":null,"status":"washing","statusLabel":"Washing","totalCents":36750,"paidCents":20000,"balanceCents":16750,"paymentStatus":"partial"},"links":{"self":"http://laundryflow.test/api/v1/customer/orders/LF-261110-0009"},"includes":{"baskets":[{"type":"basket","id":20,"attributes":{"basketNumber":"BSK-0020"}}],"items":[{"type":"orderItem","id":2170,"attributes":{"weightKg":6.5,"quantity":null,"unitPriceCents":3500,"subtotalCents":22750,"serviceName":"Wash-Dry-Fold","pricingType":"per_kg"}}]}}],"links":{"first":"http://laundryflow.test/api/v1/customer/orders?page=1","last":"http://laundryflow.test/api/v1/customer/orders?page=4","prev":null,"next":"http://laundryflow.test/api/v1/customer/orders?page=2"},"meta":{"current_page":1,"last_page":4,"per_page":1,"total":4,"active":1,"completed":3}}
     */
    public function index()
    {
        $released = OrderStatus::idFor('released');
        $own = fn (): Builder => Order::query()->where('customer_id', $this->customerId());

        $query = $own()->withMoney()->with(['baskets', 'items.service', 'washType'])->orderByDesc('received_at')->orderByDesc('id');
        match (request()->query('status')) {
            'active' => $query->where('current_status_id', '!=', $released),
            'completed' => $query->where('current_status_id', $released),
            default => null,
        };

        $active = $own()->where('current_status_id', '!=', $released)->count();

        return PortalOrderResource::collection($query->paginate($this->perPage()))
            ->additional(['meta' => [
                'active' => $active,
                'completed' => $own()->count() - $active,
            ]]);
    }

    /**
     * One of my orders
     *
     * By its order number. No staff names, notes or voided payments. Another customer's order
     * number answers 404, exactly like one that does not exist.
     *
     * @urlParam orderNumber string required Example: LF-261110-0009
     *
     * @response {"data":{"type":"portalOrder","id":"LF-261110-0009","attributes":{"orderNumber":"LF-261110-0009","receivedAt":"2026-11-10T01:20:00.000Z","promisedAt":"2026-11-11T02:00:00.000Z","releasedAt":null,"status":"washing","statusLabel":"Washing","totalCents":36750,"paidCents":20000,"balanceCents":16750,"paymentStatus":"partial","customer":{"fullName":"Maria Santos","contactNumber":"09178452210"},"timeline":[{"status":"received","label":"Received","at":"2026-11-10T01:20:00.000Z"},{"status":"washing","label":"Washing","at":"2026-11-10T02:54:00.000Z"},{"status":"drying","label":"Drying","at":null},{"status":"folding","label":"Folding","at":null},{"status":"ready_for_pickup","label":"Ready for Pickup","at":null},{"status":"released","label":"Completed","at":null}]},"links":{"self":"http://laundryflow.test/api/v1/customer/orders/LF-261110-0009"},"includes":{"baskets":[{"type":"basket","id":20,"attributes":{"basketNumber":"BSK-0020"}}],"items":[{"type":"orderItem","id":2170,"attributes":{"weightKg":6.5,"quantity":null,"unitPriceCents":3500,"subtotalCents":22750,"serviceName":"Wash-Dry-Fold","pricingType":"per_kg"}}],"payments":[{"type":"payment","id":2010,"attributes":{"paidAt":"2026-11-10T01:22:00.000Z","methodLabel":"Cash","amountCents":20000,"referenceNumber":null,"receiptNumber":"OR-002210"}}],"shop":{"type":"shopSettings","id":1,"attributes":{"name":"LaundryFlow","address":"Brgy. Poblacion, Bongabong, Oriental Mindoro"}}}}}
     * @response 404 {"errors":[{"status":404,"message":"The resource cannot be found.","source":"Order"}]}
     */
    public function show(string $orderNumber)
    {
        $order = Order::query()
            ->where('customer_id', $this->customerId())
            ->where('order_number', strtoupper($orderNumber))
            ->withMoney()
            ->with(['baskets', 'items.service', 'washType', 'payments.method', 'statusHistory', 'customer'])
            ->first();

        if (! $order) {
            abort(404, 'Order not found.');
        }

        return new PortalOrderResource($order);
    }

    private function customerId(): int
    {
        /** @var CustomerAccount $account */
        $account = auth('customer')->user();

        return (int) $account->customer_id;
    }
}
