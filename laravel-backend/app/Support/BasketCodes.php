<?php

namespace App\Support;

/**
 * Basket numbers, label tokens and scan parsing, ported from react-frontend/src/lib/basket.ts.
 * Basket QR codes are the only QR codes in the system. A label is permanent: its token carries no
 * order or customer data and is never regenerated.
 */
final class BasketCodes
{
    private const TOKEN = '/^[A-Za-z0-9_-]{32}$/';

    private const ORDER_NUMBER = '/^LF-\d{6}-\d{4}$/i';

    private const BASKET_NUMBER = '/^BSK-?(\d{1,6})$/i';

    private const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

    /** BSK-0001, BSK-0002, … */
    public static function formatBasketNumber(int $sequence): string
    {
        return 'BSK-'.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    public static function basketSequence(string $basketNumber): int
    {
        return (int) preg_replace('/^BSK-/i', '', $basketNumber);
    }

    /** 32 URL-safe characters from a cryptographic source (64 symbols: no modulo bias). */
    public static function generateToken(): string
    {
        $bytes = random_bytes(32);
        $token = '';
        for ($i = 0; $i < 32; $i++) {
            $token .= self::TOKEN_ALPHABET[ord($bytes[$i]) % 64];
        }

        return $token;
    }

    /**
     * Reads what a camera or keyboard produced: a label URL, a bare token, a basket number or an
     * order number. Only the token is taken from a URL, so a QR code from elsewhere goes nowhere.
     *
     * @return array{kind: 'token'|'basket_number'|'order_number', value: string}|null
     */
    public static function parseScanInput(string $raw): ?array
    {
        $text = trim($raw);
        if ($text === '') {
            return null;
        }

        if (preg_match(self::ORDER_NUMBER, $text)) {
            return ['kind' => 'order_number', 'value' => strtoupper($text)];
        }

        if (preg_match(self::BASKET_NUMBER, $text, $basket)) {
            return ['kind' => 'basket_number', 'value' => self::formatBasketNumber((int) $basket[1])];
        }

        if (preg_match('~/b/([A-Za-z0-9_-]{32})(?:[/?#]|$)~', $text, $url)) {
            return ['kind' => 'token', 'value' => $url[1]];
        }

        if (preg_match(self::TOKEN, $text)) {
            return ['kind' => 'token', 'value' => $text];
        }

        return null;
    }
}
