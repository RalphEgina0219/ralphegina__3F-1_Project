# Course conventions: "API Master Class in Laravel"

Source: <https://nameless-wildflower-c553.dgchristian10.workers.dev/>, the course site
"Mastering API with Laravel PHP Framework" (Web Systems). The site is one JavaScript page with
no per-lesson URLs, so every item below cites the lesson as **L<number>**, the lesson's number in
the site's topic list. To open a lesson, open the site and click its title in the left sidebar.
The React tab says "React lessons are coming soon" and has no content.

The LaundryFlow backend in `laravel-backend/` follows every item marked ✅.

## Checklist

### Versions and project setup

| | Convention | Source |
| --- | --- | --- |
| ✅ | Laravel installed with `composer create-project laravel/laravel` (the current release; the code uses Laravel 13 features such as the `#[Fillable]` and `#[Hidden]` model attributes). PHP version not stated: Laravel 13 needs 8.3+. | L2, L6 |
| ✅ | MySQL configured in `.env` (`DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`). | L2 |
| ✅ | `php artisan install:api` creates `routes/api.php` and installs Sanctum, but Sanctum stays **unused**: authentication is JWT. | L3 |
| ✅ | Run the server with `php artisan serve` and test with Postman at `http://127.0.0.1:8000/api/v1`. | Overview, L2 |
| ✅ | Every request sends `Accept: application/json`; requests with a body also send `Content-Type: application/json`. | Overview |
| ✅ | Git: one commit per finished topic, pushed to `main`, with the roadmap's commit message. | L1, L4, Overview |

### API versioning and routes

| | Convention | Source |
| --- | --- | --- |
| ✅ | Version in the URL: `/api/v1/...`. In `bootstrap/app.php`, the default `api:` line is commented out and the `then:` callback registers `routes/api_v1.php` with `Route::middleware('api')->prefix('api/v1')`. | L7 |
| ✅ | `$exceptions->shouldRenderJsonWhen(fn ($r) => $r->is('api/*'))`: API errors are always JSON. | L7 |
| ✅ | All v1 routes live in `routes/api_v1.php`: a public `auth` prefix group (register, login), then a `Route::middleware('auth:api')` group with everything else. | L8 |
| ✅ | Noun-based, predictable URLs (`/products`, `/products/5`). GET = read (200), POST = create (201), PUT = replace (200), PATCH = partial update (200), DELETE = remove (200 with a message). | L6, L15–L18 |
| ✅ | `Route::apiResource(...)->only([...])` / `->except([...])` for the standard routes. PUT and PATCH are registered by hand because PUT maps to `replace()` and PATCH to `update()`. | L7, L17, L18, L23 |
| ✅ | Nested resources with dot notation (`users.products`) and `->scoped()` / `->scopeBindings()`, so a child that is not the parent's answers 404. | L13, L22 |

### Controllers

| | Convention | Source |
| --- | --- | --- |
| ✅ | Controllers in `app/Http/Controllers/Api/V1/`, generated with `make:controller Api/V1/... --api`. | L7 |
| ✅ | Every v1 controller extends `APIController`, which uses the `ApiResponses` and `AuthorizesRequests` traits and provides `include(string $relationship)` and `isAble(string $ability, mixed $target)`. | L11, L15, L19 |
| ✅ | Resource-style method names: `index`, `show`, `store`, `replace` (PUT), `update` (PATCH), `destroy`. Route model binding loads models, so a missing row is a 404 before the controller runs. | L9, L16, L17 |
| ✅ | Write methods follow one pattern: `if ($this->isAble('update', $model)) { ...; return new XResource($model); } return $this->notAuthorized('You are not authorized to update that resource.');` | L19, L20 |
| ✅ | No try/catch in controllers: binding and policy failures go to the exception handler. | L25 |

### Form Requests

| | Convention | Source |
| --- | --- | --- |
| ✅ | Validation lives in Form Requests (`make:request Api/V1/...`); failure returns 422 before the controller runs. | L8, L15 |
| ✅ | A `Base<Model>Request` with `mappedAttributes(array $otherAttributes = [])` that maps JSON:API paths (`data.attributes.x`, `data.relationships.user.data.id`) to columns, returning only keys that were sent (this makes PATCH work). | L15, L18 |
| ✅ | `Store`, `Replace` and `Update` requests extend the base. PUT rules are `required`, PATCH rules are `sometimes`. | L15, L17, L18 |
| ✅ | `authorize()` returns `true`: the policy decides, in the controller. | L15, L19 |
| ✅ | Custom messages in `messages()` with `field.rule` keys. `prepareForValidation()` merges URL values into the input. | L15 |
| ✅ | Granular rules in the request, based on token abilities, deny by default (`size:<own id>`, `prohibited`), lifted only by the broad ability. | L21, L24 |
| ✅ | Rules are null-safe (`$this->user()?->...`) so Scribe can read them, and `bodyParameters()` gives Scribe descriptions and examples. | L26 |
| ✅ | Passwords are hashed in the base request (`bcrypt()`) before they are saved. | L23 |

