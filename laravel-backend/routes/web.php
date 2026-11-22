<?php

use App\Http\Controllers\Api\V1\BrandingController;
use Illuminate\Support\Facades\Route;

// The web app manifest and the branding images come from the shop's settings. Laravel serves them
// (public_html/.htaccess sends these paths here), so no storage symlink is needed on shared hosting.
Route::get('/manifest.webmanifest', [BrandingController::class, 'manifest']);
Route::get('/storage/branding/{file}', [BrandingController::class, 'file'])->where('file', '[A-Za-z0-9._-]+');

Route::get('/', function () {
    return view('welcome');
});
