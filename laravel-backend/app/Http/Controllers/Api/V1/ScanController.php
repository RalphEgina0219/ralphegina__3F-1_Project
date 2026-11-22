<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\BasketResource;
use App\Http\Resources\V1\OrderResource;
use App\Models\Basket;
use App\Models\Order;
use App\Models\ShopSetting;
use App\Support\BasketCodes;

/**
 * @group Baskets
 */
class ScanController extends APIController
{
    private function notRecognized(): string
    {
        return 'QR not recognized. Scan a '.ShopSetting::current()->system_name.' basket label.';
    }

    /**
     * Look up a scanned or typed code
     *
     * `code` is a basket label URL (…/b/{token}), a bare token, a basket number (BSK-0007) or an
     * order number (LF-261108-0001). A basket answers with its active order (or null when it is
     * available, retired, or its last order is completed); an order number answers with the order.
     *
     * @urlParam code string required The scanned text. Example: BSK-0007
     */
    public function show(string $code)
    {
        if (! $this->isAble('scan', Basket::class)) {
            return $this->notAuthorized('You are not authorized to scan baskets.');
        }

        // Route parameters arrive already decoded.
        $input = BasketCodes::parseScanInput($code);
        if (! $input) {
            abort(404, $this->notRecognized());
        }

        if ($input['kind'] === 'order_number') {
            $order = Order::query()->where('order_number', $input['value'])->first();
            if (! $order) {
                abort(404, "No order matches {$input['value']}.");
            }

            return $this->ok('Order found', ['type' => 'order', 'order' => new OrderResource($order->loadDetail())]);
        }

        $basket = Basket::query()->withUsage()
            ->where($input['kind'] === 'token' ? 'qr_token' : 'basket_number', $input['value'])
            ->first();
        if (! $basket) {
            abort(404, $input['kind'] === 'token' ? $this->notRecognized() : "No basket matches {$input['value']}.");
        }

        $order = $basket->activeAssignment?->order_id
            ? Order::query()->find($basket->activeAssignment->order_id)?->loadDetail()
            : null;

        return $this->ok('Basket found', [
            'type' => 'basket',
            'basket' => new BasketResource($basket),
            'activeOrder' => $order ? new OrderResource($order) : null,
        ]);
    }
}
