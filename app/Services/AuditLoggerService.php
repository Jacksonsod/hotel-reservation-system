<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditLoggerService
{
    /**
     * Record an audit log entry.
     */
    public static function log(
        string $action,
        string $targetTable,
        ?int $targetId = null,
        ?int $userId = null
    ): AuditLog {
        $effectiveUserId = $userId ?? Auth::id() ?? (request()->user()?->user_id);
        $ip = request()->ip() ?? '127.0.0.1';

        return AuditLog::create([
            'user_id' => $effectiveUserId,
            'action' => $action,
            'target_table' => $targetTable,
            'target_id' => $targetId,
            'ip_address' => $ip,
            'created_at' => now(),
        ]);
    }
}
