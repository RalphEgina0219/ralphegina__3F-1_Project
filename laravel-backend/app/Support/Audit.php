<?php

namespace App\Support;

use App\Models\AuditLog;

/**
 * Writes one audit_logs row. Every create, update, status change, payment, void, basket change
 * and settings change calls this inside its own transaction, so the log and the change commit
 * together or not at all.
 */
final class Audit
{
    /**
     * @param  array<string, mixed>|null  $newValues
     * @param  array<string, mixed>|null  $oldValues
     */
    public static function record(
        ?int $userId,
        string $action,
        string $type,
        ?int $id,
        ?array $newValues = null,
        ?array $oldValues = null,
    ): AuditLog {
        return AuditLog::query()->create([
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => $type,
            'auditable_id' => $id,
            'new_values' => $newValues,
            'old_values' => $oldValues,
            'created_at' => now(),
        ]);
    }
}