### API Resources and the JSON response shape

| | Convention | Source |
| --- | --- | --- |
| ✅ | Resources in `app/Http/Resources/V1/`, generated with `make:resource V1/...`. Never return models directly. | L9 |
| ✅ | JSON:API-style item: `type`, `id`, `attributes` (camelCase names, e.g. `createdAt`), `relationships` (`{ name: { data: { type, id }, links: { self } } }`), `includes` and `links.self`. | L9, L10, L11 |
| ✅ | Optional fields with `$this->when()` and `$this->mergeWhen()`, for example a long field hidden on list routes and dates only on certain routes. | L10 |
| ✅ | Optional related data with `?include=a,b`: loaded with `with()` / `load()` only when asked for, and shown in `includes` via `whenLoaded()`. | L11 |
| ✅ | Lists are `XResource::collection($query->paginate())`: 15 per page by default, `?page=`, plus `links` and `meta`. Single items are `new XResource($model)` (wrapped in `data`). | L9 |
| ✅ | Request bodies use the same JSON:API shape: `{ "data": { "attributes": {...}, "relationships": { "user": { "data": { "id": 1 } } } } }`. | L15 |
| ✅ | Non-resource answers use the `ApiResponses` trait: `ok($message, $data)` / `success($message, $data, $status)` → `{ data, message, status }`. | L5 |

### Errors and exceptions

