<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Turns Scribe's Postman collection into one that runs against a freshly seeded database with no
 * setup: every request signs itself in first. Run it after `php artisan scribe:generate`.
 *
 * - Collection variables: baseUrl and the demo accounts (liza.ramos, maria.santos@example.com).
 * - Staff folders use {{token}}, the customer portal folders {{customerToken}}.
 * - A collection pre-request script logs in with those variables whenever the token for the
 *   request's side is missing, and stores the new token. The "Log in" requests store theirs too,
 *   and "Log out" forgets it, so the next request signs in again.
 */
#[Signature('docs:postman {--base-url=http://laundryflow.test : The baseUrl the collection starts with}')]
#[Description('Write docs/api/laundryflow.postman_collection.json (with the login-token script) and docs/api/laundryflow.openapi.yaml from Scribe\'s output')]
class PostmanCollection extends Command
{
    private const CUSTOMER_FOLDERS = ['Customer portal', 'Customer portal: authentication'];

    /** The variable each path id uses, by the path segment before it. */
    private const PATH_VARIABLES = [
        'baskets' => 'basket', 'customers' => 'customer', 'items' => 'item', 'notifications' => 'notification',
        'orders' => 'order', 'payments' => 'payment', 'services' => 'service', 'users' => 'user',
        'reports' => 'kind', 'scan' => 'code', 'wash-types' => 'washType', 'branding' => 'brandingFile',
    ];

    /** Records of the fresh seed. user 3 is aira.d, so disabling or resetting never locks the owner out. */
    private const ID_DEFAULTS = [
        'basket' => '1', 'customer' => '1', 'item' => '1', 'notification' => '1', 'order' => '1',
        'payment' => '1', 'service' => '1', 'user' => '3', 'kind' => 'sales', 'code' => 'BSK-0001',
        'availableBasket' => '1', 'orderNumber' => '', 'customerNotification' => '1', 'washType' => '1', 'brandingFile' => 'logo',
    ];

    /** List requests that remember a real id for the requests after them: path => [variable, JS expression]. */
    private const CAPTURES = [
        'api/v1/baskets/available' => ['availableBasket', 'body.data[0].id'],
        'api/v1/orders' => ['order', 'body.data[0].id'],
        'api/v1/payments' => ['payment', 'body.data[0].id'],
        'api/v1/notifications' => ['notification', 'body.data[0].id'],
        'api/v1/customer/orders' => ['orderNumber', 'body.data[0].attributes.orderNumber'],
        'api/v1/customer/notifications' => ['customerNotification', 'body.data[0].id'],
    ];

    /** The routes that take no token. */
    private const PUBLIC_PATHS = ['api/v1/auth/login', 'api/v1/customer/auth/login', 'api/v1/customer/auth/register', 'api/v1/customer/barangays'];

