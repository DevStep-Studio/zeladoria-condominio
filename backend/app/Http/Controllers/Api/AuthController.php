<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Services\EntitySerializer;
use App\Services\PasswordService;
use App\Services\SessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

final class AuthController
{
    public function login(Request $request, PasswordService $passwords): mixed
    {
        $data = $request->validate(['email' => 'required|email|max:160', 'password' => 'required|string|max:1024']);
        $email = mb_strtolower(trim($data['email']));
        $key = 'login:'.hash('sha256', $request->header('X-Client-IP', $request->ip()).'|'.$email);
        if (RateLimiter::tooManyAttempts($key, 10)) {
            abort(429, 'Muitas tentativas. Aguarde antes de tentar novamente.');
        }
        $user = User::where('email', $email)->first();
        if (! $user || $user->status === 'bloqueado' || ! $passwords->verify($data['password'], $user->password_hash)) {
            RateLimiter::hit($key, 60);
            abort(401, 'Credenciais inválidas.');
        }
        RateLimiter::clear($key);
        $user->last_login_at = now();
        $user->first_access_at ??= now();
        $user->save();

        return $this->issue($user);
    }

    public function create(Request $request): mixed
    {
        // Only the trusted BFF calls this after completing provider onboarding.
        $data = $request->validate(['userId' => 'required|integer|min:1']);
        $user = User::findOrFail($data['userId']);
        abort_if($user->status === 'bloqueado', 403);

        return $this->issue($user);
    }

    private function issue(User $user): mixed
    {
        return response()->json(['data' => ['token' => $user->createToken('nextjs', ['*'], now()->addDays(30))->plainTextToken, 'user' => app(EntitySerializer::class)->serialize('users', $user->getAttributes())]])->header('Cache-Control', 'no-store');
    }

    public function session(Request $request, SessionService $sessions): mixed
    {
        return response()->json(['data' => $sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'))])->header('Cache-Control', 'no-store');
    }

    public function provider(Request $request, EntitySerializer $serializer): mixed
    {
        abort_if($request->user()->status === 'bloqueado', 401);
        $vendor = DB::table('vendors')->where('user_id', $request->user()->id)->first();
        if (! $vendor && $request->user()->is_super_admin) {
            $vendor = DB::table('vendors')->orderBy('id')->first();
        }
        abort_unless($vendor || $request->user()->is_super_admin, 403);

        return response()->json(['data' => $vendor ? $serializer->serialize('vendors', $vendor) : null]);
    }

    public function password(Request $request, PasswordService $passwords): mixed
    {
        $data = $request->validate(['currentPassword' => 'required|string|max:1024', 'newPassword' => 'required|string|min:8|max:1024', 'confirmPassword' => 'required|same:newPassword']);
        $user = $request->user();
        if (! $passwords->verify($data['currentPassword'], $user->password_hash)) {
            throw ValidationException::withMessages(['currentPassword' => 'A senha atual está incorreta.']);
        }
        $user->password_hash = $passwords->hash($data['newPassword']);
        $user->save();
        $user->tokens()->where('id', '<>', $user->currentAccessToken()->id)->delete();

        return response()->json(['data' => ['success' => true]]);
    }

    public function logout(Request $request): mixed
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['data' => ['success' => true]]);
    }

    public function theme(Request $request): mixed
    {
        $data = $request->validate(['theme' => 'required|in:light,dark']);
        DB::table('users')->where('id', $request->user()->id)->update(['theme' => $data['theme']]);

        return response()->json(['data' => ['success' => true]]);
    }

    public function updateProfile(Request $request): mixed
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:160',
            'phone' => 'sometimes|nullable|string|max:40',
            'document' => 'sometimes|nullable|string|max:40',
            'avatarUrl' => 'sometimes|nullable|string|max:4000000',
            'dependents' => 'sometimes|array',
            'vehicles' => 'sometimes|array',
            'emergencyContacts' => 'sometimes|array',
            'notificationPreferences' => 'sometimes|array',
            'twoFactorEnabled' => 'sometimes|boolean',
        ]);
        $values = [];
        if (array_key_exists('name', $data)) {
            $values['name'] = trim($data['name']);
        }
        if (array_key_exists('phone', $data)) {
            $values['phone'] = $data['phone'] ?: null;
        }
        if (array_key_exists('document', $data)) {
            $values['document'] = $data['document'] ?: null;
        }
        if (array_key_exists('avatarUrl', $data)) {
            $values['avatar_url'] = $data['avatarUrl'] ?: null;
        }
        if (array_key_exists('dependents', $data)) {
            $values['dependents'] = json_encode($data['dependents'], JSON_THROW_ON_ERROR);
        }
        if (array_key_exists('vehicles', $data)) {
            $values['vehicles'] = json_encode($data['vehicles'], JSON_THROW_ON_ERROR);
        }
        if (array_key_exists('emergencyContacts', $data)) {
            $values['emergency_contacts'] = json_encode($data['emergencyContacts'], JSON_THROW_ON_ERROR);
        }
        if (array_key_exists('notificationPreferences', $data)) {
            $values['notification_preferences'] = json_encode($data['notificationPreferences'], JSON_THROW_ON_ERROR);
        }
        if (array_key_exists('twoFactorEnabled', $data)) {
            $values['two_factor_enabled'] = (bool) $data['twoFactorEnabled'];
        }
        if ($values) {
            DB::table('users')->where('id', $request->user()->id)->update($values);
        }

        return response()->json(['data' => ['success' => true]]);
    }

    public function markNotificationRead(Request $request, int $notification): mixed
    {
        DB::table('notifications')->where('id', $notification)->where('user_id', $request->user()->id)->update(['read_at' => now()]);

        return response()->json(['data' => ['success' => true]]);
    }

    public function markAllNotificationsRead(Request $request): mixed
    {
        DB::table('notifications')->where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['data' => ['success' => true]]);
    }
}