| | Convention | Source |
| --- | --- | --- |
| ✅ | One format for every error: `{ "errors": [ { "status": 422, "message": "...", "source": "data.attributes.product" } ] }`, with the real HTTP status equal to the error's status. | L25 |
| ✅ | `App\Exceptions\Handler` (extends Laravel's handler, uses `ApiResponses`), bound in `bootstrap/app.php` with `->booting(fn () => app()->singleton(ExceptionHandler::class, Handler::class))`. | L25 |
| ✅ | Its map: `ValidationException` → 422, one object per message, `source` = field; `ModelNotFoundException` → 404 "The resource cannot be found.", `source` = model class; `NotFoundHttpException` → 404, `source` = `Route` (or the model); `AuthenticationException` → 401 "Unauthenticated". Anything else → the exception's HTTP status (e.g. 405) or 500, with the file and line only when `APP_DEBUG` is true. | L25 |
| ✅ | `error()` accepts a message or a list of error objects; `notAuthorized($message)` returns a 403 in the standard format. | L19, L25 |
| ✅ | 401 = not logged in or bad token; 403 = logged in but not allowed. | L5 |

### Authentication

| | Convention | Source |
| --- | --- | --- |
| ✅ | JWT with `php-open-source-saver/jwt-auth`: `vendor:publish` the config, `php artisan jwt:secret` (`JWT_SECRET`), `JWT_TTL` (default 60 minutes), blacklist enabled. | L8 |
| ✅ | `config/auth.php`: the default guard is `api`, which uses the `jwt` driver. The model implements `JWTSubject` (`getJWTIdentifier`, `getJWTCustomClaims`). | L8 |
| ✅ | `AuthController` actions: `register`, `login` (401 "Invalid credentials" on a bad password), `me`, `refresh` (blacklists the old token), `logout` (blacklists the token). | L8 |
| ✅ | The token answer is `formatToken()`: `{ access_token, token_type: "bearer", expires_in }`, inside `ok()`. | L8 |
| ✅ | Clients send `Authorization: Bearer <token>`; `auth:api` rejects a missing or revoked token with 401. Log in again after abilities change. | L8, Overview |
| ✅ | Do not add Sanctum's `HasApiTokens` to the model. | L20 |

### Authorization

| | Convention | Source |
| --- | --- | --- |
| ✅ | One Policy per model in `app/Policies/V1/` (`make:policy V1/XPolicy --model=X`), registered explicitly in `AppServiceProvider::boot()` with `Gate::policy()`. | L19, L23 |
| ✅ | Abilities in one final class, `app/Permissions/V1/Abilities.php`: constants for every name, and `getAbilities($user)` decides who gets which. | L20 |
| ✅ | Abilities are written into the JWT as the `abilities` custom claim at login. A custom `tokenCan()` on the model reads the claim; policies call `$user->tokenCan(Abilities::X)`. | L20 |
| ✅ | "own" abilities restrict to records the user owns; broad abilities allow any record. | L20 |
| ✅ | Least privilege: deny by default and grant explicitly; tokens carry only their owner's abilities; only register and login are public. | L24 |

### Filtering, sorting, includes and pagination

| | Convention | Source |
| --- | --- | --- |
| ✅ | `app/Http/Filters/V1/QueryFilter` (abstract base): `apply(Builder)` calls the method named after each query parameter, ignoring `apply`, `__*` and unknown names. | L12 |
| ✅ | One child filter per resource (`ProductFilter`, `AuthorFilter`) with one public method per allowed parameter. | L12, L14 |
| ✅ | A comma means a list or a range (`?status=A,H`, `?createdAt=2026-08-01,2026-08-31`); `*` is a wildcard (`?product=*phone*` → `LIKE %phone%`). | L12 |
| ✅ | `?include=` is whitelisted in the filter (`array_intersect`). | L12 |
| ✅ | `?sort=name`, `?sort=-createdAt`, `?sort=status,product` against a `$sortable` whitelist that maps public names to columns. | L14 |
| ✅ | The model has `scopeFilter(Builder $builder, QueryFilter $filters)`, so controllers write `Model::filter($filters)->paginate()`. | L12, L14 |

### Layers, traits and helpers

| | Convention | Source |
| --- | --- | --- |
| ✅ | `app/Traits/ApiResponses.php` (`make:trait Traits/ApiResponses`): `ok`, `success`, `error`, `notAuthorized`. | L5, L19, L25 |
| — | **Service, action or repository layers: not covered.** The course keeps its small logic in controllers and Form Requests. | — |
| ✅ | Models: `#[Fillable([...])]`, `#[Hidden([...])]`, `HasFactory`, relationships with return types (`BelongsTo`, `HasMany`), `casts()`. | L6, L10, L20 |
| ✅ | Factories (`make:factory`) and `DatabaseSeeder` with `recycle()`; `php artisan migrate:fresh --seed` for a clean database. | L6, L20 |

### Testing and documentation

| | Convention | Source |
| --- | --- | --- |
| — | **Automated tests: not covered.** Every lesson tests by hand in Postman (a "Test in Postman" checklist per step). | all lessons |
| ✅ | Scribe (`composer require --dev knuckleswtf/scribe`, `vendor:publish --tag=scribe-config`): title, description, `auth.enabled = true`, `auth.in = bearer`, `auth.extra_info`. | L26 |
| ✅ | DocBlocks: `@group` per controller, a title line per method, `@queryParam` for the filters, `@unauthenticated` on public routes. | L26 |
| ✅ | `php artisan scribe:generate` → `/docs` (Try It Out), `/docs.postman` (collection), `/docs.openapi`; commit `public/docs` (or `resources/views/scribe`) and `.scribe`. | L26 |

### Naming, folders and deliverables

| | Convention | Source |
| --- | --- | --- |
| ✅ | A `V1` folder under Controllers/Api, Requests/Api, Resources, Filters, Policies and Permissions. | L7–L23, L27 (Appendix A) |
| ✅ | camelCase public names in JSON and in query parameters (`createdAt`, `isManager`); snake_case columns. | L9, L14, L23 |
| ✅ | Deliverables: a documented, versioned, JWT-protected REST API, tested in Postman, with the Scribe docs page and the Postman collection committed, and one pushed commit per topic. | Overview, L26 |

## Conflicts and how they were resolved

The rule: where the course prescribes something, the backend follows the course, and the frontend's
API layer is adapted (`react-frontend/src/lib/api.ts` and the feature `api.ts` files). The exception
is security, privacy and the business rules, which are never weakened.

| # | Topic | Course | Prompt or mock | Resolution |
| --- | --- | --- | --- | --- |
| 1 | Auth mechanism | JWT (`php-open-source-saver/jwt-auth`), Sanctum unused (L3, L8) | Sanctum tokens or SPA cookies | **JWT.** Two JWT guards: `api` (staff, `users`) and `customer` (`customer_accounts`). `lock_subject` and a `guard` claim stop a token of one kind from being accepted by the other guard. The frontend sends `Authorization: Bearer`; the CSRF-cookie call is gone. |
| 2 | Abilities | `resource:action` names in an `abilities` JWT claim, read by `tokenCan()` (L20) | `can(user, ability)` with the codes in `permissions.ts` (`orders.manage`) | Structure as in the course (an `Abilities` class, a claim and `tokenCan()`), with the **frontend's ability codes**, so both sides share one list. `tokenCan()` also re-checks the user's current role and permissions, so revoking a permission takes effect at once instead of when the token expires. A new grant arrives with the next login or refresh (L8: "log in again after any change to abilities"). |
| 3 | Login field | `email` (L8) | Staff sign in with `username` | Staff log in with `username`; customers log in with `email`. Same Form Request and controller pattern. |
| 4 | Public registration | `POST /auth/register` creates a user (L8) | Staff accounts are created by the owner only | No public staff registration (least privilege, L24). The public registration is the customer one: `POST /customer/auth/register`. |
| 5 | Response shape | JSON:API resources, camelCase `attributes`, wrapped in `data` (L9) | snake_case flat DTOs, single resources without a wrapper | **Course shape.** One adapter in `src/lib/api.ts` flattens resources, turns camelCase into snake_case and unwraps `data`, so no component changes. |
| 6 | Error shape | `{ errors: [{ status, message, source }] }` (L25) | `422 { message, errors: { field: [msg] } }` | **Course shape.** The adapter rebuilds `{ message, errors }` from it, mapping `source` (`data.attributes.fullName`) back to form field names (`full_name`). |
| 7 | Request bodies | JSON:API `data.attributes` and `data.relationships` (L15) | Flat snake_case bodies | **Course shape.** The adapter wraps bodies: `*_id` keys become `relationships.<name>.data.id` and `*_ids` become `relationships.<name>.data[]`. |
| 8 | PUT vs PATCH | PUT replaces with every field required; PATCH updates part (L17, L18) | The mock used PUT for partial edits | Both exist where editing exists. The frontend now sends PATCH for edits that send only some fields, and PUT for full replacements (shop settings, the staff permission set). |
| 9 | DELETE | `destroy()` deletes the row (L16, L23) | Orders, payments, baskets, history and audit rows are never deleted | **No DELETE routes** for those. Retiring a basket, disabling a user and voiding a payment are explicit actions (`POST .../retire`, `/disable`, `/void`). |
| 10 | Pagination | `paginate()` at 15 per page (L9) | Per-screen sizes and a `per_page` parameter | `paginate()` with the course's `links` and `meta`. The default per endpoint matches the screens (15 when the mock had none), and an optional `perPage` (1 to 500; the order board needs every active order). |
| 11 | Filters | Parameter-named filter methods, comma lists, `*` wildcards, `createdAt=from,to`, `sort` (L12, L14) | `search`, `from`/`to`, `status` lists, drill-down filters | Every list has a `QueryFilter` child. Date ranges use the course form (`receivedAt=2026-11-01,2026-11-08`, `paidAt=...`); free-text `search` is one more filter method. The feature `api.ts` files translate `from`/`to`. |
| 12 | Authorization point | Policy checked in the controller with `isAble()`; `authorize()` returns true (L19) | "Form Requests for validation and authorization" | **Course.** Every endpoint, reads included, calls `isAble()` against a policy. |
| 13 | Read endpoints | No checks beyond being logged in | Staff vs admin vs customer abilities on every endpoint | Policies also have `viewAny` / `view`, checked in `index` / `show` (L24, deny by default). |
| 14 | Service layer | Not covered | Actions for business operations | `app/Actions/V1/*` for transactional operations; ported pure rules in `app/Support/*`. Controllers stay thin. |
| 15 | Tests | Postman only | Feature and unit tests | Pest 4 (already in the skeleton) for feature and unit tests, plus Scribe's Postman collection. |
| 16 | Analytics payloads | Not covered (resources are for models) | The `AnalyticsEnvelope` contract in `lib/analytics/types.ts` | Dashboard and report documents are computed, not model resources. They come back through `ok()` (`{ data, message, status }`) with the documented snake_case envelope, because their values point at their own keys (table columns name row keys). |
| 17 | Login failure code | 401 "Invalid credentials" (L8) | 422 with a field error | **401**, as in the course. The login pages show `errorMessage()`, so the text still appears. A disabled account is 403. |
| 18 | `me` payload | `ok('User retrieved', $user)` (L8) | `{ user }` / `{ customer }` | `ok('User retrieved', ['user' => new UserResource($user)])`, with the same key as the login answer. |
| 19 | Token lifetime | 60 minutes, refresh blacklists the old token (L8) | A PWA that stays signed in | Kept. The frontend calls `POST /auth/refresh` (or `/customer/auth/refresh`) once on a 401 and retries the request before it signs out. |
| 20 | Seed size | — | Prompt: "30 baskets (2 retired)"; `mocks/seed.ts` and the README: 70 baskets (2 retired) | Port `seed.ts` as it is (70 baskets, BSK-0029 and BSK-0030 retired), so the Laravel demo shows the same charts and the frontend tests keep their numbers. |
