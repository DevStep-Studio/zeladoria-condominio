<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Private API for the trusted Next.js server. Never expose the service token to a browser. */
final class RequireFrontendService
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = config('services.frontend.token');
        abort_unless(is_string($token) && strlen($token) >= 32 && hash_equals($token, (string) $request->header('X-Service-Token')), 401);

        return $next($request);
    }
}
