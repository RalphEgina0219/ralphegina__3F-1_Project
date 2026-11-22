<?php

namespace App\Support;

use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Branding images with PHP GD (available on shared hosting; nothing needs exec). Every upload is
 * decoded and written again, which drops EXIF and any other metadata, and is stored under a
 * content-hashed name so a browser never shows a stale logo.
 */
final class ImageTools
{
    public const ALLOWED = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp'];

    public const MIN_SHORT_SIDE = 128;

    public const MIN_ICON = 512;

    public const MAX_LOGO_SIDE = 1024;

    public const DISK = 'public';

    public const DIR = 'branding';

    /** The icon sizes generated from the app icon. */
    public const ICONS = ['192' => 192, '512' => 512, 'apple' => 180, 'favicon32' => 32, 'favicon16' => 16];

    /**
     * Decodes an upload after checking its real type (not its extension) and size.
     *
     * @return array{image: GdImage, error: null}|array{image: null, error: string}
     */
    public static function read(UploadedFile $file, int $minShortSide, bool $square = false): array
    {
        if (! function_exists('imagecreatefromstring')) {
            return ['image' => null, 'error' => 'This server cannot process images: the PHP "gd" extension is not turned on. Ask the host to enable it.'];
        }
        $bytes = @file_get_contents($file->getRealPath());
        $info = $bytes === false ? false : @getimagesizefromstring($bytes);
        if ($info === false || ! isset(self::ALLOWED[$info['mime']])) {
            return ['image' => null, 'error' => 'Upload a PNG, JPG or WebP image (SVG is not allowed).'];
        }
        if (min($info[0], $info[1]) < $minShortSide) {
            return ['image' => null, 'error' => "The image must be at least {$minShortSide} px on its short side."];
        }
        if ($square && $info[0] !== $info[1]) {
            return ['image' => null, 'error' => 'The app icon must be square.'];
        }
        $image = @imagecreatefromstring($bytes);
        if (! $image instanceof GdImage) {
            return ['image' => null, 'error' => 'That image could not be read.'];
        }
        imagealphablending($image, false);
        imagesavealpha($image, true);

        return ['image' => $image, 'error' => null];
    }

    /** Scales so the long side is at most $max (never enlarges). */
    public static function limit(GdImage $image, int $max): GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        if (max($w, $h) <= $max) {
            return $image;
        }
        $scale = $max / max($w, $h);

        return self::resample($image, (int) round($w * $scale), (int) round($h * $scale));
    }

    public static function resample(GdImage $image, int $width, int $height): GdImage
    {
        $out = imagecreatetruecolor($width, $height);
        imagealphablending($out, false);
        imagesavealpha($out, true);
        imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
        imagecopyresampled($out, $image, 0, 0, 0, 0, $width, $height, imagesx($image), imagesy($image));

        return $out;
    }

    /** A square canvas of $size with the image fitted inside a margin, on a solid colour or transparent. */
    public static function fitSquare(GdImage $image, int $size, float $fill = 1.0, ?string $background = null): GdImage
    {
        $canvas = imagecreatetruecolor($size, $size);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        if ($background !== null) {
            [$r, $g, $b] = [hexdec(substr($background, 1, 2)), hexdec(substr($background, 3, 2)), hexdec(substr($background, 5, 2))];
            imagefill($canvas, 0, 0, imagecolorallocate($canvas, $r, $g, $b));
        } else {
            imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas, 0, 0, 0, 127));
        }
        $w = imagesx($image);
        $h = imagesy($image);
        $scale = ($size * $fill) / max($w, $h);
        $dw = max(1, (int) round($w * $scale));
        $dh = max(1, (int) round($h * $scale));
        imagealphablending($canvas, true);
        imagecopyresampled($canvas, $image, (int) (($size - $dw) / 2), (int) (($size - $dh) / 2), 0, 0, $dw, $dh, $w, $h);
        imagealphablending($canvas, false);

        return $canvas;
    }

    /** Writes a PNG under a content-hashed name and returns its storage path (e.g. branding/logo-1a2b3c4d.png). */
    public static function store(GdImage $image, string $prefix): string
    {
        ob_start();
        imagepng($image, null, 9);
        $bytes = (string) ob_get_clean();
        $path = self::DIR.'/'.$prefix.'-'.substr(sha1($bytes), 0, 10).'.png';
        Storage::disk(self::DISK)->put($path, $bytes);

        return $path;
    }

    public static function delete(?string $path): void
    {
        if ($path && str_starts_with($path, self::DIR.'/')) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    /**
     * The PWA icons from one source image: 192, 512, the maskable 512 (the icon inside the safe
     * zone, on the primary colour), the 180 apple-touch icon and the 32 and 16 favicons.
     *
     * @return array<string, string> size key => storage path
     */
    public static function icons(GdImage $source, string $primaryColor): array
    {
        $paths = [];
        foreach (self::ICONS as $key => $size) {
            // The apple-touch icon has no transparency on iOS: give it a white tile.
            $paths[$key] = self::store(self::fitSquare($source, $size, $key === 'apple' ? 0.84 : 1.0, $key === 'apple' ? '#ffffff' : null), "icon-{$key}");
        }
        // Maskable: the platform crops it to a circle or rounded square, so the picture stays in the
        // inner 62%, well inside the 80% safe zone, on the primary colour.
        $paths['maskable'] = self::store(self::fitSquare($source, 512, 0.62, $primaryColor), 'icon-maskable');

        return $paths;
    }
}
