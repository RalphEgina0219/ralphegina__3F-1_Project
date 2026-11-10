<?php

namespace App\Support;

/**
 * Field rules shared by the new-order and record-payment endpoints, ported from the mock's
 * validatePayment(): an amount above zero and not above the balance, Cash or GCash, and a
 * reference number for GCash.
 */
final class PaymentRules
{
    public const METHODS = ['cash', 'gcash'];

    /**
     * @param  array<string, mixed>  $payment  amountCents, paymentMethod, referenceNumber
     * @return array{errors: array<string, string>, values: array{amount_cents: int, method: string, reference_number: ?string}}
     */
    public static function check(array $payment, int $balanceCents): array
    {
        $errors = [];
        $amount = $payment['amountCents'] ?? null;
        $method = is_string($payment['paymentMethod'] ?? null) ? $payment['paymentMethod'] : '';
        $reference = is_string($payment['referenceNumber'] ?? null) ? trim($payment['referenceNumber']) : '';

        // Like Number.isInteger(): 20000 and "20000" pass, 200.5 does not.
        $number = is_numeric($amount) ? $amount + 0 : null;
        $isWhole = is_int($number) || (is_float($number) && floor($number) === $number);

        if (! $isWhole || $number <= 0) {
            $errors['amountCents'] = 'Enter an amount above zero.';
        } elseif ((int) $amount > $balanceCents) {
            $errors['amountCents'] = 'The amount cannot be more than the balance.';
        }

        if (! in_array($method, self::METHODS, true)) {
            $errors['paymentMethod'] = 'Choose Cash or GCash.';
        }

        if ($method === 'gcash' && $reference === '') {
            $errors['referenceNumber'] = 'Enter the GCash reference number.';
        }

        return [
            'errors' => $errors,
            'values' => [
                'amount_cents' => (int) $amount,
                'method' => $method,
                'reference_number' => $method === 'gcash' ? $reference : null,
            ],
        ];
    }
}
