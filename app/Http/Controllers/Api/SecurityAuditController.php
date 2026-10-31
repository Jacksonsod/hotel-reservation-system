<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\FraudFlag;
use App\Models\Notification;
use App\Models\User;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityAuditController extends Controller
{
    use ApiResponse;

    /**
     * Get paginated audit logs with search, filters and KPIs.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $search = $request->input('search');
        $targetTable = $request->input('target_table');
        $userId = $request->input('user_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = AuditLog::with('user');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('target_table', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($targetTable) && $targetTable !== 'all') {
            $query->where('target_table', $targetTable);
        }

        if (! empty($userId) && $userId !== 'all') {
            $query->where('user_id', $userId);
        }

        if (! empty($startDate)) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if (! empty($endDate)) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        // KPIs
        $totalLogs = AuditLog::count();
        $todayLogs = AuditLog::whereDate('created_at', now()->toDateString())->count();
        $uniqueIps = AuditLog::distinct('ip_address')->count('ip_address');
        $securityEvents = AuditLog::whereIn('action', [
            'login_failed',
            'fraud_flag_reviewed',
            'fraud_detected',
            'account_suspended',
            'unauthorized_access',
        ])->count();

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 25));

        $meta = [
            'kpis' => [
                'total_logs' => $totalLogs,
                'today_logs' => $todayLogs,
                'unique_ips' => $uniqueIps,
                'security_events' => $securityEvents,
            ],
        ];

        return $this->paginatedResponse($logs, 'Audit logs retrieved successfully.', $meta);
    }

    /**
     * Get paginated fraud detection flags with filters and KPIs.
     */
    public function fraudFlags(Request $request): JsonResponse
    {
        $riskLevel = $request->input('risk_level');
        $reviewStatus = $request->input('review_status');
        $search = $request->input('search');

        $query = FraudFlag::with('user');

        if (! empty($riskLevel) && $riskLevel !== 'all') {
            $query->where('risk_level', $riskLevel);
        }

        if (! empty($reviewStatus) && $reviewStatus !== 'all') {
            $query->where('review_status', $reviewStatus);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('activity_description', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $totalFlags = FraudFlag::count();
        $pendingCount = FraudFlag::where('review_status', 'pending')->count();
        $highRiskCount = FraudFlag::where('risk_level', 'high')->where('review_status', 'pending')->count();
        $resolvedCount = FraudFlag::whereIn('review_status', ['resolved', 'dismissed'])->count();

        $flags = $query->orderByRaw("CASE WHEN review_status = 'pending' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 25));

        $meta = [
            'kpis' => [
                'total_flags' => $totalFlags,
                'pending_count' => $pendingCount,
                'high_risk_count' => $highRiskCount,
                'resolved_count' => $resolvedCount,
            ],
        ];

        return $this->paginatedResponse($flags, 'Fraud flags retrieved successfully.', $meta);
    }

    /**
     * Review a fraud flag and optionally suspend the user.
     */
    public function updateFraudFlag(Request $request, FraudFlag $flag): JsonResponse
    {
        $validated = $request->validate([
            'review_status' => 'required|in:pending,reviewed,resolved,dismissed',
            'suspend_user' => 'nullable|boolean',
        ]);

        $flag->update([
            'review_status' => $validated['review_status'],
        ]);

        $userSuspended = false;
        if (! empty($validated['suspend_user']) && $flag->user_id) {
            $user = User::find($flag->user_id);
            if ($user && $user->role !== 'admin') {
                $user->update(['status' => 'suspended']);
                $user->tokens()->delete();
                $userSuspended = true;

                AuditLoggerService::log('account_suspended', 'users', $user->user_id, $request->user()->user_id);
            }
        }

        AuditLoggerService::log('fraud_flag_reviewed', 'fraud_flags', $flag->flag_id, $request->user()->user_id);

        $msg = "Fraud flag updated to '{$validated['review_status']}'.";
        if ($userSuspended) {
            $msg .= ' Associated user account has been suspended.';
        }

        return $this->successResponse(
            $flag->fresh('user'),
            $msg
        );
    }

    /**
     * Broadcast a promotional message to all active guests.
     */
    public function broadcastPromo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'message' => 'required|string|max:1000',
        ]);

        $guests = User::where('role', 'guest')->where('status', 'active')->get();

        foreach ($guests as $guest) {
            Notification::create([
                'user_id' => $guest->user_id,
                'title' => $validated['title'],
                'message' => $validated['message'],
                'notification_type' => 'promo',
                'is_read' => false,
                'created_at' => now(),
            ]);
        }

        AuditLoggerService::log('broadcast_promo', 'notifications', null, $request->user()->user_id);

        return $this->successResponse([
            'recipient_count' => $guests->count(),
        ], "Promotional announcement broadcast to {$guests->count()} active guests successfully.");
    }
}
