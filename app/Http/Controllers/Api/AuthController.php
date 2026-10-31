<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyAccount;
use App\Models\Notification;
use App\Models\User;
use App\Services\AuditLoggerService;
use App\Services\FraudDetectionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Password policy regex: min 8 chars, 1 uppercase, 1 digit, 1 special char.
     */
    protected const PASSWORD_REGEX = '/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/';

    /**
     * Phone regex: numeric digits only (optional leading +), 10 to 15 digits.
     */
    protected const PHONE_REGEX = '/^\+?[0-9]{10,15}$/';

    /**
     * Register a new guest user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:'.self::PHONE_REGEX],
            'password' => [
                'required',
                'string',
                'confirmed',
                'min:8',
                'regex:'.self::PASSWORD_REGEX,
            ],
        ], [
            'password.regex' => 'The password must contain at least 8 characters, one uppercase letter, one number, and one special character (@$!%*#?&).',
            'phone.regex' => 'The phone number must be between 10 and 15 digits and may start with a +.',
        ]);

        $ipAddress = $request->ip() ?? '127.0.0.1';

        $user = DB::transaction(function () use ($validated, $ipAddress) {
            $newUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'role' => 'guest',
                'status' => 'active',
            ]);

            LoyaltyAccount::create([
                'user_id' => $newUser->user_id,
                'total_points' => 0,
                'available_points' => 0,
                'updated_at' => now(),
            ]);

            Notification::create([
                'user_id' => $newUser->user_id,
                'title' => 'Welcome to RP Hotels!',
                'message' => 'Thank you for registering with RP Hotels. Start discovering our lakeside resorts and convention venues.',
                'notification_type' => 'promo',
                'is_read' => false,
                'created_at' => now(),
            ]);

            AuditLoggerService::log('user_registered', 'users', $newUser->user_id, $newUser->user_id);
            FraudDetectionService::checkIpRegistrationVelocity($ipAddress, $newUser->user_id);

            return $newUser;
        });

        $user->load('loyaltyAccount');
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'token' => $token,
            'user' => $user,
        ], 'Registration completed successfully.', 201);
    }

    /**
     * Authenticate a user and issue a Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return $this->errorResponse('Invalid email or password.', 401);
        }

        if ($user->status !== 'active') {
            return $this->errorResponse('Your account is currently inactive or suspended. Please contact hotel administration.', 403);
        }

        $user->load('loyaltyAccount');
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLoggerService::log('user_login', 'users', $user->user_id, $user->user_id);

        $unreadCount = Notification::where('user_id', $user->user_id)
            ->where('is_read', false)
            ->count();

        return $this->successResponse([
            'token' => $token,
            'user' => $user,
            'unread_notifications_count' => $unreadCount,
        ], 'Logged in successfully.');
    }

    /**
     * Revoke the user current token (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        AuditLoggerService::log('user_logout', 'users', $user->user_id, $user->user_id);

        $user->currentAccessToken()?->delete();

        return $this->successResponse(null, 'Logged out successfully.');
    }

    /**
     * Retrieve the authenticated user profile with loyalty data and notifications count.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('loyaltyAccount');

        $unreadCount = Notification::where('user_id', $user->user_id)
            ->where('is_read', false)
            ->count();

        return $this->successResponse([
            'user' => $user,
            'unread_notifications_count' => $unreadCount,
        ], 'User profile retrieved successfully.');
    }

    /**
     * Update user personal profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => [
                'required',
                'string',
                'email',
                'max:150',
                Rule::unique('users', 'email')->ignore($user->user_id, 'user_id'),
            ],
            'phone' => ['required', 'string', 'regex:'.self::PHONE_REGEX],
        ], [
            'phone.regex' => 'The phone number must be between 10 and 15 digits and may start with a +.',
        ]);

        $user->update($validated);

        AuditLoggerService::log('profile_updated', 'users', $user->user_id, $user->user_id);

        return $this->successResponse($user->fresh(['loyaltyAccount']), 'Profile updated successfully.');
    }

    /**
     * Change user password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password' => [
                'required',
                'string',
                'confirmed',
                'min:8',
                'regex:'.self::PASSWORD_REGEX,
            ],
        ], [
            'password.regex' => 'The new password must contain at least 8 characters, one uppercase letter, one number, and one special character (@$!%*#?&).',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        AuditLoggerService::log('password_changed', 'users', $user->user_id, $user->user_id);

        return $this->successResponse(null, 'Password changed successfully.');
    }
}
