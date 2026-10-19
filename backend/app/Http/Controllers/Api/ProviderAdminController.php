<?php

namespace App\Http\Controllers\Api;

use App\Services\ProviderService;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class ProviderAdminController
{
    public function __construct(private SessionService $sessions, private ProviderService $providers) {}

    private function context(Request $request): array
    {
        $ctx = $this->sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
        abort_unless(in_array($ctx['role'], ['superadmin', 'sindico'], true), 403);
        if ($request->integer('condoId')) {
            abort_unless(($ctx['condo']['id'] ?? null) === $request->integer('condoId'), 404);
        }

        return $ctx;
    }

    public function review(Request $request, int $vendor): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate(['decision' => 'required|in:aprovado,rejeitado,reenvio_solicitado', 'notes' => 'sometimes|nullable|string|max:2000']);
        $query = DB::table('vendors')->where('id', $vendor);
        if (! $request->user()->is_super_admin) {
            $query->where('condo_id', $ctx['condo']['id']);
        }
        $v = $query->first() ?? abort(404);
        $identity = json_decode($v->identity_verification ?? '{}', true, flags: JSON_THROW_ON_ERROR);
        DB::transaction(function () use ($request, $v, $data, $identity) {
            $approved = $data['decision'] === 'aprovado';
            DB::table('vendors')->where('id', $v->id)->update(['identity_verification' => json_encode([...$identity, 'status' => $data['decision'], 'reviewedAt' => now()->toIso8601String(), 'reviewedById' => $request->user()->id, 'rejectionReason' => $approved ? null : ($data['notes'] ?? null)], JSON_THROW_ON_ERROR), 'verified' => $approved, 'verified_at' => $approved ? now() : null, 'verified_by_id' => $approved ? $request->user()->id : null, 'onboarding_status' => $approved ? 'aprovado' : ($data['decision'] === 'rejeitado' ? 'rejeitado' : 'pendente_doc')]);
            $this->providers->audit($request, $v, 'atualizar', 'verificacao_prestador', $v->id, 'Revisou verificação: '.$data['decision']);
        });

        return response()->json(['data' => ['success' => true]]);
    }

    public function storePlan(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate(['name' => 'required|string|max:120', 'type' => 'required|in:categoria,regiao,home,busca', 'durationDays' => 'required|integer|min:1|max:365', 'priceCents' => 'required|integer|min:0|max:100000000', 'description' => 'sometimes|nullable|string|max:5000']);
        $id = DB::table('promotion_plans')->insertGetId(['condo_id' => $ctx['condo']['id'] ?? null, 'name' => $data['name'], 'type' => $data['type'], 'duration_days' => $data['durationDays'], 'price_cents' => $data['priceCents'], 'description' => $data['description'] ?? null, 'active' => true]);

        return response()->json(['data' => ['success' => true, 'planId' => $id]], 201);
    }

    public function togglePlan(Request $request, int $plan): JsonResponse
    {
        $ctx = $this->context($request);

        return DB::transaction(function () use ($request, $ctx, $plan) {
            $query = DB::table('promotion_plans')->where('id', $plan);
            if (! $request->user()->is_super_admin) {
                $query->where('condo_id', $ctx['condo']['id']);
            }
            $row = $query->lockForUpdate()->first() ?? abort(404);
            DB::table('promotion_plans')->where('id', $row->id)->update(['active' => ! $row->active]);

            return response()->json(['data' => ['success' => true, 'active' => ! $row->active]]);
        });
    }
}
