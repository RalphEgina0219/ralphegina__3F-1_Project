<?php

namespace App\Support;

/**
 * Account, name and phone rules, ported from react-frontend/src/lib/accounts.ts and
 * lib/format.ts, so the browser and the server cannot disagree.
 */
final class AccountRules
{
    public const PASSWORD_MIN = 8;

    public const LOGIN_ATTEMPTS_PER_MINUTE = 5;

    /** Emails are unique case-insensitively, so they are stored lower-case. */
    public static function normalizeEmail(?string $value): string
    {
        return mb_strtolower(trim((string) $value));
    }

    public static function isValidEmail(string $value): bool
    {
        return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/', trim($value));
    }

    /** The first rule a password breaks, or null when it is acceptable. */
    public static function passwordProblem(string $password): ?string
    {
        if (mb_strlen($password) < self::PASSWORD_MIN) {
            return 'Use at least '.self::PASSWORD_MIN.' characters.';
        }
        if (! preg_match('/[A-Za-z]/', $password) || ! preg_match('/\d/', $password)) {
            return 'Use at least one letter and one number.';
        }

        return null;
    }

    /** Trims and collapses inner spaces. A name of only spaces becomes empty. */
    public static function cleanName(?string $value): string
    {
        return preg_replace('/\s+/', ' ', trim((string) $value));
    }

    /**
     * The stored form of a PH mobile number: "0917 845 2210", "+63 917 845 2210" and
     * "639178452210" all become "09178452210".
     */
    public static function normalizePhone(?string $value): string
    {
        $digits = preg_replace('/\D/', '', (string) $value);

        return preg_match('/^639\d{9}$/', $digits) ? '0'.substr($digits, 2) : $digits;
    }

    public static function isValidPhone(?string $value): bool
    {
        return (bool) preg_match('/^09\d{9}$/', self::normalizePhone($value));
    }

    /**
     * 10 characters without look-alike symbols, for staff to read out at the counter. Always has
     * a letter and a digit, so it meets the customer password rule.
     */
    public static function generateTemporaryPassword(): string
    {
        $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
        $password = '';
        for ($i = 0; $i < 10; $i++) {
            $password .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        return preg_match('/\d/', $password) && preg_match('/[a-z]/', $password)
            ? $password
            : substr($password, 0, 8).'a7';
    }
}
