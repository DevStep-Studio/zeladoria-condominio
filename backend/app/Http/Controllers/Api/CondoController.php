<?php

namespace App\Http\Controllers\Api;

use App\Services\OperationService;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class CondoController
{
    public function __construct(private SessionService $sessions, private OperationService $operations) {}

    private function context(Request $request, ?array $roles = null): array
    {
        $ctx = $this->sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
        abort_unless($ctx['condo'], 403);
        if ($request->integer('condoId')) {
            abort_unless($ctx['condo']['id'] === $request->integer('condoId'), 404);
        }
        if ($roles !== null) {
            abort_unless(in_array($ctx['role'], $roles, true), 403);
        }

        return $ctx;
    }

    public function painelLayout(Request $request): JsonResponse
    {
        $ctx = $this->sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
        $condoId = $ctx['condo']['id'] ?? 0;
        $unreadRow = $this->operations->execute('app.painel.layout.001', [$request->user()->id])[0] ?? ['count' => 0];
        $annRow = $this->operations->execute('app.painel.layout.002', [$condoId])[0] ?? ['annCount' => 0];

        $criticalIncidentsCount = 0;
        try {
            $incidentQuery = DB::table('system_incidents')
                ->where('priority', 'P0')
                ->whereIn('status', ['aberto', 'reconhecido', 'em_analise']);
            if (! (($ctx['user']['isSuperAdmin'] ?? false) || ($ctx['role'] ?? '') === 'superadmin')) {
                if ($condoId) {
                    $incidentQuery->where(function ($q) use ($condoId) {
                        $q->where('condo_id', $condoId)->orWhereNull('condo_id');
                    });
                }
            }
            $criticalIncidentsCount = (int) $incidentQuery->count();
        } catch (\Throwable) {
            $criticalIncidentsCount = 0;
        }

        return response()->json(['data' => [
            'unread' => (int) ($unreadRow['count'] ?? 0),
            'annCount' => (int) ($annRow['annCount'] ?? 0),
            'criticalIncidentsCount' => $criticalIncidentsCount,
        ]]);
    }

    public function storeAgenda(Request $request): JsonResponse
    {
        $ctx = $this->context($request, ['superadmin', 'sindico', 'conselho', 'zelador', 'porteiro', 'morador']);
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'date' => 'required|string|max:20',
            'startTime' => 'sometimes|nullable|string|max:16',
            'endTime' => 'sometimes|nullable|string|max:16',
            'category' => 'sometimes|nullable|string|max:60',
            'location' => 'sometimes|nullable|string|max:160',
            'description' => 'sometimes|nullable|string|max:5000',
            'responsible' => 'sometimes|nullable|string|max:160',
            'audienceScope' => 'sometimes|nullable|string|max:60',
            'reminder' => 'sometimes|nullable|string|max:40',
            'recurrence' => 'sometimes|nullable|string|max:40',
            'amenityId' => 'sometimes|nullable|integer|min:1',
        ]);
        $condoId = $ctx['condo']['id'];
        $startTime = $data['startTime'] ?: '08:00';
        $endTime = $data['endTime'] ?: '10:00';
        $amenityId = $data['amenityId'] ?? null;

        if ($amenityId) {
            $conflicting = $this->operations->execute('lib.actions.agenda.002', [$condoId, $amenityId, $data['date']]);
            foreach ($conflicting as $r) {
                if (($startTime >= $r['startTime'] && $startTime < $r['endTime']) ||
                    ($endTime > $r['startTime'] && $endTime <= $r['endTime']) ||
                    ($startTime <= $r['startTime'] && $endTime >= $r['endTime'])) {
                    abort(409, 'O espaço selecionado já possui uma reserva confirmada neste horário.');
                }
            }
        }

        $location = $data['location'] ?: 'Área Comum';
        $rows = $this->operations->execute('lib.actions.agenda.003', [[
            'condoId' => $condoId,
            'title' => trim($data['title']),
            'description' => $data['description'] ?? '',
            'category' => $data['category'] ?: 'evento',
            'date' => $data['date'],
            'startTime' => $startTime,
            'endTime' => $endTime,
            'location' => $location,
            'responsible' => $data['responsible'] ?: $request->user()->name,
            'audienceScope' => $data['audienceScope'] ?: 'todos',
            'reminder' => $data['reminder'] ?: '1d',
            'recurrence' => $data['recurrence'] ?: 'nenhuma',
            'status' => 'agendado',
            'amenityId' => $amenityId,
            'createdById' => $request->user()->id,
        ]]);
        $row = $rows[0];

        $residents = $this->operations->execute('lib.actions.agenda.001', [$condoId]);
        $userIds = array_values(array_unique(array_filter(array_column($residents, 'userId'))));
        if ($userIds) {
            $this->operations->execute('lib.audit.002', [array_map(fn ($uid) => [
                'condoId' => $condoId,
                'userId' => $uid,
                'title' => "Novo compromisso na Agenda: {$data['title']}",
                'body' => "Data: {$data['date']} das {$startTime} às {$endTime} em {$location}",
                'link' => '/painel/agenda',
                'channel' => 'app',
            ], $userIds)]);
        }

        DB::table('audit_logs')->insert([
            'condo_id' => $condoId,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'criar',
            'entity' => 'agenda_event',
            'entity_id' => (string) $row['id'],
            'summary' => mb_substr("Criou evento \"{$data['title']}\" para {$data['date']} ({$startTime}-{$endTime})", 0, 235),
            'origin' => 'api',
        ]);

        return response()->json(['data' => ['success' => true, 'id' => $row['id']]], 201);
    }

    public function destroyAgenda(Request $request, int $event): JsonResponse
    {
        $ctx = $this->context($request, ['superadmin', 'sindico', 'zelador']);
        $condoId = $ctx['condo']['id'];
        $rows = $this->operations->execute('lib.actions.agenda.004', [$event, $condoId]);
        $row = $rows[0] ?? abort(404, 'Evento não encontrado.');
        $this->operations->execute('lib.actions.agenda.005', [$event]);

        DB::table('audit_logs')->insert([
            'condo_id' => $condoId,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'excluir',
            'entity' => 'agenda_event',
            'entity_id' => (string) $event,
            'summary' => mb_substr("Excluiu evento \"{$row['title']}\" da agenda", 0, 235),
            'critical' => true,
            'origin' => 'api',
        ]);

        return response()->json(['data' => ['success' => true]]);
    }

    public function storeOccurrence(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string|max:10000',
            'category' => 'sometimes|nullable|string|max:60',
            'severity' => 'sometimes|nullable|string|max:40',
            'visibility' => 'sometimes|nullable|string|max:40',
            'exactLocation' => 'sometimes|nullable|string|max:200',
            'unitId' => 'sometimes|nullable|integer|min:1',
            'latitude' => 'sometimes|nullable|numeric',
            'longitude' => 'sometimes|nullable|numeric',
            'attachments' => 'sometimes|array|max:4',
            'attachments.*' => 'string|max:4000000',
        ]);
        $condoId = $ctx['condo']['id'];
        $countRow = $this->operations->execute('lib.actions.ocorrencias.001', [$condoId])[0] ?? ['n' => 0];
        $code = 'OC-'.str_pad((string) (((int) ($countRow['n'] ?? 0)) + 101), 4, '0', STR_PAD_LEFT);
        $severity = $data['severity'] ?: 'media';
        $visibility = $data['visibility'] ?: 'publica';
        $unitId = $ctx['role'] === 'morador' ? $ctx['unitId'] : ($data['unitId'] ?? $ctx['unitId'] ?? null);

        $rows = $this->operations->execute('lib.actions.ocorrencias.002', [[
            'condoId' => $condoId,
            'code' => $code,
            'title' => trim($data['title']),
            'description' => trim($data['description']),
            'category' => $data['category'] ?: 'seguranca',
            'severity' => $severity,
            'visibility' => $visibility,
            'exactLocation' => $data['exactLocation'] ?? '',
            'latitude' => isset($data['latitude']) ? (float) $data['latitude'] : null,
            'longitude' => isset($data['longitude']) ? (float) $data['longitude'] : null,
            'unitId' => $unitId,
            'attachments' => $data['attachments'] ?? [],
            'status' => 'recebida',
            'reportedById' => $request->user()->id,
            'occurredAt' => ['$date' => now()->toIso8601String()],
        ]]);
        $occ = $rows[0];

        $sindicos = $this->operations->execute('lib.actions.ocorrencias.003', [$condoId]);
        $userIds = array_values(array_unique(array_filter(array_column($sindicos, 'userId'))));
        if ($userIds) {
            $this->operations->execute('lib.audit.002', [array_map(fn ($uid) => [
                'condoId' => $condoId,
                'userId' => $uid,
                'title' => "Nova ocorrência registrada: {$occ['code']}",
                'body' => "{$data['title']} [".mb_strtoupper($severity)."] - Registrada por {$request->user()->name}",
                'link' => '/painel/ocorrencias',
                'channel' => 'app',
            ], $userIds)]);
        }

        DB::table('audit_logs')->insert([
            'condo_id' => $condoId,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'criar',
            'entity' => 'ocorrencia',
            'entity_id' => (string) $occ['id'],
            'summary' => mb_substr("Registrou ocorrência {$occ['code']}: {$data['title']} ({$visibility})", 0, 235),
            'origin' => 'api',
        ]);

        return response()->json(['data' => ['success' => true, 'code' => $occ['code'], 'id' => $occ['id']]], 201);
    }

    public function updateOccurrenceStatus(Request $request, int $occurrence): JsonResponse
    {
        $ctx = $this->context($request, ['superadmin', 'sindico', 'conselho', 'zelador', 'porteiro']);
        $condoId = $ctx['condo']['id'];
        $existing = $this->operations->execute('lib.actions.ocorrencias.004', [$occurrence, $condoId])[0] ?? abort(404, 'Ocorrência não encontrada.');
        $status = $request->input('status') ?: $existing['status'];
        $actionsTaken = $request->input('actionsTaken') ?: $existing['actionsTaken'];
        $assignedToId = ((int) $request->input('assignedToId')) ?: $existing['assignedToId'];
        $comment = trim((string) $request->input('comment', ''));
        $isResolved = $status === 'resolvida';

        $this->operations->execute('lib.actions.ocorrencias.005', [[
            'status' => $status,
            'actionsTaken' => $actionsTaken,
            'assignedToId' => $assignedToId ?: null,
            'resolvedAt' => $isResolved ? ['$date' => now()->toIso8601String()] : $existing['resolvedAt'],
            'ackById' => $request->user()->id,
            'ackAt' => ['$date' => now()->toIso8601String()],
        ], $occurrence]);

        if ($comment !== '') {
            $this->operations->execute('lib.actions.ocorrencias.006', [[
                'occurrenceId' => $occurrence,
                'userId' => $request->user()->id,
                'body' => $comment,
                'internal' => false,
            ]]);
        }

        if (! empty($existing['reportedById'])) {
            $this->operations->execute('lib.audit.002', [[[
                'condoId' => $condoId,
                'userId' => $existing['reportedById'],
                'title' => "Atualização na ocorrência {$existing['code']}",
                'body' => 'O status foi alterado para: '.mb_strtoupper(str_replace('_', ' ', $status)),
                'link' => '/painel/ocorrencias',
                'channel' => 'app',
            ]]]);
        }

        DB::table('audit_logs')->insert([
            'condo_id' => $condoId,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'atualizar',
            'entity' => 'ocorrencia',
            'entity_id' => (string) $occurrence,
            'summary' => mb_substr("Atualizou status da ocorrência {$existing['code']} para {$status}", 0, 235),
            'origin' => 'api',
        ]);

        return response()->json(['data' => ['success' => true]]);
    }

    public function storeOccurrenceComment(Request $request, int $occurrence): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate(['body' => 'required|string|max:5000']);
        $condoId = $ctx['condo']['id'];
        $this->operations->execute('lib.actions.ocorrencias.007', [$occurrence, $condoId])[0] ?? abort(404, 'Ocorrência não encontrada.');
        $this->operations->execute('lib.actions.ocorrencias.008', [[
            'occurrenceId' => $occurrence,
            'userId' => $request->user()->id,
            'body' => trim($data['body']),
            'internal' => false,
        ]]);

        return response()->json(['data' => ['success' => true]], 201);
    }

    public function rateOccurrence(Request $request, int $occurrence): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'residentComment' => 'sometimes|nullable|string|max:2000',
        ]);
        $condoId = $ctx['condo']['id'];
        $existing = $this->operations->execute('lib.actions.ocorrencias.009', [$occurrence, $condoId])[0] ?? abort(404, 'Ocorrência não encontrada.');
        $this->operations->execute('lib.actions.ocorrencias.010', [[
            'residentRating' => $data['rating'],
            'residentComment' => $data['residentComment'] ?? '',
        ], $occurrence]);

        DB::table('audit_logs')->insert([
            'condo_id' => $condoId,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'avaliar',
            'entity' => 'ocorrencia',
            'entity_id' => (string) $occurrence,
            'summary' => mb_substr("Avaliou resolução da ocorrência {$existing['code']} com nota {$data['rating']}/5", 0, 235),
            'origin' => 'api',
        ]);

        return response()->json(['data' => ['success' => true]]);
    }

    public function reopenOccurrence(Request $request, int $occurrence): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $ctx['condo']['id'];
        $existing = $this->operations->execute('lib.actions.ocorrencias.011', [$occurrence, $condoId])[0] ?? abort(404, 'Ocorrência não encontrada.');
        $isReporter = ($existing['reportedById'] ?? null) === $request->user()->id;
        $isStaff = in_array($ctx['role'], ['superadmin', 'sindico', 'conselho', 'zelador'], true);
        abort_unless($isReporter || $isStaff, 403, 'Não autorizado a reabrir esta ocorrência.');

        $reason = trim((string) $request->input('reason', '')) ?: 'Morador indicou que o problema ainda persiste.';
        $this->operations->execute('lib.actions.ocorrencias.012', [[
            'status' => 'em_analise',
            'resolvedAt' => null,
        ], $occurrence]);
        $this->operations->execute('lib.actions.ocorrencias.013', [[
            'occurrenceId' => $occurrence,
            'userId' => $request->user()->id,
            'body' => "⚠️ [Ocorrência Reaberta]: {$reason}",
            'internal' => false,
        ]]);

        $sindicos = $this->operations->execute('lib.actions.ocorrencias.014', [$condoId]);
        $userIds = array_values(array_unique(array_filter(array_column($sindicos, 'userId'))));
        if ($userIds) {
            $this->operations->execute('lib.audit.002', [array_map(fn ($uid) => [
                'condoId' => $condoId,
                'userId' => $uid,
                'title' => "Ocorrência reaberta: {$existing['code']}",
                'body' => "{$request->user()->name} reabriu a ocorrência: \"{$reason}\"",
                'link' => "/painel/ocorrencias?highlight={$existing['code']}",
                'channel' => 'app',
            ], $userIds)]);
        }

        DB::table('audit_logs')->insert([
            'condo_id' => $condoId,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'atualizar',
            'entity' => 'ocorrencia',
            'entity_id' => (string) $occurrence,
            'summary' => mb_substr("Reabriu ocorrência {$existing['code']}: {$reason}", 0, 235),
            'origin' => 'api',
        ]);

        return response()->json(['data' => ['success' => true]]);
    }

    public function updateOccurrenceDetails(Request $request, int $occurrence): JsonResponse
    {
        $ctx = $this->context($request, ['superadmin', 'sindico', 'conselho', 'zelador', 'porteiro']);
        $condoId = $ctx['condo']['id'];
        $existing = $this->operations->execute('lib.actions.ocorrencias.015', [$occurrence, $condoId])[0] ?? abort(404, 'Ocorrência não encontrada.');
        $status = $request->input('status') ?: $existing['status'];
        $severity = $request->input('severity') ?: $existing['severity'];
        $rawAssigned = (string) $request->input('assignedToId', '');
        $assignedToId = $rawAssigned === 'none' ? null : (((int) $rawAssigned) ?: $existing['assignedToId']);
        $actionsTaken = $request->input('actionsTaken') ?: $existing['actionsTaken'];
        $comment = trim((string) $request->input('comment', ''));
        $isResolved = $status === 'resolvida';

        $this->operations->execute('lib.actions.ocorrencias.016', [[
            'status' => $status,
            'severity' => $severity,
            'assignedToId' => $assignedToId ?: null,
            'actionsTaken' => $actionsTaken,
            'resolvedAt' => $isResolved ? ($existing['resolvedAt'] ?: ['$date' => now()->toIso8601String()]) : null,
            'ackById' => $request->user()->id,
            'ackAt' => $existing['ackAt'] ?: ['$date' => now()->toIso8601String()],
        ], $occurrence]);

        if ($comment !== '') {
            $this->operations->execute('lib.actions.ocorrencias.017', [[
                'occurrenceId' => $occurrence,
                'userId' => $request->user()->id,
                'body' => $comment,
                'internal' => false,
            ]]);
        }

        if (! empty($existing['reportedById']) && $status !== $existing['status']) {
            $this->operations->execute('lib.audit.002', [[[
                'condoId' => $condoId,
                'userId' => $existing['reportedById'],
                'title' => "Atualização na ocorrência {$existing['code']}",
                'body' => 'O status foi alterado para: '.mb_strtoupper(str_replace('_', ' ', $status)),
                'link' => "/painel/ocorrencias?highlight={$existing['code']}",
                'channel' => 'app',
            ]]]);
        }

        DB::table('audit_logs')->insert([
            'condo_id' => $condoId,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'atualizar',
            'entity' => 'ocorrencia',
            'entity_id' => (string) $occurrence,
            'summary' => mb_substr("Atualizou ocorrência {$existing['code']} (Status: {$status}, Severidade: {$severity})", 0, 235),
            'origin' => 'api',
        ]);

        return response()->json(['data' => ['success' => true]]);
    }

    public function paymentOrderByCode(Request $request, string $code): JsonResponse
    {
        $this->sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
        $rows = $this->operations->execute('lib.actions.zeladoria-pay.001', [$code]);
        $order = $rows[0] ?? abort(404, 'Ordem de pagamento não encontrada.');

        return response()->json(['data' => $order]);
    }

    public function updateMarketplaceSettings(Request $request): JsonResponse
    {
        $ctx = $this->context($request, ['superadmin', 'sindico']);
        $data = $request->validate([
            'commissionPercent' => 'required|numeric|min:0|max:100',
            'slotHoldMinutes' => 'sometimes|nullable|integer|min:1|max:1440',
            'inspectionFeeMaxCents' => 'sometimes|nullable|integer|min:0',
            'disputeWindowHours' => 'sometimes|nullable|integer|min:1',
            'autoReleaseHours' => 'sometimes|nullable|integer|min:1',
        ]);
        $condoId = $ctx['condo']['id'];
        $existing = $this->operations->execute('lib.actions.zeladoria-pay.002', [$condoId])[0] ?? null;

        if ($existing) {
            $update = [
                'commissionPercent' => $data['commissionPercent'],
                'updatedAt' => ['$date' => now()->toIso8601String()],
            ];
            foreach (['slotHoldMinutes', 'inspectionFeeMaxCents', 'disputeWindowHours', 'autoReleaseHours'] as $key) {
                if (array_key_exists($key, $data) && $data[$key] !== null) {
                    $update[$key] = $data[$key];
                }
            }
            $this->operations->execute('lib.actions.zeladoria-pay.003', [$update, $existing['id']]);
        } else {
            $this->operations->execute('lib.actions.zeladoria-pay.004', [[
                'condoId' => $condoId,
                'commissionPercent' => $data['commissionPercent'],
                'slotHoldMinutes' => $data['slotHoldMinutes'] ?? 10,
                'inspectionFeeMaxCents' => $data['inspectionFeeMaxCents'] ?? 15000,
                'disputeWindowHours' => $data['disputeWindowHours'] ?? 48,
                'autoReleaseHours' => $data['autoReleaseHours'] ?? 72,
            ]]);
        }

        return response()->json(['data' => ['success' => true]]);
    }
}
