<?php

use App\Exceptions\Handler;
use App\Http\Middleware\EnsureAccountIsUsable;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        // Default API routes are disabled: we register versioned routes in "then" below (L7).
        // api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        // Runs after the other routes are registered
        then: function () {
            // Version 1 of the API: every URL starts with /api/v1
            Route::middleware('api')
                ->prefix('api/v1')
                ->group(base_path('routes/api_v1.php'));

            // Future versions are registered the same way:
            // Route::middleware('api')
            //     ->prefix('api/v2')
            //     ->group(base_path('routes/api_v2.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Disabled accounts are signed out; a pending password change blocks everything else.
        $middleware->alias([
            'account.usable' => EnsureAccountIsUsable::class,
        ]);

        // A Bearer-token API: never redirect a guest to a login page, answer 401 instead.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Always answer with JSON (never an HTML page) for URLs that start with api/
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })
    ->booting(function () {
        // Use our custom handler for every exception (L25)
        app()->singleton(
            ExceptionHandler::class,
            Handler::class
        );
    })
    ->create();
