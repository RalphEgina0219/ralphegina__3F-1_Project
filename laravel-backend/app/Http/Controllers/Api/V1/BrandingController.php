<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\V1\SaveBranding;
use App\Http\Requests\Api\V1\UpdateBrandingRequest;
use App\Models\ShopSetting;
use App\Support\Branding;
use App\Support\ImageTools;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * @group Branding
 *
 * White-label branding: the shop's name, logo, colors, labels and options. The public endpoint feeds
 * every screen before sign-in; the owner edits them in Settings > Branding & Appearance.
 */
class BrandingController extends APIController
{
    /**
     * Public branding
     *
     * No sign-in needed (the login page and the customer portal read it first). Nothing private is in
     * it; the contact email only when the owner chose to show it. Sends an ETag; browsers revalidate it
     * every time (an unchanged answer is a tiny 304), so a saved change shows at once.
     *
     * @unauthenticated
     */
    public function show(Request $request): Response|JsonResponse
    {
        $payload = Branding::publicPayload();
        $response = response()->json(['data' => ['type' => 'branding', 'id' => 1, 'attributes' => $payload]]);
        $response->setEtag($payload['version']);
        $response->headers->set('Cache-Control', 'public, max-age=0, must-revalidate');
        $response->isNotModified($request);

        return $response;
    }

    /** Branding for editing (owner): the public payload plus the private fields and the setup checklist. */
    public function edit(): JsonResponse
    {
        $settings = ShopSetting::current();
        if (! $this->isAble('view', $settings)) {
            return $this->notAuthorized('You are not authorized to view the branding settings.');
        }

        return $this->resource($settings);
    }

    /**
     * Update the branding
     *
     * Only the fields sent change. Colors are #RRGGBB and must keep button text readable; status
     * labels are display names only (the codes never change); at least one way to pay stays on.
     */
    public function update(UpdateBrandingRequest $request, SaveBranding $save): JsonResponse
    {
        if (! $this->isAble('replace', ShopSetting::current())) {
            return $this->notAuthorized('You are not authorized to update the branding.');
        }

        return $this->resource($save->update($request->brandingAttributes(), $request->user()));
    }

    /**
     * Upload the logo, the dark-mode logo or the app icon
     *
     * Multipart field `file`: PNG, JPG or WebP (no SVG), up to 2 MB, at least 128 px on the short side
     * (the icon: square, at least 512 px). The server re-encodes it, so no metadata survives.
     *
     * @urlParam kind string required logo, logo-dark or icon. Example: logo
     */
    public function upload(Request $request, string $kind, SaveBranding $save): JsonResponse
    {
        if (! in_array($kind, ['logo', 'logo-dark', 'icon'], true)) {
            abort(404);
        }
        if (! $this->isAble('replace', ShopSetting::current())) {
            return $this->notAuthorized('You are not authorized to update the branding.');
        }
        $request->validate(['file' => ['required', 'file', 'mimetypes:image/png,image/jpeg,image/webp', 'max:2048']], [
            'file.required' => 'Choose an image.',
            'file.mimetypes' => 'Upload a PNG, JPG or WebP image (SVG is not allowed).',
            'file.max' => 'The image must be 2 MB or smaller.',
            'file.uploaded' => 'The image must be 2 MB or smaller.',
        ]);

        return $this->resource($save->upload($kind, $request->file('file'), $request->user()));
    }

    /** Remove the logo, the dark-mode logo or the app icon */
    public function remove(Request $request, string $kind, SaveBranding $save): JsonResponse
    {
        if (! in_array($kind, ['logo', 'logo-dark', 'icon'], true)) {
            abort(404);
        }
        if (! $this->isAble('replace', ShopSetting::current())) {
            return $this->notAuthorized('You are not authorized to update the branding.');
        }

        return $this->resource($save->remove($kind, $request->user()));
    }

