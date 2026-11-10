<?php

namespace App\Http\Resources\V1;

use App\Models\AuditLog;
use App\Support\Money;
use App\Support\StatusRules;
use Illuminate\Http\Request;

/**
 * One audit log row with a readable summary (a port of the frontend mock's summarize()).
 *
 * @mixin AuditLog
 */
class ActivityLogResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return $this->withIncludes([
            'type' => 'activityLog',
            'id' => $this->id,
            'attributes' => [
                'action' => $this->action,
                'auditableType' => $this->auditable_type,
                'auditableId' => $this->auditable_id,
                'summary' => self::summarize($this->action, $this->new_values ?? []),
                // Stored values are returned as they are (snake_case keys).
                'oldValues' => $this->old_values,
                'newValues' => $this->new_values,
                'createdAt' => $this->iso($this->created_at),
            ],
        ], [
            'user' => $this->loadedOne('user', UserResource::class),
        ]);
    }

    /** @param  array<string, mixed>  $v */
    public static function summarize(string $action, array $v): string
    {
        if (isset($v['summary']) && is_string($v['summary'])) {
            return $v['summary'];
        }

        $get = fn (string $key) => isset($v[$key]) && ! is_array($v[$key]) ? (string) $v[$key] : '';

        return match ($action) {
            'auth.login' => 'signed in',
            'auth.logout' => 'signed out',
            'order.created' => "created order {$get('order_number')}",
            'order.updated' => "updated order {$get('order_number')}",
            'order.status_changed' => "changed {$get('order_number')} from ".StatusRules::label($get('from')).' to '.StatusRules::label($get('to')),
            'payment.recorded' => 'recorded payment '.Money::format((int) ($v['amount_cents'] ?? 0))." on {$get('order_number')}",
            'payment.voided' => "voided {$get('receipt_number')} on {$get('order_number')}: {$get('reason')}",
            'customer.created' => "added customer {$get('full_name')}",
            'customer.updated' => "updated customer {$get('full_name')}",
            'customer.registered' => "{$get('full_name')} registered an account online",
            'customer.account_created' => "created the account of {$get('full_name')}",
            'customer.password_reset' => "reset the account password of {$get('full_name')}",
            'customer.account_updated' => (! empty($v['is_active']) ? 'enabled' : 'disabled')." the account of {$get('full_name')}",
            'basket.created' => (int) ($v['count'] ?? 1) === 1 ? "added basket {$get('basket_number')}" : 'added '.(int) $v['count'].' baskets',
            'basket.updated' => "updated basket {$get('basket_number')}",
            'basket.retired' => "retired basket {$get('basket_number')}",
            'service.created' => "added service {$get('name')}",
            'service.updated' => "updated service {$get('name')}",
            'inventory.movement' => "recorded stock {$get('type')} of ".self::number($v['quantity'] ?? 0).($get('item_name') !== '' ? " for {$get('item_name')}" : ''),
            'inventory.item_created' => "added supply item {$get('name')}",
            'inventory.item_updated' => "updated supply item {$get('name')}",
            'user.created' => "added user {$get('username')}",
            'user.updated' => "updated user {$get('username')}",
            'user.disabled' => "disabled user {$get('username')}",
            'user.password_reset' => "reset the password of {$get('username')}",
            'user.password_changed' => 'changed their password',
            'role.permissions_updated' => 'updated staff permissions',
            'settings.updated' => 'updated the shop profile',
            default => $action,
        };
    }

    /** A number as JavaScript prints it: 2, 3.5. */
    private static function number(mixed $value): string
    {
        $float = (float) $value;

        return $float == floor($float) ? (string) (int) $float : rtrim(rtrim(number_format($float, 3, '.', ''), '0'), '.');
    }
}
