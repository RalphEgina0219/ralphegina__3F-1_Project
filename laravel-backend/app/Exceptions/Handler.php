<?php

namespace App\Exceptions;

use App\Traits\ApiResponses;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * The single place where every exception becomes JSON (course L25):
 * { "errors": [ { "status": 422, "message": "...", "source": "data.attributes.fullName" } ] }
 *
 * Stack traces never leave the server: the file and line are shown only while APP_DEBUG is true.
 */
class Handler extends ExceptionHandler
{
    // Gives the handler the error() helper from the ApiResponses trait.
    use ApiResponses;

    // Fields never flashed to the session when validation fails.
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    // Which method builds the error list for which exception class.
    protected array $apiHandlers = [
        ValidationException::class => 'handleValidation',
        ModelNotFoundException::class => 'handleModelNotFound',
        AuthenticationException::class => 'handleAuthentication',
        NotFoundHttpException::class => 'handleNotFoundHttp',
        AuthorizationException::class => 'handleAuthorization',
    ];

    // 422: one error object per invalid field message.
    private function handleValidation(ValidationException $exception): array
    {
        $errors = [];

        foreach ($exception->errors() as $key => $messages) {
            foreach ($messages as $message) {
                $errors[] = [
                    'status' => 422,
                    'message' => $message,
                    'source' => $key,
                ];
            }
        }

        return $errors;
    }

    // 404: a model was not found in the database.
    private function handleModelNotFound(ModelNotFoundException $exception): array
    {
        return [
            [
                'status' => 404,
                'message' => 'The resource cannot be found.',
                'source' => $exception->getModel(),
            ],
        ];
    }

    // 404: the URL does not exist (or route model binding failed).
    private function handleNotFoundHttp(NotFoundHttpException $exception): array
    {
        $source = 'Route';
        $message = 'The resource cannot be found.';

        // When binding failed, the original exception tells us which model is missing.
        if ($exception->getPrevious() instanceof ModelNotFoundException) {
            $source = $exception->getPrevious()->getModel();
        } elseif ($exception->getMessage() !== '' && ! str_contains($exception->getMessage(), 'could not be found')) {
            // A deliberate abort(404, '...') from a controller keeps its own message.
            $message = $exception->getMessage();
        }

        return [
            [
                'status' => 404,
                'message' => $message,
                'source' => $source,
            ],
        ];
    }

    // 401: missing, invalid, expired or revoked token.
    private function handleAuthentication(AuthenticationException $exception): array
    {
        return [
            [
                'status' => 401,
                'message' => 'Unauthenticated',
                'source' => '',
            ],
        ];
    }

    // 403: a policy said no (when authorize() is used directly instead of isAble()).
    private function handleAuthorization(AuthorizationException $exception): array
    {
        return [
            [
                'status' => 403,
                'message' => $exception->getMessage() ?: 'This action is unauthorized.',
                'source' => '',
            ],
        ];
    }

    /**
     * Laravel calls this for every exception. Known exceptions use their handler method; anything
     * else becomes a generic error. Non-API pages keep Laravel's default rendering.
     */
    public function render($request, Throwable $exception)
    {
        if (! $request->is('api/*') && ! $request->expectsJson()) {
            return parent::render($request, $exception);
        }

        $className = get_class($exception);

        // A known exception: build its error list with the matching method.
        if (array_key_exists($className, $this->apiHandlers)) {
            $method = $this->apiHandlers[$className];

            return $this->error($this->$method($exception));
        }

        // A bad, expired or blacklisted JWT (for example on /auth/refresh) is a 401 too.
        if ($exception instanceof JWTException) {
            return $this->error($this->handleAuthentication(new AuthenticationException));
        }

        // Anything else: use the exception's own status (for example 405 or 429), or 500.
        $isHttp = $exception instanceof HttpExceptionInterface;
        $status = $isHttp ? $exception->getStatusCode() : 500;

        // Only a crash reveals its file and line, and only while APP_DEBUG is true. A deliberate
        // answer (abort(409, '…'), 405, 429) reads the same in every environment: its location
        // is just the line inside abort().
        $debug = config('app.debug') && ! $isHttp;
        $source = $debug
            ? 'Line '.$exception->getLine().': '.$exception->getFile()
            : '';

        // HTTP exceptions carry a message meant for the client; a crash never shows its message.
        $message = $isHttp
            ? ($exception->getMessage() ?: (Response::$statusTexts[$status] ?? 'Error'))
            : (config('app.debug') ? $exception->getMessage() : 'Server error');

        // The exception's class name is a debugging aid too: with APP_DEBUG off, a crash says
        // only "Server error".
        $response = $this->error([
            array_filter([
                'type' => $debug ? class_basename($className) : null,
                'status' => $status,
                'message' => $message,
                'source' => $source,
            ], fn ($value) => $value !== null),
        ]);

        // Keep Retry-After and similar headers (429).
        if ($isHttp) {
            $response->headers->add($exception->getHeaders());
        }

        return $response;
    }
}
