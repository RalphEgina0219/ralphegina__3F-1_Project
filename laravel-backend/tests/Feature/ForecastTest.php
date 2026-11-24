<?php

describe('demand forecast', function () {
    it('says there is not enough history instead of guessing', function () {
        $response = $this->asStaff()->getJson('/api/v1/analytics/forecast')->assertOk()
            ->assertJsonPath('data.status', 'insufficient_data')
            ->assertJsonPath('data.training.min_days', 14)
            ->assertJsonPath('data.targets', [])
            ->assertJsonPath('data.horizon.days', 7);
        expect($response->json('data.horizon.from'))->toBe(now('Asia/Manila')->toDateString());
    });

    it('forecasts orders, kilos and soap from 8 weeks of demo history', function () {
        $this->useDemoData();
        $data = $this->asStaff()->getJson('/api/v1/analytics/forecast')->assertOk()->json('data');

        expect($data['status'])->toBe('ready');
        expect($data['training']['days'])->toBe(56);
        expect($data['training']['to'])->toBe(now('Asia/Manila')->subDay()->toDateString());
        expect(array_column($data['targets'], 'key'))->toBe(['orders', 'kilos']);

        foreach ($data['targets'] as $target) {
            expect($target['points'])->toHaveCount(56 + 7);
            $future = array_slice($target['points'], 56);
            expect(array_column($future, 'actual'))->each->toBeNull();
            foreach ($future as $point) {
                expect($point['low'])->toBeLessThanOrEqual($point['predicted']);
                expect($point['high'])->toBeGreaterThanOrEqual($point['predicted']);
            }
            // The demo shop is busier on weekends and growing: the model should learn both.
            $coefficients = array_column($target['coefficients'], 'value', 'name');
            expect($coefficients['Saturday'])->toBeGreaterThan(0);
            expect($coefficients['trend (per week)'])->toBeGreaterThan(0);
            expect($target['evaluation']['mae'])->toBeLessThan($target['evaluation']['baseline_mae'] * 1.5);
        }

        expect($data['soap'])->not->toBeEmpty();
        foreach ($data['soap'] as $soap) {
            expect($soap['needed'])->toBeGreaterThan(0);
            expect($soap['short_by'])->toEqualWithDelta(max(0, $soap['needed'] - $soap['on_hand']), 0.0011);
        }
    });

    it('is sent to staff too: it carries no peso field', function () {
        $this->useDemoData();
        $json = $this->asStaff('kevin.m')->getJson('/api/v1/analytics/forecast')->assertOk()->getContent();
        expect($json)->not->toContain('cents');
    });

    it('needs a signed-in user', function () {
        $this->asGuest()->getJson('/api/v1/analytics/forecast')->assertUnauthorized();
    });
});
