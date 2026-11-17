<?php

/*
 * Hostinger front controller (docs/HOSTINGER.md). public_html holds the React build; .htaccess
 * sends /api/* and /up here, and this file boots Laravel from outside the web root, so .env,
 * vendor/ and storage/ can never be downloaded.
 *
 * It is laravel-backend/public/index.php with one change: the backend's folder. The default
 * matches the guide's layout:
 *
 *   domains/<your-domain>/public_html/                 <- this file, index.html, assets/
 *   domains/<your-domain>/laundryflow/laravel-backend/ <- the Laravel app (git clone)
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$backend = dirname(__DIR__).'/laundryflow/laravel-backend';

if (! is_file($backend.'/vendor/autoload.php')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo '{"message":"The API is not installed yet."}';
    exit;
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $backend.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require $backend.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $backend.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
