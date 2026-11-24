<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BalanceController;
use App\Http\Controllers\Api\V1\BarangayController;
use App\Http\Controllers\Api\V1\BasketController;
use App\Http\Controllers\Api\V1\BrandingController;
use App\Http\Controllers\Api\V1\CustomerAccountController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\CustomerOrdersController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\InventoryItemController;
use App\Http\Controllers\Api\V1\InventoryMovementController;
use App\Http\Controllers\Api\V1\InventoryUnitController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\OrderPaymentController;
use App\Http\Controllers\Api\V1\OrderStatusController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\Portal\CustomerAuthController;
use App\Http\Controllers\Api\V1\Portal\PortalAccountController;
use App\Http\Controllers\Api\V1\Portal\PortalNotificationController;
use App\Http\Controllers\Api\V1\Portal\PortalOrderController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\RolePermissionController;
use App\Http\Controllers\Api\V1\ScanController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\ShopSettingController;
use App\Http\Controllers\Api\V1\StockRuleController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\WashTypeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Version 1 of the LaundryFlow API: every URL starts with /api/v1 (course L7)
|--------------------------------------------------------------------------
|
| PUT replaces a whole resource (replace()) and PATCH updates the fields sent (update()), so they
| are registered by hand next to each apiResource (course L17, L18, L23). Orders, payments,
| baskets, history and audit rows have no DELETE route: they are never deleted.
|
*/

// Public routes: no token needed ---------------------------------------------------------------

// For Docker's health check and the dev server's startup check: "OK" plus a database check.
Route::get('health', [HealthController::class, 'show'])->name('health');

// The shop's name, logo, colors and labels: the login page and the customer portal need them before sign-in.
Route::get('branding', [BrandingController::class, 'show'])->name('branding.show');

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->name('login');
    // Outside the auth group so that an expired token can still be exchanged (JWT_REFRESH_TTL).
    Route::post('refresh', [AuthController::class, 'refresh'])->middleware('throttle:token-refresh')->name('refresh');
});

Route::prefix('customer')->name('customer.')->group(function () {
    Route::get('barangays', [BarangayController::class, 'index'])->name('barangays.index');

    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('register', [CustomerAuthController::class, 'register'])->middleware('throttle:customer-register')->name('register');
        Route::post('login', [CustomerAuthController::class, 'login'])->name('login');
        Route::post('refresh', [CustomerAuthController::class, 'refresh'])->middleware('throttle:token-refresh')->name('refresh');
    });
});

// Staff routes: the auth:api guard rejects requests without a valid staff token (401) ---------

