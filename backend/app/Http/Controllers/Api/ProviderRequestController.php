<?php

namespace App\Http\Controllers\Api;

use App\Services\ProviderService;
use App\Services\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class ProviderRequestController
{
    public function __construct(private ProviderService $providers) {}

    public function index(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);

        return response()->json(['data' => ['vendor' => $this->providers->row('vendors', $v), 'requests' => $this->providers->requestRows($v), 'quotes' => $this->providers->quotes($v)]]);
    }

    public function show(Request $request, int $service): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $row = $this->providers->ownedRequest($v, $service);

        return response()->json(['data' => ['request' => $this->providers->row('serviceRequests', $row),
            'messages' => $this->providers->rows('serviceMessages', DB::table('service_messages')->where('request_id', $row->id)->orderBy('created_at')->orderBy('id')),
            'evidences' => $this->providers->rows('serviceEvidences', DB::table('service_evidences')->where('request_id', $row->id)->where('vendor_id', $v->id)->orderBy('id')),
            'quotes' => $this->providers->rows('serviceQuotes', DB::table('service_quotes')->where('request_id', $row->id)->where('vendor_id', $v->id)->orderByDesc('id')),
        ]]);
    }

    public function accept(Request $request, int $service): JsonResponse
    {
        $v = $this->providers->vendor($request);

        return DB::transaction(function () use ($request, $v, $service) {
            $row = DB::table('service_requests')->where('id', $service)->where('condo_id', $v->condo_id)->lockForUpdate()->first() ?? abort(404);
            abort_unless($row->vendor_id === $v->id || ($row->vendor_id === null && ServiceCategory::normalize($row->category) === ServiceCategory::normalize($v->category)), 404);
            abort_unless(in_array($row->status, ['solicitado', 'buscando_prestador', 'aguardando_orcamentos'], true), 409, 'Oportunidade indisponível.');
            DB::table('service_requests')->where('id', $row->id)->update(['vendor_id' => $v->id, 'status' => 'aceito', 'accepted_at' => now(), 'updated_at' => now()]);
            $this->providers->message($request, $row, $v->name.' confirmou o atendimento.');
            $this->providers->audit($request, $v, 'aceitar', 'servico', $row->id, 'Aceitou o chamado '.$row->code);

            return response()->json(['data' => ['success' => true]]);
        });
    }

    public function reject(Request $request, int $service): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = $request->validate(['reason' => 'sometimes|nullable|string|max:2000']);

        return DB::transaction(function () use ($request, $v, $service, $data) {
            $row = $this->providers->ownedRequest($v, $service, true);
            abort_unless(in_array($row->status, ['solicitado', 'buscando_prestador', 'aguardando_orcamentos', 'aceito'], true), 409, 'Este atendimento não pode mais ser recusado.');
            DB::table('service_requests')->where('id', $row->id)->update(['status' => 'cancelado', 'cancelled_by' => $request->user()->id, 'cancel_reason' => $data['reason'] ?? 'Prestador indisponível.', 'cancelled_at' => now(), 'updated_at' => now()]);
            $this->providers->message($request, $row, 'Atendimento recusado: '.($data['reason'] ?? 'Indisponibilidade do profissional.'));

            return response()->json(['data' => ['success' => true]]);
        });
    }

    public function progress(Request $request, int $service): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = $request->validate(['status' => 'required|in:a_caminho,chegou,em_atendimento,prestador_concluiu,conclusao_solicitada,concluido,cancelado', 'reason' => 'sometimes|nullable|string|max:2000']);

        return DB::transaction(function () use ($request, $v, $service, $data) {
            $row = $this->providers->ownedRequest($v, $service, true);
            // Only the customer may confirm completion and unlock a payout.
            $next = in_array($data['status'], ['concluido', 'conclusao_solicitada'], true) ? 'prestador_concluiu' : $data['status'];
            $transitions = ['aceito' => ['a_caminho', 'cancelado'], 'orcamento_aprovado' => ['a_caminho', 'cancelado'], 'a_caminho' => ['chegou', 'cancelado'], 'chegou' => ['em_atendimento', 'cancelado'], 'em_atendimento' => ['prestador_concluiu', 'cancelado'], 'correcao_solicitada' => ['em_atendimento', 'prestador_concluiu', 'cancelado']];
            abort_unless(in_array($next, $transitions[$row->status] ?? [], true), 409, 'Transição de atendimento inválida.');
            $values = ['status' => $next, 'updated_at' => now()];
            if ($next === 'chegou') {
                $values['arrived_at'] = now();
            }
            if ($next === 'em_atendimento') {
                $values['started_at'] = now();
            }
            if ($next === 'prestador_concluiu') {
                $values['completion_requested_at'] = now();
            }
            if ($next === 'cancelado') {
                $values += ['cancelled_at' => now(), 'cancelled_by' => $request->user()->id, 'cancel_reason' => $data['reason'] ?? 'Cancelado pelo prestador.'];
            }
            DB::table('service_requests')->where('id', $row->id)->update($values);
            $this->providers->message($request, $row, 'Atendimento atualizado para '.str_replace('_', ' ', $next).'.');

            return response()->json(['data' => ['success' => true, 'status' => $next]]);
        });
    }

    public function checkin(Request $request, int $service): JsonResponse
    {
        $request->merge(['status' => 'chegou']);

        return $this->progress($request, $service);
    }

    public function execution(Request $request, int $service): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = $this->executionData($request);

        return DB::transaction(function () use ($v, $service, $data) {
            $row = $this->providers->ownedRequest($v, $service, true);
            abort_unless(in_array($row->status, ['aceito', 'a_caminho', 'chegou', 'em_atendimento', 'correcao_solicitada'], true), 409, 'Atendimento não está em execução.');
            $values = ['updated_at' => now()];
            foreach (['checklist' => 'checklist', 'materialsUsed' => 'materials_used', 'executionNotes' => 'execution_notes'] as $key => $column) {
                if (array_key_exists($key, $data)) {
                    $values[$column] = is_array($data[$key]) ? json_encode($data[$key], JSON_THROW_ON_ERROR) : $data[$key];
                }
            }
            DB::table('service_requests')->where('id', $row->id)->update($values);

            return response()->json(['data' => ['success' => true]]);
        });
    }

    private function executionData(Request $request): array
    {
        return $request->validate(['checklist' => 'sometimes|array|max:100', 'checklist.*' => 'array:item,checked', 'checklist.*.item' => 'required|string|max:500', 'checklist.*.checked' => 'required|boolean', 'materialsUsed' => 'sometimes|array|max:100', 'materialsUsed.*' => 'array:name,quantity,notes', 'materialsUsed.*.name' => 'required|string|max:200', 'materialsUsed.*.quantity' => 'required|numeric|min:0|max:1000000', 'materialsUsed.*.notes' => 'sometimes|nullable|string|max:1000', 'executionNotes' => 'sometimes|nullable|string|max:10000']);
    }

    public function evidence(Request $request, int $service): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = $request->validate(['stage' => 'required|in:ANTES,DURANTE,DEPOIS', 'fileUrl' => 'required|string|max:4000000', 'caption' => 'sometimes|nullable|string|max:1000']);

        return DB::transaction(function () use ($request, $v, $service, $data) {
            $row = $this->providers->ownedRequest($v, $service, true);
            abort_if(in_array($row->status, ['cancelado', 'concluido'], true), 409, 'Atendimento encerrado.');
            $id = DB::table('service_evidences')->insertGetId(['condo_id' => $row->condo_id, 'request_id' => $row->id, 'vendor_id' => $v->id, 'stage' => $data['stage'], 'file_url' => $data['fileUrl'], 'caption' => $data['caption'] ?? null]);
            $this->providers->audit($request, $v, 'criar', 'evidencia', $id, 'Registrou evidência do atendimento '.$row->code);

            return response()->json(['data' => ['success' => true, 'evidenceId' => $id]], 201);
        });
    }

    public function complete(Request $request, int $service): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = [...$this->executionData($request), ...$request->validate(['finalNotes' => 'sometimes|nullable|string|max:10000', 'finalPhotos' => 'sometimes|array|max:30', 'finalPhotos.*' => 'string|max:4000000'])];

        return DB::transaction(function () use ($request, $v, $service, $data) {
            $row = $this->providers->ownedRequest($v, $service, true);
            abort_unless(in_array($row->status, ['em_atendimento', 'correcao_solicitada'], true), 409, 'O serviço precisa estar em execução para solicitar a conclusão.');
            $values = ['status' => 'prestador_concluiu', 'completion_requested_at' => now(), 'updated_at' => now(), 'execution_notes' => $data['finalNotes'] ?? $row->execution_notes];
            if (isset($data['checklist'])) {
                $values['checklist'] = json_encode($data['checklist'], JSON_THROW_ON_ERROR);
            }
            if (isset($data['materialsUsed'])) {
                $values['materials_used'] = json_encode($data['materialsUsed'], JSON_THROW_ON_ERROR);
            }
            DB::table('service_requests')->where('id', $row->id)->update($values);
            foreach ($data['finalPhotos'] ?? [] as $url) {
                DB::table('service_evidences')->insert(['condo_id' => $row->condo_id, 'request_id' => $row->id, 'vendor_id' => $v->id, 'stage' => 'DEPOIS', 'file_url' => $url, 'caption' => 'Evidência de conclusão']);
            }
            $this->providers->message($request, $row, 'O profissional concluiu a execução e solicita validação. '.($data['finalNotes'] ?? ''));

            return response()->json(['data' => ['success' => true]]);
        });
    }

    public function quote(Request $request, int $service): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = $request->validate(['laborCents' => 'required|integer|min:0|max:100000000', 'materialsCents' => 'required|integer|min:0|max:100000000', 'description' => 'required|string|max:10000', 'estimatedDays' => 'sometimes|integer|min:1|max:365']);

        return DB::transaction(function () use ($request, $v, $service, $data) {
            $row = $this->providers->requests($v)->where('r.id', $service)->lockForUpdate()->first() ?? abort(404);
            abort_unless(in_array($row->status, [...ProviderService::OPEN_STATUSES, 'aceito', 'vistoria_realizada', 'diagnostico_registrado'], true), 409, 'Não é possível enviar proposta neste estado.');
            abort_if(DB::table('service_contracts')->where('request_id', $row->id)->exists(), 409, 'Serviço já possui contrato. Utilize um aditivo.');
            $existing = DB::table('service_quotes')->where('request_id', $row->id)->where('vendor_id', $v->id);
            abort_if((clone $existing)->whereIn('status', ['aceito', 'pago_protegido'])->exists(), 409, 'Proposta aceita não pode ser substituída.');
            $version = (int) ((clone $existing)->max('version') ?? 0) + 1;
            (clone $existing)->where('status', 'pendente')->update(['status' => 'substituida']);
            $total = $data['laborCents'] + $data['materialsCents'];
            $hours = DB::table('marketplace_settings')->where('condo_id', $row->condo_id)->value('default_quote_validity_hours') ?? 48;
            $expiry = now()->addHours((int) $hours);
            $id = DB::table('service_quotes')->insertGetId(['request_id' => $row->id, 'vendor_id' => $v->id, 'version' => $version, 'title' => 'Proposta de Serviço Residencial', 'scope_description' => $data['description'], 'labor_cents' => $data['laborCents'], 'materials_cents' => $data['materialsCents'], 'total_cents' => $total, 'estimated_days' => $data['estimatedDays'] ?? 1, 'warranty_days' => 90, 'description' => $data['description'], 'contract_hash' => hash('sha256', json_encode([$row->id, $v->id, $version, $total, $data, $expiry->toIso8601String()], JSON_THROW_ON_ERROR)), 'expires_at' => $expiry, 'valid_until' => $expiry, 'sent_at' => now(), 'status' => 'pendente']);
            DB::table('service_requests')->where('id', $row->id)->update(['status' => 'proposta_enviada', 'estimated_amount_cents' => $total, 'updated_at' => now()]);
            $this->providers->message($request, $row, 'Nova proposta de R$ '.number_format($total / 100, 2, ',', '.').' recebida.');

            return response()->json(['data' => ['success' => true, 'quoteId' => $id]], 201);
        });
    }
}
