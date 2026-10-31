<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyAccount;
use App\Models\Reservation;
use App\Models\User;
use App\Services\AuditLoggerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of users with filters and role metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('loyaltyAccount');

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $kpis = [
            'total' => User::count(),
            'admins' => User::where('role', 'admin')->count(),
            'receptionists' => User::where('role', 'receptionist')->count(),
            'housekeeping' => User::where('role', 'housekeeping')->count(),
            'guests' => User::where('role', 'guest')->count(),
            'active' => User::where('status', 'active')->count(),
            'inactive' => User::where('status', 'inactive')->count(),
            'suspended' => User::where('status', 'suspended')->count(),
        ];

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = (int) $request->input('per_page', 10);
            $paginator = $query->latest('user_id')->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Users retrieved successfully.',
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'kpis' => $kpis,
                ],
            ]);
        }

        return $this->successResponse(
            $query->latest('user_id')->get(),
            'Users retrieved successfully.',
            200,
            ['kpis' => $kpis]
        );
    }

    /**
     * Display the specified user.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with('loyaltyAccount')
            ->withCount('reservations')
            ->find($id);

        if (! $user) {
            return $this->errorResponse('User not found.', 404);
        }

        return $this->successResponse($user, 'User retrieved successfully.');
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|max:150|unique:users,email',
            'phone' => ['required', 'regex:/^\+?[0-9]{10,15}$/'],
            'password' => ['required', 'string', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/'],
            'role' => 'required|in:guest,receptionist,housekeeping,admin',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => $validated['status'] ?? 'active',
        ]);

        if ($user->role === 'guest') {
            LoyaltyAccount::create([
                'user_id' => $user->user_id,
                'total_points' => 0,
                'available_points' => 0,
            ]);
        }

        AuditLoggerService::log('create', 'users', $user->user_id);

        return $this->successResponse(
            $user->load('loyaltyAccount'),
            'User created successfully.',
            201
        );
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return $this->errorResponse('User not found.', 404);
        }

        $authUser = $request->user();

        // Self-protection guard for admin
        if ($authUser && (int) $authUser->user_id === (int) $user->user_id) {
            if ($request->has('status') && in_array($request->input('status'), ['inactive', 'suspended'])) {
                return $this->errorResponse('You cannot deactivate or suspend your own admin account.', 403);
            }
            if ($request->has('role') && $request->input('role') !== 'admin') {
                return $this->errorResponse('You cannot remove your own admin privileges.', 403);
            }
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:120',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:150',
                Rule::unique('users', 'email')->ignore($id, 'user_id'),
            ],
            'phone' => ['sometimes', 'required', 'regex:/^\+?[0-9]{10,15}$/'],
            'password' => ['nullable', 'string', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/'],
            'role' => 'sometimes|required|in:guest,receptionist,housekeeping,admin',
            'status' => 'sometimes|required|in:active,inactive,suspended',
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        if ($user->role === 'guest' && ! $user->loyaltyAccount) {
            LoyaltyAccount::create([
                'user_id' => $user->user_id,
                'total_points' => 0,
                'available_points' => 0,
            ]);
        }

        AuditLoggerService::log('update', 'users', $user->user_id);

        return $this->successResponse(
            $user->load('loyaltyAccount'),
            'User updated successfully.'
        );
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return $this->errorResponse('User not found.', 404);
        }

        $authUser = $request->user();

        // Self-protection guard
        if ($authUser && (int) $authUser->user_id === (int) $user->user_id) {
            return $this->errorResponse('You cannot delete your own admin account.', 403);
        }

        // Active reservation guard
        $hasActiveReservations = Reservation::where('user_id', $user->user_id)
            ->whereIn('reservation_status', ['pending', 'confirmed', 'checked_in'])
            ->exists();

        if ($hasActiveReservations) {
            return $this->errorResponse('Cannot delete user with active reservations.', 409);
        }

        $user->delete();

        AuditLoggerService::log('delete', 'users', $id);

        return $this->successResponse(null, 'User deleted successfully.');
    }
}
