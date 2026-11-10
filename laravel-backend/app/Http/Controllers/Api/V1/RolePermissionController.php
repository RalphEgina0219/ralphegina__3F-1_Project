<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Permissions\V1\Abilities;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;

/**
 * @group Users
 *
 * The permissions the owner can switch on for all staff.
 */
class RolePermissionController extends APIController
{
    /** Staff permissions */
    public function index()
    {
        if (! $this->isAble('managePermissions', User::class)) {
            return $this->notAuthorized('You are not authorized to view permissions.');
        }

        return $this->ok('Permissions retrieved', $this->payload());
    }

    /**
     * Replace the staff permissions
     *
     * The whole set at once (PUT). Unknown codes are ignored. Turning one off takes effect
     * immediately; a newly granted one arrives with each staff member's next sign-in or refresh.
     *
     * @bodyParam data.attributes.permissions string[] required The codes to switch on. Example: ["payments.record", "inventory.stock_out"]
     */
    public function replace()
    {
        if (! $this->isAble('managePermissions', User::class)) {
            return $this->notAuthorized('You are not authorized to update permissions.');
        }

        request()->validate([
            'data.attributes.permissions' => ['present', 'array'],
            'data.attributes.permissions.*' => ['string'],
        ]);

        $staff = Role::query()->where('name', Role::STAFF)->firstOrFail();
        $before = $this->staffCodes($staff);
        $requested = (array) request()->input('data.attributes.permissions', []);
        $ids = Permission::query()->whereIn('code', $requested)->pluck('id')->all();

        DB::transaction(function () use ($staff, $ids, $before) {
            $staff->permissions()->sync($ids);
            Audit::record(request()->user()->id, 'role.permissions_updated', 'role', $staff->id, [
                'permissions' => $this->staffCodes($staff),
            ], ['permissions' => $before]);
        });

        return $this->ok('Permissions updated', $this->payload());
    }

    private function payload(): array
    {
        return [
            'available' => Permission::query()->orderBy('id')->get()->map(fn (Permission $p) => [
                'code' => $p->code,
                'label' => Abilities::PERMISSION_LABELS[$p->code] ?? $p->code,
            ])->all(),
            'staff' => $this->staffCodes(Role::query()->where('name', Role::STAFF)->firstOrFail()),
        ];
    }

    /** @return list<string> */
    private function staffCodes(Role $staff): array
    {
        return $staff->permissions()->orderBy('permissions.id')->pluck('code')->all();
    }
}
