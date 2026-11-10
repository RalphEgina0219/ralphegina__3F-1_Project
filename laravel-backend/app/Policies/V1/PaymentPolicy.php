<?php

namespace App\Policies\V1;

use App\Models\Payment;
use App\Models\User;
use App\Permissions\V1\Abilities;

/** Payments: viewing, recording and voiding are separate abilities the owner can give staff. */
class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tokenCan(Abilities::PaymentsView);
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->tokenCan(Abilities::PaymentsView);
    }

    public function store(User $user): bool
    {
        return $user->tokenCan(Abilities::PaymentsRecord);
    }

    public function void(User $user, Payment $payment): bool
    {
        return $user->tokenCan(Abilities::PaymentsVoid);
    }
}
