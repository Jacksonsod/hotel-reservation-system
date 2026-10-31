<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    use ApiResponse;

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->errorResponse('Unauthenticated.', 401);
        }

        if ($user->status !== 'active') {
            return $this->errorResponse('Your account is currently inactive or suspended. Please contact management.', 403);
        }

        if (! in_array($user->role, $roles, true)) {
            return $this->errorResponse('Forbidden: You do not have permission to access this resource.', 403);
        }

        return $next($request);
    }
}
