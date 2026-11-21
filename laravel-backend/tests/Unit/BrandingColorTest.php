<?php

// The WCAG colour rules, held to the same cases as the frontend (shared/color-cases.json).

use App\Support\Branding;

$cases = json_decode(file_get_contents(__DIR__.'/../../../shared/color-cases.json'), true, 512, JSON_THROW_ON_ERROR);

describe('contrast', function () use ($cases) {
    foreach ($cases['contrast'] as $case) {
        it("{$case['a']} on {$case['b']} is {$case['ratio']}:1", function () use ($case) {
            expect(Branding::contrast($case['a'], $case['b']))->toEqualWithDelta($case['ratio'], 0.01);
        });
    }
});

describe('button text', function () use ($cases) {
    foreach ($cases['buttonText'] as $case) {
        it("picks {$case['text']} on {$case['color']} and says readable is ".json_encode($case['readable']), function () use ($case) {
            expect(Branding::buttonText($case['color']))->toBe($case['text']);
            expect(Branding::textReadableOn($case['color']))->toBe($case['readable']);
        });
    }
});

it('accepts only #RRGGBB hex', function () {
    expect(Branding::isHex('#0e7490'))->toBeTrue();
    expect(Branding::isHex('0e7490'))->toBeFalse();
    expect(Branding::isHex('#0e749'))->toBeFalse();
    expect(Branding::isHex('red'))->toBeFalse();
});
