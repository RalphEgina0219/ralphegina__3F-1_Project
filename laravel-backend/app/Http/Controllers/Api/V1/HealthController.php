<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Support\Facades\DB;

/**
 * @group Health
 */
class HealthController extends APIController
{
    /**
     * Check the API
     *
     * Answers 200 when the API runs and its database accepts queries, and 503 when the database
     * cannot be reached. It never returns data from the database. Docker's health check and the
     * frontend's dev server call it.
     *
     * @unauthenticated
     *
     * @response 200 {"data": {"status": "ok", "database": "ok"}, "message": "OK", "status": 200}
     * @response 503 {"errors": [{"status": 503, "message": "The database is not reachable.", "source": "database"}]}
     */
    public function show()
    {
        // rescue() turns a refused connection into false; the details stay out of the answer.
        $databaseIsUp = rescue(fn () => DB::select('select 1') !== [], false, report: false);

        if (! $databaseIsUp) {
            return $this->error([
                ['status' => 503, 'message' => 'The database is not reachable.', 'source' => 'database'],
            ]);
        }

        return $this->ok('OK', ['status' => 'ok', 'database' => 'ok']);
    }
}
