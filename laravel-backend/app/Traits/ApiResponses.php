<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Reusable helpers that return JSON responses in one consistent format (course L5, L19, L25).
 * Any controller, or the exception handler, can pull them in with "use ApiResponses;".
 */
trait ApiResponses
{
    /**
     * Shortcut for a 200 OK response.
     * Most successful requests only need a message and, optionally, some data.
     */
    protected function ok(string $message, mixed $data = null): JsonResponse
    {
        return $this->success($message, $data, 200);
    }

    /**
     * Generic success response.
     * The status code is sent in the body and as the real HTTP status of the response.
     */
    protected function success(string $message, mixed $data = null, int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'message' => $message,
            'status' => $statusCode,
        ], $statusCode);
    }

    /**
     * Error response. It accepts either:
     *  - a plain message (string), or
     *  - a list of error objects in the standard format
     *    [['status' => 422, 'message' => '...', 'source' => '...'], ...]
     * The real HTTP status always matches the status of the error.
     */
    protected function error(string|array $errors = [], ?int $statusCode = null): JsonResponse
    {
        // A single message becomes one error object, so clients only ever read one format.
        if (is_string($errors)) {
            $status = $statusCode ?? 400;

            return $this->error([
                [
                    'status' => $status,
                    'message' => $errors,
                    'source' => '',
                ],
            ], $status);
        }

        // A list of errors: use the status of the first one unless told otherwise.
        $status = $statusCode ?? ($errors[0]['status'] ?? 500);

        // Guard against invalid HTTP status codes.
        if ($status < 100 || $status > 599) {
            $status = 500;
        }

        return response()->json(['errors' => $errors], $status);
    }

    /**
     * 403 Forbidden: the user is logged in but is not allowed to do this.
     * Uses the standard error format, like every other error.
     */
    protected function notAuthorized(string $message): JsonResponse
    {
        return $this->error([
            [
                'status' => 403,
                'message' => $message,
                'source' => '',
            ],
        ]);
    }

    /** 409 Conflict: the request is fine, but the record's current state does not allow it. */
    protected function conflict(string $message): JsonResponse
    {
        return $this->error([
            [
                'status' => 409,
                'message' => $message,
                'source' => '',
            ],
        ]);
    }
}
