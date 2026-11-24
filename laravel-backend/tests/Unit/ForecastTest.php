<?php

// The demand forecast's regression, held to the same cases as the frontend (shared/forecast-cases.json).

use App\Support\Analytics\Forecast;

$cases = json_decode(file_get_contents(__DIR__.'/../../../shared/forecast-cases.json'), true, 512, JSON_THROW_ON_ERROR);

/** Compares a fitted model with the expected one, to 1e-9. */
function expectForecastModel(array $model, array $expected): void
{
    expect($model['intercept'])->toEqualWithDelta($expected['intercept'], 1e-9);
    expect($model['trend_per_week'])->toEqualWithDelta($expected['trend_per_week'], 1e-9);
    foreach ($expected['weekday'] as $i => $value) {
        expect($model['weekday'][$i])->toEqualWithDelta($value, 1e-9);
    }
    expect($model['residual_sd'])->toEqualWithDelta($expected['residual_sd'], 1e-6);
    expect($model['r2'])->toEqualWithDelta($expected['r2'], 1e-9);
}

describe('solve', function () use ($cases) {
    foreach ($cases['solve'] as $case) {
        it($case['name'], function () use ($case) {
            foreach (Forecast::solve($case['a'], $case['b']) as $i => $value) {
                expect($value)->toEqualWithDelta($case['expected'][$i], 1e-12);
            }
        });
    }

    it('refuses a singular system', function () {
        Forecast::solve([[1, 2], [2, 4]], [1, 2]);
    })->throws(RuntimeException::class);
});

describe('fitModel', function () use ($cases) {
    foreach (['exact', 'ridge', 'short'] as $name) {
        $case = $cases[$name];
        it($case['name'], function () use ($case) {
            $model = Forecast::fitModel($case['points'], (float) $case['lambda']);
            expectForecastModel($model, $case['expected']);
            foreach ($case['predict'] ?? [] as $p) {
                expect(Forecast::predict($model, $p['date']))->toEqualWithDelta($p['expected'], 1e-9);
            }
        });
    }
});

describe('evaluate', function () use ($cases) {
    it('scores the held-back week and the naive guess', function () use ($cases) {
        $evaluation = Forecast::evaluate($cases['ridge']['points']);
        expect($evaluation['mae'])->toEqualWithDelta($cases['ridge']['evaluation']['mae'], 1e-9);
        expect($evaluation['baseline_mae'])->toEqualWithDelta($cases['ridge']['evaluation']['baseline_mae'], 1e-9);
        // The model has to beat "same weekday last week", or it is not worth showing.
        expect($evaluation['mae'])->toBeLessThan($evaluation['baseline_mae']);
    });

    it('holds nothing back on a short history', function () use ($cases) {
        expect(Forecast::evaluate($cases['short']['points']))->toBeNull();
    });
});

it($cases['target']['name'], function () use ($cases) {
    $case = $cases['target'];
    expect(Forecast::forecastTarget($case['key'], $case['points'], $case['horizon']))->toEqual($case['expected']);
});
