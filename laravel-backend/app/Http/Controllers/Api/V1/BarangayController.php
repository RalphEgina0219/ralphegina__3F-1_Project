<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\BarangayResource;
use App\Models\Barangay;

/**
 * @group Customers
 */
class BarangayController extends APIController
{
    /**
     * List barangays
     *
     * The 36 barangays of Bongabong. Also public at /customer/barangays, for registration (names only).
     *
     * @unauthenticated
     */
    public function index()
    {
        return BarangayResource::collection(Barangay::query()->orderBy('id')->get());
    }
}
