<?php

use Illuminate\Support\Facades\DB;

describe('health check (public)', function () {
    it('answers OK with a database check and no data, without a token', function () {
        $response = $this->asGuest()->getJson('/api/v1/health');

        $response->assertOk()
            ->assertExactJson([
                'data' => ['status' => 'ok', 'database' => 'ok'],
                'message' => 'OK',
                'status' => 200,
            ]);
    });

    it('answers 503 in the standard error format when the database cannot be reached', function () {
        DB::partialMock()->shouldReceive('select')->once()->andThrow(new RuntimeException('Connection refused'));

        $response = $this->asGuest()->getJson('/api/v1/health');

        $response->assertStatus(503)
            ->assertExactJson(['errors' => [
                ['status' => 503, 'message' => 'The database is not reachable.', 'source' => 'database'],
            ]]);
    });
});