Route::middleware(['auth:api', 'account.usable:api'])->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('me', [AuthController::class, 'me'])->name('me');
        Route::put('password', [AuthController::class, 'password'])->name('password');
    });

    // Dashboard and analytics
    Route::get('dashboard/summary', [DashboardController::class, 'summary'])->name('dashboard.summary');
    Route::get('analytics/dashboard', [AnalyticsController::class, 'dashboard'])->name('analytics.dashboard');
    Route::get('analytics/forecast', [AnalyticsController::class, 'forecast'])->name('analytics.forecast');
    Route::get('reports/{kind}', [ReportController::class, 'show'])->name('reports.show');

    // Customers and their accounts
    Route::get('barangays', [BarangayController::class, 'index'])->name('barangays.index');
    Route::apiResource('customers', CustomerController::class)->only(['index', 'store', 'show']);
    Route::put('customers/{customer}', [CustomerController::class, 'replace'])->name('customers.replace');
    Route::patch('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::get('customers/{customer}/orders', [CustomerOrdersController::class, 'index'])->name('customers.orders.index');
    Route::post('customers/{customer}/account', [CustomerAccountController::class, 'store'])->name('customers.account.store');
    Route::patch('customers/{customer}/account', [CustomerAccountController::class, 'update'])->name('customers.account.update');
    Route::post('customers/{customer}/reset-password', [CustomerAccountController::class, 'resetPassword'])->name('customers.account.reset-password');

    // Services
    Route::apiResource('services', ServiceController::class)->only(['index', 'store', 'show']);
    Route::put('services/{service}', [ServiceController::class, 'replace'])->name('services.replace');
    Route::patch('services/{service}', [ServiceController::class, 'update'])->name('services.update');

    // Wash types: staff read them to take orders, the owner edits them (Settings > Pricing & Usage)
    Route::apiResource('wash-types', WashTypeController::class)->only(['index', 'store', 'show'])->parameters(['wash-types' => 'washType']);
    Route::put('wash-types/{washType}', [WashTypeController::class, 'replace'])->name('wash-types.replace');
    Route::patch('wash-types/{washType}', [WashTypeController::class, 'update'])->name('wash-types.update');

    // Baskets and scanning. "available" is registered before {basket} so it is not read as an id.
    Route::get('baskets/available', [BasketController::class, 'available'])->name('baskets.available');
    Route::apiResource('baskets', BasketController::class)->only(['index', 'store', 'show']);
    Route::put('baskets/{basket}', [BasketController::class, 'replace'])->name('baskets.replace');
    Route::patch('baskets/{basket}', [BasketController::class, 'update'])->name('baskets.update');
    Route::post('baskets/{basket}/retire', [BasketController::class, 'retire'])->name('baskets.retire');
    Route::get('baskets/{basket}/history', [BasketController::class, 'history'])->name('baskets.history');
    Route::get('scan/{code}', [ScanController::class, 'show'])->where('code', '.*')->middleware('throttle:scan')->name('scan.show');

    // Orders, status and payments
    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);
    Route::put('orders/{order}', [OrderController::class, 'replace'])->name('orders.replace');
    Route::patch('orders/{order}', [OrderController::class, 'update'])->name('orders.update');
    Route::post('orders/{order}/status', [OrderStatusController::class, 'store'])->name('orders.status.store');
    Route::post('orders/{order}/payments', [OrderPaymentController::class, 'store'])->name('orders.payments.store');
    Route::get('payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::get('payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
    Route::post('payments/{payment}/void', [PaymentController::class, 'void'])->name('payments.void');
    Route::get('balances', [BalanceController::class, 'index'])->name('balances.index');

    // Inventory
    Route::get('inventory/units', [InventoryUnitController::class, 'index'])->name('inventory.units.index');
    Route::get('inventory/items', [InventoryItemController::class, 'index'])->name('inventory.items.index');
    Route::post('inventory/items', [InventoryItemController::class, 'store'])->name('inventory.items.store');
    Route::get('inventory/items/{item}', [InventoryItemController::class, 'show'])->name('inventory.items.show');
    Route::put('inventory/items/{item}', [InventoryItemController::class, 'replace'])->name('inventory.items.replace');
    Route::patch('inventory/items/{item}', [InventoryItemController::class, 'update'])->name('inventory.items.update');
    Route::get('inventory/movements', [InventoryMovementController::class, 'index'])->name('inventory.movements.index');
    Route::post('inventory/movements', [InventoryMovementController::class, 'store'])->name('inventory.movements.store');

    // Staff users, permissions, settings and the activity log (owner)
    Route::apiResource('users', UserController::class)->only(['index', 'store', 'show']);
    Route::put('users/{user}', [UserController::class, 'replace'])->name('users.replace');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::post('users/{user}/disable', [UserController::class, 'disable'])->name('users.disable');
    Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('roles/permissions', [RolePermissionController::class, 'index'])->name('roles.permissions.index');
    Route::put('roles/staff/permissions', [RolePermissionController::class, 'replace'])->name('roles.permissions.replace');
    Route::get('settings/shop', [ShopSettingController::class, 'show'])->name('settings.shop.show');
    Route::put('settings/shop', [ShopSettingController::class, 'replace'])->name('settings.shop.replace');
    Route::put('settings/stock-rule', [StockRuleController::class, 'replace'])->name('settings.stock-rule.replace');
    Route::get('settings/branding', [BrandingController::class, 'edit'])->name('settings.branding.edit');
    Route::put('settings/branding', [BrandingController::class, 'update'])->name('settings.branding.update');
    Route::post('settings/branding/reset', [BrandingController::class, 'reset'])->name('settings.branding.reset');
    Route::post('settings/branding/{kind}', [BrandingController::class, 'upload'])->whereIn('kind', ['logo', 'logo-dark', 'icon'])->name('settings.branding.upload');
    Route::delete('settings/branding/{kind}', [BrandingController::class, 'remove'])->whereIn('kind', ['logo', 'logo-dark', 'icon'])->name('settings.branding.remove');
    Route::put('settings/setup-checklist', [BrandingController::class, 'checklist'])->name('settings.setup-checklist');
    Route::get('activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');

    // Staff notifications
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
});

// Customer portal: the auth:customer guard. Every query is scoped to the signed-in customer -----

Route::prefix('customer')->name('customer.')->middleware(['auth:customer', 'account.usable:customer'])->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::get('me', [CustomerAuthController::class, 'me'])->name('me');
        Route::post('logout', [CustomerAuthController::class, 'logout'])->name('logout');
    });

    Route::patch('account', [PortalAccountController::class, 'update'])->name('account.update');
    Route::put('account/password', [CustomerAuthController::class, 'password'])->name('account.password');

    Route::get('orders', [PortalOrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{orderNumber}', [PortalOrderController::class, 'show'])->name('orders.show');

    Route::get('notifications', [PortalNotificationController::class, 'index'])->name('notifications.index');
    // whereNumber: anything but an id is 404, never a TypeError (500) in read(int).
    Route::post('notifications/{notification}/read', [PortalNotificationController::class, 'read'])->whereNumber('notification')->name('notifications.read');
});