    public function handle(): int
    {
        $source = storage_path('app/private/scribe/collection.json');
        if (! File::exists($source)) {
            $this->error('Run php artisan scribe:generate first.');

            return self::FAILURE;
        }

        $collection = json_decode(File::get($source), true, flags: JSON_THROW_ON_ERROR);
        $collection['variable'] = [
            ['key' => 'baseUrl', 'value' => $this->option('base-url'), 'type' => 'string'],
            ['key' => 'staffUsername', 'value' => 'liza.ramos', 'type' => 'string'],
            ['key' => 'staffPassword', 'value' => 'password123', 'type' => 'string'],
            ['key' => 'customerEmail', 'value' => 'maria.santos@example.com', 'type' => 'string'],
            ['key' => 'customerPassword', 'value' => 'password123', 'type' => 'string'],
            ['key' => 'token', 'value' => '', 'type' => 'string'],
            ['key' => 'customerToken', 'value' => '', 'type' => 'string'],
        ];
        // Path ids: a record that exists in the fresh seed, replaced by the list requests' scripts.
        foreach (self::ID_DEFAULTS as $key => $value) {
            $collection['variable'][] = ['key' => $key, 'value' => $value, 'type' => 'string'];
        }
        $collection['auth'] = $this->bearer('token');
        $collection['event'] = [['listen' => 'prerequest', 'script' => ['type' => 'text/javascript', 'exec' => $this->signInScript()]]];

        foreach ($collection['item'] as &$folder) {
            $customer = in_array($folder['name'], self::CUSTOMER_FOLDERS, true);
            $folder['auth'] = $this->bearer($customer ? 'customerToken' : 'token');
            foreach ($folder['item'] as &$request) {
                $this->finishRequest($request, $customer);
            }
        }
        unset($folder, $request);

        $target = base_path('../docs/api');
        File::ensureDirectoryExists($target);
        File::put("{$target}/laundryflow.postman_collection.json", json_encode($collection, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");
        File::copy(storage_path('app/private/scribe/openapi.yaml'), "{$target}/laundryflow.openapi.yaml");

        $this->info('Wrote docs/api/laundryflow.postman_collection.json and docs/api/laundryflow.openapi.yaml.');

        return self::SUCCESS;
    }

    private function bearer(string $variable): array
    {
        return ['type' => 'bearer', 'bearer' => [['key' => 'token', 'value' => '{{'.$variable.'}}', 'type' => 'string']]];
    }

    /**
     * One request: named path variables, the right token, real ids, valid bodies, and sign-in
     * requests that use the account variables and remember or forget the token.
     */
    private function finishRequest(array &$request, bool $customer): void
    {
        $this->namePathVariables($request['request'], $customer);
        $path = $this->path($request['request']);
        $method = $request['request']['method'];

        // Scribe marks a route @unauthenticated per controller; only the public routes stay tokenless.
        if (in_array($path, self::PUBLIC_PATHS, true)) {
            $request['request']['auth'] = ['type' => 'noauth'];
        } else {
            unset($request['request']['auth']);
        }

        $url = $request['request']['url']['raw'] ?? '';
        $tokenVariable = $customer ? 'customerToken' : 'token';
        $isLogin = str_ends_with($url, '/auth/login');
        $isLogout = str_ends_with($url, '/auth/logout');

        $body = $this->validBody("{$method} {$path}");
        if ($body !== null) {
            $request['request']['body'] = ['mode' => 'raw', 'raw' => $body, 'options' => ['raw' => ['language' => 'json']]];
            $request['event'][] = ['listen' => 'prerequest', 'script' => ['type' => 'text/javascript', 'exec' => [
                '// A unique email and phone, and a promised time tomorrow, so the request can run again.',
                "pm.variables.set('unique', String(Date.now()).slice(-7));",
                "pm.variables.set('tomorrow', new Date(Date.now() + 86400000).toISOString());",
            ]]];
        }
        // The order taken in just now is the one the requests after it show, edit, move and pay.
        if ("{$method} {$path}" === 'POST api/v1/orders') {
            $request['event'][] = ['listen' => 'test', 'script' => ['type' => 'text/javascript', 'exec' => [
                'const body = pm.response.json();',
                "if (body.data && body.data.id) pm.collectionVariables.set('order', String(body.data.id));",
            ]]];
        }
        if ($method === 'GET' && isset(self::CAPTURES[$path])) {
            [$variable, $expression] = self::CAPTURES[$path];
            $request['event'][] = ['listen' => 'test', 'script' => ['type' => 'text/javascript', 'exec' => [
                'const body = pm.response.json();',
                "if (body.data && body.data.length) pm.collectionVariables.set('{$variable}', String({$expression}));",
            ]]];
        }

        if ($isLogin) {
            $request['request']['body'] = [
                'mode' => 'raw',
                'raw' => $customer
                    ? "{\n  \"email\": \"{{customerEmail}}\",\n  \"password\": \"{{customerPassword}}\"\n}"
                    : "{\n  \"username\": \"{{staffUsername}}\",\n  \"password\": \"{{staffPassword}}\"\n}",
                'options' => ['raw' => ['language' => 'json']],
            ];
        }
        $test = match (true) {
            $isLogin, str_ends_with($url, '/auth/register'), str_ends_with($url, '/auth/refresh') => [
                'const body = pm.response.json();',
                'if (body.data && body.data.access_token) {',
                "    pm.collectionVariables.set('{$tokenVariable}', body.data.access_token);",
                '}',
            ],
            $isLogout => ["pm.collectionVariables.set('{$tokenVariable}', '');"],
            default => [],
        };
        if ($test !== []) {
            $request['event'][] = ['listen' => 'test', 'script' => ['type' => 'text/javascript', 'exec' => $test]];
        }
    }

    /** api/v1/baskets/:basket, whatever Scribe called the segment. */
    private function path(array $request): string
    {
        $path = $request['url']['path'] ?? '';

        return is_array($path) ? implode('/', $path) : (string) $path;
    }

    /**
     * Scribe names a bound id `:id` or `:basket_id` and gives it a number, which Postman does not
     * substitute. Every id becomes `:basket` (and so on) with the value `{{basket}}`.
     */
    private function namePathVariables(array &$request, bool $customer): void
    {
        $segments = explode('/', $this->path($request));
        $variables = [];
        foreach ($segments as $index => $segment) {
            if (! str_starts_with($segment, ':')) {
                continue;
            }
            $before = $segments[$index - 1] ?? '';
            $name = self::PATH_VARIABLES[$before] ?? ltrim($segment, ':');
            if ($customer && $before === 'orders') {
                $name = 'orderNumber';
            } elseif ($customer && $before === 'notifications') {
                $name = 'customerNotification';
            }
            $segments[$index] = ':'.$name;
            $variables[] = ['key' => $name, 'value' => '{{'.$name.'}}'];
        }

        $path = implode('/', $segments);
        $request['url']['path'] = $path;
        $request['url']['raw'] = '{{baseUrl}}/'.$path.(str_contains($request['url']['raw'] ?? '', '?') ? '?'.explode('?', $request['url']['raw'], 2)[1] : '');
        $request['url']['variable'] = $variables;
    }

    /** Bodies that pass validation on a fresh seed, where Scribe's examples would not. */
    private function validBody(string $route): ?string
    {
        $body = match ($route) {
            'POST api/v1/customers' => ['data' => [
                'attributes' => [
                    'fullName' => 'Juan Dela Cruz', 'contactNumber' => '0917{{unique}}', 'email' => 'juan.{{unique}}@example.com',
                    'streetAddress' => 'Purok 3', 'notes' => 'Prefers unscented conditioner',
                ],
                'relationships' => ['barangay' => ['data' => ['id' => 28]]],
            ]],
            'POST api/v1/orders' => ['data' => [
                'attributes' => [
                    'items' => [['serviceId' => 1, 'weightKg' => 6.5], ['serviceId' => 4, 'quantity' => 6]],
                    'promisedAt' => '{{tomorrow}}', 'notes' => 'Separate white uniforms.',
                    'payment' => ['amountCents' => 20000, 'paymentMethod' => 'cash'],
                ],
                'relationships' => ['customer' => ['data' => ['id' => 1]], 'baskets' => ['data' => [['id' => '{{availableBasket}}']]]],
            ]],
            'PUT api/v1/settings/shop' => ['data' => ['attributes' => [
                'name' => 'LaundryFlow', 'address' => 'Brgy. Poblacion, Bongabong, Oriental Mindoro', 'contactNumber' => '0917 555 0101',
                'openingHours' => 'Open daily 7:00 AM – 7:00 PM', 'receiptFooter' => 'Salamat po!', 'claimPolicyDays' => 30,
            ]]],
            'PUT api/v1/roles/staff/permissions' => ['data' => ['attributes' => ['permissions' => ['payments.record', 'inventory.stock_out']]]],
            'PUT api/v1/customers/:customer' => ['data' => [
                'attributes' => ['fullName' => 'Maria Santos', 'contactNumber' => '0917{{unique}}', 'streetAddress' => null, 'notes' => null],
                'relationships' => ['barangay' => ['data' => ['id' => 28]]],
            ]],
            'PATCH api/v1/customers/:customer' => ['data' => ['attributes' => ['notes' => 'Prefers unscented conditioner']]],
            'PUT api/v1/users/:user' => ['data' => ['attributes' => ['name' => 'Aira Dimaculangan', 'username' => 'aira.d', 'role' => 'staff']]],
            'PATCH api/v1/users/:user' => ['data' => ['attributes' => ['name' => 'Aira Dimaculangan']]],
            'POST api/v1/orders/:order/status' => ['data' => ['attributes' => ['toStatus' => 'washing']]],
            'POST api/v1/orders/:order/payments' => ['data' => ['attributes' => ['amountCents' => 5000, 'paymentMethod' => 'cash']]],
            default => null,
        };

        // {{availableBasket}} is an id: unquote it so the API receives a number.
        return $body === null ? null : str_replace('"{{availableBasket}}"', '{{availableBasket}}', json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    /** Runs before every request: signs in on the request's side when there is no token yet. */
    private function signInScript(): array
    {
        return [
            '// LaundryFlow: sign in automatically (fresh seed: liza.ramos / maria.santos@example.com, password123).',
            'const path = pm.request.url.getPath();',
            'const isPublic = /\\/auth\\/(login|register)$/.test(path) || /\\/customer\\/barangays$/.test(path);',
            'if (!isPublic) {',
            "    const customer = path.includes('/api/v1/customer/');",
            "    const variable = customer ? 'customerToken' : 'token';",
            '    if (!pm.collectionVariables.get(variable)) {',
            '        const body = customer',
            "            ? { email: pm.variables.get('customerEmail'), password: pm.variables.get('customerPassword') }",
            "            : { username: pm.variables.get('staffUsername'), password: pm.variables.get('staffPassword') };",
            '        pm.sendRequest({',
            "            url: pm.variables.get('baseUrl') + (customer ? '/api/v1/customer/auth/login' : '/api/v1/auth/login'),",
            "            method: 'POST',",
            "            header: { 'Accept': 'application/json', 'Content-Type': 'application/json' },",
            "            body: { mode: 'raw', raw: JSON.stringify(body) },",
            '        }, (error, response) => {',
            '            if (error || response.code !== 200) {',
            "                console.error('LaundryFlow sign-in failed: is the database freshly seeded?', error || response.text());",
            '                return;',
            '            }',
            '            pm.collectionVariables.set(variable, response.json().data.access_token);',
            '        });',
            '    }',
            '}',
        ];
    }
}
