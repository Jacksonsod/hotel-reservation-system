<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * Get the latest 30 notifications for the authenticated user with unread count.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->user_id;

        $notifications = Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        $unreadCount = Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return $this->successResponse([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ], 'Notifications retrieved successfully.');
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->user_id;

        $notification = Notification::where('notification_id', $id)
            ->where('user_id', $userId)
            ->first();

        if (! $notification) {
            return $this->errorResponse('Notification not found.', 404);
        }

        $notification->update(['is_read' => true]);

        return $this->successResponse($notification, 'Notification marked as read.');
    }

    /**
     * Mark all notifications for the authenticated user as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user()->user_id;

        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $this->successResponse(null, 'All notifications marked as read.');
    }
}
