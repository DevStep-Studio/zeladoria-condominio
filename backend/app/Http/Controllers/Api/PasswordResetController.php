<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PasswordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Throwable;

final class PasswordResetController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => mb_strtolower(trim($request->input('email')))]);
        }
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $user = User::where('email', $data['email'])->first();
        $resetUrl = null;
        if ($user && $user->status !== 'bloqueado') {
            try {
                $token = Password::createToken($user);
                $frontendUrl = rtrim((string) (config('app.frontend_url') ?: 'https://zeladoriacondominio.com.br'), '/');
                $generatedUrl = $frontendUrl.'/redefinir-senha?token='.$token.'&email='.urlencode($user->email);
                if (config('mail.default') === 'log') {
                    $resetUrl = $generatedUrl;
                }
                $status = Password::sendResetLink($data);
                if ($status === Password::RESET_THROTTLED) {
                    return response()->json(['message' => 'Aguarde um minuto antes de solicitar outro link.'], 429);
                }
            } catch (Throwable $exception) {
                if (empty($resetUrl)) {
                    Password::deleteToken($user);
                    report($exception);

                    return response()->json(['message' => 'Não foi possível enviar o e-mail. Tente novamente mais tarde.'], 503);
                }
            }
        }

        $res = ['message' => 'Se houver uma conta ativa com esse e-mail, você receberá as instruções de recuperação.'];
        if ($resetUrl !== null) {
            $res['resetUrl'] = $resetUrl;
        }

        return response()->json(['data' => $res]);
    }

    public function reset(Request $request, PasswordService $passwords): JsonResponse
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => mb_strtolower(trim($request->input('email')))]);
        }
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'token' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);
        $status = Password::reset($data, function (User $user, string $password) use ($passwords): void {
            abort_if($user->status === 'bloqueado', 422, 'Este link não pode ser utilizado.');
            $user->forceFill(['password_hash' => $passwords->hash($password)])->save();
            $user->tokens()->delete();
        });
        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Link inválido ou expirado. Solicite uma nova recuperação de senha.'], 422);
        }

        return response()->json(['data' => ['message' => 'Senha alterada com sucesso.']]);
    }
}
