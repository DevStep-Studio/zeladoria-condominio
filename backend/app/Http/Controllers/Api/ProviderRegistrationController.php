<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Services\PasswordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ProviderRegistrationController
{
    public function store(Request $request, PasswordService $passwords): JsonResponse
    {
        $authUser = $request->user('sanctum');
        $email = mb_strtolower(trim((string) $request->input('email')));
        $request->merge(['email' => $email]);

        // Se o usuário não está autenticado por token, verifica se o e-mail já existe
        $existingUser = $authUser;
        if (! $existingUser && $email) {
            $found = User::where('email', $email)->first();
            if ($found) {
                $pwd = (string) $request->input('password');
                if ($pwd && $passwords->verify($pwd, $found->password_hash)) {
                    $existingUser = $found;
                } else {
                    abort(422, 'Já existe uma conta com este e-mail no Zeladoria. Digite a senha correta da sua conta para ativar o perfil profissional.');
                }
            }
        }

        $emailRule = $existingUser ? 'required|email|max:160' : 'required|email|max:160|unique:users,email';
        $passwordRule = $existingUser ? 'sometimes|nullable|string|max:1024' : 'required|string|min:8|max:1024';

        $data = $request->validate([
            'name' => 'required|string|max:70', 'lastName' => 'present|string|max:70', 'email' => $emailRule, 'password' => $passwordRule, 'phone' => 'required|string|max:32', 'cpf' => 'sometimes|nullable|string|max:32',
            'providerType' => 'required|in:autonomo,empresa', 'companyName' => 'sometimes|nullable|string|max:160', 'cnpj' => 'sometimes|nullable|string|max:32', 'category' => 'required|string|max:40',
            'specialties' => 'sometimes|array|max:100', 'specialties.*' => 'string|max:100', 'services' => 'required|array|max:100', 'services.*' => 'array:id,name,description,priceFromCents,priceType,estimatedDurationMinutes,warrantyDays',
            'services.*.id' => 'required|string|max:100', 'services.*.name' => 'required|string|max:200', 'services.*.description' => 'sometimes|nullable|string|max:5000', 'services.*.priceFromCents' => 'nullable|integer|min:0|max:100000000',
            'serviceArea' => 'required|string|max:240', 'serviceRadiusKm' => 'required|numeric|min:1|max:1000', 'condoId' => 'sometimes|nullable|integer|exists:condominiums,id',
            'cep' => 'sometimes|nullable|string|max:16', 'addressStreet' => 'sometimes|nullable|string|max:200', 'addressNumber' => 'sometimes|nullable|string|max:30', 'addressNeighborhood' => 'sometimes|nullable|string|max:120', 'addressCity' => 'sometimes|nullable|string|max:100', 'addressState' => 'sometimes|nullable|string|max:8',
            'lat' => 'sometimes|nullable|numeric|between:-90,90', 'lng' => 'sometimes|nullable|numeric|between:-180,180', 'experienceYears' => 'sometimes|nullable|integer|min:0|max:100', 'description' => 'sometimes|nullable|string|max:10000', 'photoUrl' => 'sometimes|nullable|string|max:4000000', 'priceFromCents' => 'sometimes|nullable|integer|min:0|max:100000000',
            'bankInfo' => 'sometimes|nullable|array:bankCode,bankName,agency,account,accountType,holderName,holderDocument', 'bankInfo.*' => 'nullable|string|max:200',
            'pixInfo' => 'sometimes|nullable|array:keyType,key', 'pixInfo.keyType' => 'required_with:pixInfo|in:cpf,cnpj,email,phone,random', 'pixInfo.key' => 'required_with:pixInfo|string|max:200',
            'identityVerification' => 'sometimes|nullable|array:documentType,frontUrl,backUrl,digitalPdfUrl,selfieUrl', 'identityVerification.documentType' => 'required_with:identityVerification|in:cnh,rg', 'identityVerification.*' => 'nullable|string|max:4000000',
            'portfolio' => 'sometimes|array|max:100', 'portfolio.*' => 'array:url,caption,category,date', 'portfolio.*.url' => 'required|string|max:4000000', 'portfolio.*.caption' => 'sometimes|nullable|string|max:1000',
        ]);

        return DB::transaction(function () use ($data, $passwords, $existingUser) {
            $condo = isset($data['condoId']) ? DB::table('condominiums')->where('id', $data['condoId'])->where('public_page', true)->first() : DB::table('condominiums')->where('public_page', true)->orderBy('id')->first();
            abort_unless($condo, 422, 'Não há condomínio disponível para cadastro.');
            $name = trim($data['name'].' '.$data['lastName']);

            if ($existingUser) {
                $userId = $existingUser->id;
                // Atualiza telefone ou documento se ainda não cadastrado
                $userUpdates = [];
                if (! $existingUser->phone && ! empty($data['phone'])) {
                    $userUpdates['phone'] = $data['phone'];
                }
                if (! $existingUser->document && ! empty($data['cpf'])) {
                    $userUpdates['document'] = preg_replace('/\D/', '', $data['cpf']);
                }
                if ($userUpdates) {
                    DB::table('users')->where('id', $userId)->update($userUpdates);
                }
            } else {
                $userId = DB::table('users')->insertGetId([
                    'name' => $name,
                    'email' => $data['email'],
                    'password_hash' => $passwords->hash($data['password']),
                    'phone' => $data['phone'],
                    'document' => isset($data['cpf']) ? preg_replace('/\D/', '', $data['cpf']) : null,
                    'status' => 'ativo',
                    'is_super_admin' => false,
                ]);
            }

            // Verifica se este usuário já possui um registro de prestador
            $existingVendor = DB::table('vendors')->where('user_id', $userId)->first();
            $values = [
                'user_id' => $userId,
                'condo_id' => $condo->id,
                'name' => $name,
                'company_name' => $data['companyName'] ?? $name,
                'contact_name' => $name,
                'email' => $data['email'],
                'whatsapp' => $data['phone'],
                'slug' => Str::slug($data['companyName'] ?? $name).'-'.Str::lower(Str::random(12)),
                'active' => true,
                'verified' => false,
                'sponsored' => false,
                'onboarding_status' => 'em_analise',
                'is_online' => true,
                'available_now' => true,
            ];
            $fields = ['phone', 'providerType', 'category', 'cnpj', 'serviceArea', 'serviceRadiusKm', 'cep', 'addressStreet', 'addressNumber', 'addressNeighborhood', 'addressCity', 'addressState', 'lat', 'lng', 'experienceYears', 'description', 'photoUrl', 'priceFromCents'];
            foreach ($fields as $key) {
                if (array_key_exists($key, $data)) {
                    $values[Str::snake($key)] = $data[$key];
                }
            }
            foreach (['services', 'specialties', 'portfolio', 'bankInfo', 'pixInfo'] as $key) {
                if (array_key_exists($key, $data)) {
                    $values[Str::snake($key)] = json_encode($data[$key], JSON_THROW_ON_ERROR);
                }
            }
            $identity = $data['identityVerification'] ?? [];
            $hasDocs = ! empty($identity['frontUrl']) || ! empty($identity['digitalPdfUrl']) || ! empty($identity['selfieUrl']);
            $values['identity_verification'] = json_encode([...$identity, 'status' => $hasDocs ? 'em_analise' : 'pendente', 'submittedAt' => $hasDocs ? now()->toIso8601String() : null], JSON_THROW_ON_ERROR);

            if ($existingVendor) {
                DB::table('vendors')->where('id', $existingVendor->id)->update($values);
                $vendorId = $existingVendor->id;
            } else {
                $vendorId = DB::table('vendors')->insertGetId($values);
            }

            $user = User::findOrFail($userId);

            return response()->json([
                'data' => [
                    'success' => true,
                    'vendorId' => $vendorId,
                    'token' => $user->createToken('nextjs', ['*'], now()->addDays(30))->plainTextToken,
                ],
            ], 201)->header('Cache-Control', 'no-store');
        });
    }
}
