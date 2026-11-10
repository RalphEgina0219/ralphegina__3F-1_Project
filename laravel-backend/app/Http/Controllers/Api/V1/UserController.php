<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\BaseUserRequest;
use App\Http\Requests\Api\V1\ReplaceUserRequest;
use App\Http\Requests\Api\V1\StoreUserRequest;
use App\Http\Requests\Api\V1\UpdateUserRequest;
use App\Http\Resources\V1\UserResource;
use App\Models\User;
use App\Support\AccountRules;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;

/**
 * @group Users
 *
 * Staff accounts, managed by the owner (course L23). Users are never deleted: disabling keeps
 * their name on the history they made.
 */
class UserController extends APIController
{
    /** List staff users */
    public function index()
    {
        if (! $this->isAble('viewAny', User::class)) {
            return $this->notAuthorized('You are not authorized to view users.');
        }

        return UserResource::collection(User::query()->with('role')->orderBy('id')->get());
    }

    /** Add a staff user */
    public function store(StoreUserRequest $request)
    {
        if (! $this->isAble('store', User::class)) {
            return $this->notAuthorized('You are not authorized to create that resource.');
        }

        $user = DB::transaction(function () use ($request) {
            $user = User::query()->create($request->mappedAttributes() + ['is_active' => true]);
            Audit::record($request->user()->id, 'user.created', 'user', $user->id, [
                'username' => $user->username,
                'role' => $user->load('role')->roleName(),
            ]);

            return $user;
        });

        return (new UserResource($user->load('role')))->response()->setStatusCode(201);
    }

    /** Show a staff user */
    public function show(User $user)
    {
        if (! $this->isAble('view', $user)) {
            return $this->notAuthorized('You are not authorized to view that resource.');
        }

        return new UserResource($user->load('role'));
    }

    /** Replace a staff user (name, username and role) */
    public function replace(ReplaceUserRequest $request, User $user)
    {
        if (! $this->isAble('replace', $user)) {
            return $this->notAuthorized('You are not authorized to replace that resource.');
        }

        return new UserResource($this->save($request, $user));
    }

    /** Update a staff user (fields sent; isActive true re-enables) */
    public function update(UpdateUserRequest $request, User $user)
    {
        if (! $this->isAble('update', $user)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        return new UserResource($this->save($request, $user));
    }

    /**
     * Disable a staff user
     *
     * The account can no longer sign in, and its tokens stop working at once. Not your own account.
     */
    public function disable(User $user)
    {
        if (! $this->isAble('disable', $user)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }
        if ($user->id === request()->user()->id) {
            abort(422, 'You cannot disable your own account.');
        }

        DB::transaction(function () use ($user) {
            $user->forceFill(['is_active' => false])->save();
            Audit::record(request()->user()->id, 'user.disabled', 'user', $user->id, ['username' => $user->username]);
        });

        return new UserResource($user->load('role'));
    }

    /**
     * Reset a staff user's password
     *
     * Returns a temporary password, once. Only its hash is stored. The user must choose a new
     * password at their next sign-in: until then every route but `me`, `logout`, `refresh` and
     * `PUT /auth/password` answers 403.
     */
    public function resetPassword(User $user)
    {
        if (! $this->isAble('resetPassword', $user)) {
            return $this->notAuthorized('You are not authorized to update that resource.');
        }

        $password = AccountRules::generateTemporaryPassword();
        DB::transaction(function () use ($user, $password) {
            $user->forceFill(['password' => $password, 'must_change_password' => true])->save();
            Audit::record(request()->user()->id, 'user.password_reset', 'user', $user->id, ['username' => $user->username]);
        });

        return $this->ok('Temporary password issued', ['temporaryPassword' => $password]);
    }

    private function save(BaseUserRequest $request, User $user): User
    {
        return DB::transaction(function () use ($request, $user) {
            $before = ['name' => $user->name, 'username' => $user->username];
            $user->update($request->mappedAttributes());
            $user->load('role');
            Audit::record($request->user()->id, 'user.updated', 'user', $user->id, [
                'username' => $user->username,
                'role' => $user->roleName(),
            ], $before);

            return $user;
        });
    }
}
