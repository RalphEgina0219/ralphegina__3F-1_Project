<?php

use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Feature tests run against the laundryflow_test MySQL database (phpunit.xml), refreshed for
| every test and seeded with the reference data (see Tests\TestCase). The unit tests in
| tests/Unit are the frontend's src/lib tests, ported case by case.
|
*/

pest()->extend(TestCase::class)->in('Feature');

// The race tests only talk HTTP to a running server, so they skip the test database entirely.
pest()->extend(Illuminate\Foundation\Testing\TestCase::class)->in('Concurrency');
