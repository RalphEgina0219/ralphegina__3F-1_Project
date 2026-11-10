<?php

use App\Models\CustomerAccount;
use App\Models\User;

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | Every API request is authenticated with the JWT guard by default (course L8).
    |
    */

    'defaults' => [
        'guard' => 'api',
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Two separate account types, each with its own JWT guard:
    |  - api:      staff (users), signs in with a username
    |  - customer: customers (customer_accounts), signs in with an email
    |
    | jwt.lock_subject is on, so a token only works on the guard whose model issued it: a customer
    | token is rejected by every staff route (401) and the reverse.
    |
    */

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        // Our API guard for staff: reads the Bearer token and loads the user it belongs to.
        'api' => [
            'driver' => 'jwt',
            'provider' => 'users',
        ],

        // The customer portal's guard.
        'customer' => [
            'driver' => 'jwt',
            'provider' => 'customer_accounts',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    */

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => User::class,
        ],

        'customer_accounts' => [
            'driver' => 'eloquent',
            'model' => CustomerAccount::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | Not used: the owner and the counter staff issue temporary passwords instead.
    |
    */

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
