<?php

// Ported case by case from react-frontend/src/lib/basket.test.ts.

use App\Support\BasketCodes;

$token = 'AbCdEfGhIjKlMnOpQrStUvWxYz012-_9';

describe('basket numbers', function () {
    it('pads the sequence and reads it back', function () {
        expect(BasketCodes::formatBasketNumber(7))->toBe('BSK-0007');
        expect(BasketCodes::formatBasketNumber(12345))->toBe('BSK-12345');
        expect(BasketCodes::basketSequence('BSK-0030'))->toBe(30);
    });

    it('generates 32 URL-safe characters, never the same twice', function () {
        $tokens = array_map(fn () => BasketCodes::generateToken(), range(1, 200));
        foreach ($tokens as $t) {
            expect($t)->toMatch('/^[A-Za-z0-9_-]{32}$/');
        }
        expect(array_unique($tokens))->toHaveCount(200);
    });
});

describe('parseScanInput', function () use ($token) {
    it('reads a basket label URL from any host', function () use ($token) {
        expect(BasketCodes::parseScanInput("https://shop.example/b/{$token}"))->toBe(['kind' => 'token', 'value' => $token]);
        expect(BasketCodes::parseScanInput("http://192.168.1.5:5173/b/{$token}?x=1"))->toBe(['kind' => 'token', 'value' => $token]);
    });

    it('reads a bare token, a typed basket number and a typed order number', function () use ($token) {
        expect(BasketCodes::parseScanInput($token))->toBe(['kind' => 'token', 'value' => $token]);
        expect(BasketCodes::parseScanInput(' bsk-7 '))->toBe(['kind' => 'basket_number', 'value' => 'BSK-0007']);
        expect(BasketCodes::parseScanInput('BSK-0030'))->toBe(['kind' => 'basket_number', 'value' => 'BSK-0030']);
        expect(BasketCodes::parseScanInput(' lf-261031-0019 '))->toBe(['kind' => 'order_number', 'value' => 'LF-261031-0019']);
    });

    it('rejects anything else, including the retired receipt tracking links', function () use ($token) {
        expect(BasketCodes::parseScanInput(''))->toBeNull();
        expect(BasketCodes::parseScanInput('https://evil.example/login'))->toBeNull();
        expect(BasketCodes::parseScanInput("https://shop.example/track/{$token}"))->toBeNull();
        expect(BasketCodes::parseScanInput('LF-1031-0019'))->toBeNull();
        expect(BasketCodes::parseScanInput("https://shop.example/b/{$token}extra"))->toBeNull();
    });
});
