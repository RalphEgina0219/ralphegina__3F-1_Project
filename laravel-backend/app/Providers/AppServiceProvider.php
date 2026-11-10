<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Models\Basket;
use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ShopSetting;
use App\Models\User;
use App\Permissions\V1\Abilities;
use App\Policies\V1\AuditLogPolicy;
use App\Policies\V1\BasketPolicy;
use App\Policies\V1\CustomerPolicy;
use App\Policies\V1\InventoryItemPolicy;
use App\Policies\V1\InventoryMovementPolicy;
use App\Policies\V1\NotificationPolicy;
use App\Policies\V1\OrderPolicy;
use App\Policies\V1\PaymentPolicy;
use App\Policies\V1\ServicePolicy;
use App\Policies\V1\ShopSettingPolicy;
use App\Policies\V1\UserPolicy;
use App\Support\Iso;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Dates never change in place, and travel as JavaScript's toISOString() prints them.
        Date::use(CarbonImmutable::class);
        CarbonImmutable::serializeUsing(fn (CarbonImmutable $date) => Iso::format($date));

        // In production every link the API writes (links.self, pagination) is https://.
        URL::forceHttps($this->app->isProduction());

        // Policies live in a versioned folder, so they are registered explicitly (course L19, L23).
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(Service::class, ServicePolicy::class);
        Gate::policy(Basket::class, BasketPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(InventoryItem::class, InventoryItemPolicy::class);
        Gate::policy(InventoryMovement::class, InventoryMovementPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(ShopSetting::class, ShopSettingPolicy::class);
        Gate::policy(AuditLog::class, AuditLogPolicy::class);
        Gate::policy(Notification::class, NotificationPolicy::class);

        // Abilities that are not about one model (the dashboard, reports): a gate per ability code.
        foreach (Abilities::ALL_STAFF as $ability) {
            Gate::define($ability, fn ($user) => $user instanceof User && $user->tokenCan($ability));
        }

        // Resources keep the course's "data" wrapper (L9).
        JsonResource::wrap('data');

        // Registration and the scanner are throttled per IP / per staff member.
        RateLimiter::for('customer-register', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('scan', fn (Request $request) => Limit::perMinute(120)->by(($request->user()?->getAuthIdentifier() ?? 'guest').'|'.$request->ip()));
        RateLimiter::for('token-refresh', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));
    }
}