    /** Reset to the LaundryFlow defaults (name, logo, colors, labels, basket and payment options) */
    public function reset(Request $request, SaveBranding $save): JsonResponse
    {
        if (! $this->isAble('replace', ShopSetting::current())) {
            return $this->notAuthorized('You are not authorized to update the branding.');
        }

        return $this->resource($save->reset($request->user()));
    }

    /**
     * Tick a first-login checklist item
     *
     * @bodyParam data.attributes.key string required branding, shop, rates, soaps, staff or labels. Example: rates
     * @bodyParam data.attributes.done boolean required Example: true
     */
    public function checklist(Request $request, SaveBranding $save): JsonResponse
    {
        if (! $this->isAble('replace', ShopSetting::current())) {
            return $this->notAuthorized('You are not authorized to update the setup checklist.');
        }
        $a = $request->validate([
            'data.attributes.key' => ['required', 'in:branding,shop,rates,soaps,staff,labels'],
            'data.attributes.done' => ['required', 'boolean'],
        ])['data']['attributes'];

        return $this->resource($save->checklist($a['key'], (bool) $a['done'], $request->user()));
    }

    /** A logo or icon, served through Laravel so it works without a storage symlink (immutable: the name is a hash). */
    public function file(string $file): Response
    {
        $path = ImageTools::DIR.'/'.basename($file);
        if (! preg_match('/^[a-z0-9-]+-[a-f0-9]{10}\.png$/', basename($file)) || ! Storage::disk(ImageTools::DISK)->exists($path)) {
            abort(404);
        }

        return response(Storage::disk(ImageTools::DISK)->get($path), 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** The web app manifest from the settings: name, colors and the generated icons. Never cached. */
    public function manifest(): JsonResponse
    {
        $b = Branding::publicPayload();
        $icons = $b['iconUrls'];
        $icon = fn (string $key, string $fallback) => $icons[$key] ?? $fallback;
        $manifest = [
            'id' => '/',
            'name' => $b['systemName'].($b['tagline'] ? ' — '.$b['tagline'] : ''),
            'short_name' => $b['shortName'],
            'description' => $b['tagline'] ?: $b['systemName'].' laundry shop management and basket QR tracking.',
            'start_url' => '/',
            'scope' => '/',
            'display' => 'standalone',
            'display_override' => ['standalone', 'minimal-ui'],
            'orientation' => 'any',
            'theme_color' => $b['sidebarColor'],
            'background_color' => '#f3f8fa',
            'lang' => 'en',
            'dir' => 'ltr',
            'categories' => ['business', 'productivity'],
            'icons' => [
                ['src' => $icon('192', '/pwa-192x192.png'), 'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any'],
                ['src' => $icon('512', '/pwa-512x512.png'), 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any'],
                ['src' => $icon('maskable', '/maskable-icon-512x512.png'), 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'],
            ],
            'shortcuts' => [
                ['name' => 'Scan QR', 'short_name' => 'Scan', 'description' => 'Scan a basket label', 'url' => '/scan'],
                ['name' => 'New order', 'short_name' => 'New order', 'description' => 'Record a new laundry order', 'url' => '/orders/new'],
            ],
        ];

        return response()->json($manifest, 200, [
            'Content-Type' => 'application/manifest+json',
            'Cache-Control' => 'no-cache',
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function resource(ShopSetting $settings): JsonResponse
    {
        $payload = Branding::publicPayload($settings) + [
            'contactEmail' => $settings->contact_email,
            'showContactEmail' => (bool) $settings->show_contact_email,
            'hasLogo' => $settings->logo_path !== null,
            'hasLogoDark' => $settings->logo_dark_path !== null,
            'hasIcon' => $settings->icon_path !== null,
            'setupChecklist' => SaveBranding::checklistFor($settings),
        ];

        return response()->json(['data' => ['type' => 'branding', 'id' => 1, 'attributes' => $payload]]);
    }
}
