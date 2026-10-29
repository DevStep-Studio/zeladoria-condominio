<?php

namespace App\Http\Controllers\Api;

use App\Models\Condominium;
use App\Models\IncidentActivity;
use App\Models\IncidentOccurrence;
use App\Models\MonitoringRule;
use App\Models\SystemIncident;
use App\Models\User;
use App\Services\SessionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class SystemAlertController
{
    public function __construct(private SessionService $sessions) {}

    private function context(Request $request, ?array $roles = null): array
    {
        $ctx = $this->sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
        if ($roles !== null) {
            $isSuperAdmin = ($ctx['user']['isSuperAdmin'] ?? false) || ($ctx['role'] ?? '') === 'superadmin';
            if (! $isSuperAdmin) {
                abort_unless(in_array($ctx['role'] ?? '', $roles, true), 403, 'Perfil não autorizado.');
            }
        }

        return $ctx;
    }

    private function isPlatformAdmin(array $ctx): bool
    {
        return ($ctx['user']['isSuperAdmin'] ?? false) || ($ctx['role'] ?? '') === 'superadmin';
    }

    private function applyTenancyScope($query, array $ctx, ?int $requestedCondoId = null)
    {
        if ($this->isPlatformAdmin($ctx)) {
            if ($requestedCondoId) {
                $query->where('condo_id', $requestedCondoId);
            }

            return $query;
        }

        $condoId = $ctx['condo']['id'] ?? abort(403, 'Acesso restrito ao condomínio ativo.');

        return $query->where(function ($q) use ($condoId) {
            $q->where('condo_id', $condoId)->orWhereNull('condo_id');
        });
    }

    public function index(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $tab = $request->query('tab', 'visao-geral');
        $q = trim((string) $request->query('q', ''));
        $priority = $request->query('priority');
        $status = $request->query('status');
        $module = $request->query('module');
        $type = $request->query('type');
        $condoId = $request->integer('filterCondoId') ?: null;
        $assignee = $request->query('assignee');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');
        $sortBy = $request->query('sortBy', 'last_seen_at');
        $sortDir = strtolower($request->query('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $page = max(1, $request->integer('page', 1));
        $perPage = min(100, max(5, $request->integer('perPage', 15)));

        // Base query with tenancy isolation
        $query = SystemIncident::query();
        $this->applyTenancyScope($query, $ctx, $condoId);

        // Calculate real KPIs based on database records within user scope
        $kpiBaseQuery = SystemIncident::query();
        $this->applyTenancyScope($kpiBaseQuery, $ctx, $condoId);

        $nowBR = now('America/Sao_Paulo');
        $todayStart = $nowBR->copy()->startOfDay()->toDateTimeString();
        $todayEnd = $nowBR->copy()->endOfDay()->toDateTimeString();

        $activeStatuses = ['aberto', 'reconhecido', 'em_analise'];

        $kpis = [
            'activeAlerts' => (clone $kpiBaseQuery)
                ->where('type', 'aviso')
                ->whereIn('status', $activeStatuses)
                ->count(),
            'criticalErrors' => (clone $kpiBaseQuery)
                ->where('priority', 'P0')
                ->whereIn('status', $activeStatuses)
                ->count(),
            'inAnalysis' => (clone $kpiBaseQuery)
                ->where('status', 'em_analise')
                ->count(),
            'resolvedToday' => (clone $kpiBaseQuery)
                ->where('status', 'resolvido')
                ->whereBetween('resolved_at', [$todayStart, $todayEnd])
                ->count(),
            'unassigned' => (clone $kpiBaseQuery)
                ->whereIn('status', $activeStatuses)
                ->where(function ($sub) {
                    $sub->whereNull('assignee_name')
                        ->orWhere('assignee_name', '')
                        ->orWhereNull('assignee_id');
                })
                ->count(),
        ];

        // Apply Tab filters
        match ($tab) {
            'operacionais' => $query->where('type', 'aviso'),
            'tecnicos' => $query->where('type', 'erro'),
            'historico' => $query->whereIn('status', ['resolvido', 'encerrado']),
            default => $query->whereIn('status', $activeStatuses), // 'visao-geral'
        };

        // Filters
        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('code', 'like', "%{$q}%")
                    ->orWhere('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('source_module', 'like', "%{$q}%");
            });
        }

        if ($priority && in_array($priority, ['P0', 'P1', 'P2', 'P3'], true)) {
            $query->where('priority', $priority);
        }

        if ($type && in_array($type, ['aviso', 'erro'], true)) {
            $query->where('type', $type);
        }

        if ($status) {
            if ($status === 'ativos') {
                $query->whereIn('status', $activeStatuses);
            } elseif (in_array($status, ['aberto', 'reconhecido', 'em_analise', 'resolvido', 'encerrado'], true)) {
                $query->where('status', $status);
            }
        }

        if ($module) {
            $query->where('source_module', $module);
        }

        if ($assignee) {
            if ($assignee === 'sem_responsavel') {
                $query->where(function ($sub) {
                    $sub->whereNull('assignee_name')->orWhere('assignee_name', '')->orWhereNull('assignee_id');
                });
            } else {
                $query->where('assignee_name', 'like', "%{$assignee}%");
            }
        }

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('created_at', '<=', $endDate.' 23:59:59');
        }

        // Ordering: if visao-geral and default sort, prioritize severity: P0 > P1 > P2 > P3
        if ($tab === 'visao-geral' && $sortBy === 'last_seen_at') {
            $query->orderByRaw("CASE priority WHEN 'P0' THEN 1 WHEN 'P1' THEN 2 WHEN 'P2' THEN 3 WHEN 'P3' THEN 4 ELSE 5 END ASC")
                ->orderByDesc('last_seen_at');
        } else {
            $validSortColumns = ['code', 'title', 'type', 'source_module', 'priority', 'status', 'assignee_name', 'last_seen_at', 'created_at', 'occurrences_count'];
            $sortColumn = in_array($sortBy, $validSortColumns, true) ? $sortBy : 'last_seen_at';
            $query->orderBy($sortColumn, $sortDir);
        }

        $total = $query->count();
        $incidents = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        // Sanitize technical diagnosis if non-technical
        $isTech = $this->isPlatformAdmin($ctx);
        $mapped = $incidents->map(function ($inc) use ($isTech) {
            $item = $inc->toArray();
            if (! $isTech) {
                unset($item['stack_trace']);
                if (isset($item['technical_context']['debug'])) {
                    unset($item['technical_context']['debug']);
                }
            }

            return $item;
        });

        // Available modules for filter dropdown
        $modules = SystemIncident::query()->distinct()->pluck('source_module')->filter()->values();

        return response()->json([
            'data' => [
                'incidents' => $mapped,
                'kpis' => $kpis,
                'pagination' => [
                    'page' => $page,
                    'perPage' => $perPage,
                    'total' => $total,
                    'totalPages' => (int) ceil($total / $perPage),
                ],
                'modules' => $modules,
                'serverTime' => now('America/Sao_Paulo')->toIso8601String(),
            ],
        ]);
    }

    public function show(Request $request, int $incidentId): JsonResponse
    {
        $ctx = $this->context($request);
        $incident = SystemIncident::with(['activities', 'occurrences'])->find($incidentId) ?? abort(404, 'Incidente não encontrado.');

        // Tenancy check
        if (! $this->isPlatformAdmin($ctx) && $incident->condo_id && $incident->condo_id !== ($ctx['condo']['id'] ?? 0)) {
            abort(403, 'Acesso não autorizado a este incidente.');
        }

        $data = $incident->toArray();
        if (! $this->isPlatformAdmin($ctx)) {
            unset($data['stack_trace']);
            if (isset($data['technical_context']['debug'])) {
                unset($data['technical_context']['debug']);
            }
        }

        return response()->json(['data' => $data]);
    }

    public function storeManual(Request $request): JsonResponse
    {
        $ctx = $this->context($request, ['superadmin', 'sindico']);
        $validated = $request->validate([
            'title' => 'required|string|min:4|max:200',
            'description' => 'required|string|min:10|max:5000',
            'type' => 'required|in:aviso,erro',
            'priority' => 'required|in:P0,P1,P2,P3',
            'category' => 'sometimes|nullable|string|max:60',
            'source_module' => 'sometimes|nullable|string|max:60',
            'condo_id' => 'sometimes|nullable|integer',
            'assignee_id' => 'sometimes|nullable|integer',
            'assignee_name' => 'sometimes|nullable|string|max:140',
            'start_date' => 'sometimes|nullable|string',
            'end_date' => 'sometimes|nullable|string',
            'recommended_action' => 'sometimes|nullable|string|max:1000',
            'target_audience' => 'sometimes|nullable|string|max:60',
            'notify' => 'sometimes|boolean',
        ]);

        $condoId = $validated['condo_id'] ?? ($ctx['condo']['id'] ?? null);
        $condoName = null;
        if ($condoId) {
            $c = Condominium::find($condoId);
            $condoName = $c ? $c->name : null;
        }

        $code = 'INC-'.str_pad((string) (SystemIncident::max('id') + 1), 5, '0', STR_PAD_LEFT);

        $incident = SystemIncident::create([
            'code' => $code,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'type' => $validated['type'],
            'category' => $validated['category'] ?: 'administrativo',
            'source_module' => $validated['source_module'] ?: 'Administração Condominial',
            'priority' => $validated['priority'],
            'status' => 'aberto',
            'condo_id' => $condoId,
            'condo_name' => $condoName,
            'assignee_id' => $validated['assignee_id'] ?? null,
            'assignee_name' => $validated['assignee_name'] ?? null,
            'is_manual' => true,
            'start_date' => ! empty($validated['start_date']) ? CarbonImmutable::parse($validated['start_date']) : now(),
            'end_date' => ! empty($validated['end_date']) ? CarbonImmutable::parse($validated['end_date']) : null,
            'recommended_action' => $validated['recommended_action'] ?? null,
            'target_audience' => $validated['target_audience'] ?? 'todos',
            'first_seen_at' => now(),
            'last_seen_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Activity log
        IncidentActivity::create([
            'incident_id' => $incident->id,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'criado',
            'notes' => 'Aviso administrativo registrado manualmente.',
            'created_at' => now(),
        ]);

        // Optional notification dispatch
        if (! empty($validated['notify']) && $condoId) {
            DB::table('notifications')->insert([
                'condo_id' => $condoId,
                'user_id' => $request->user()->id,
                'title' => 'Aviso Administrativo: '.$validated['title'],
                'body' => mb_substr($validated['description'], 0, 180),
                'channel' => 'painel',
                'link' => '/painel/sistema/avisos-erros',
                'created_at' => now(),
            ]);
        }

        return response()->json(['data' => $incident], 201);
    }

    public function updateStatus(Request $request, int $incidentId): JsonResponse
    {
        $ctx = $this->context($request);
        $incident = SystemIncident::find($incidentId) ?? abort(404);

        $validated = $request->validate([
            'status' => 'required|in:aberto,reconhecido,em_analise,resolvido,encerrado',
            'resolution_notes' => 'required_if:status,resolvido|nullable|string|min:5|max:2000',
            'notes' => 'sometimes|nullable|string|max:1000',
        ]);

        $oldStatus = $incident->status;
        $newStatus = $validated['status'];

        $updates = [
            'status' => $newStatus,
            'updated_at' => now(),
        ];

        if ($newStatus === 'resolvido') {
            $updates['resolved_at'] = now();
            $updates['resolved_by_id'] = $request->user()->id;
            $updates['resolved_by_name'] = $request->user()->name;
            $updates['resolution_notes'] = $validated['resolution_notes'];
        } elseif ($newStatus === 'aberto' && in_array($oldStatus, ['resolvido', 'encerrado'], true)) {
            // Reabertura
            $updates['resolved_at'] = null;
            $updates['resolved_by_id'] = null;
            $updates['resolved_by_name'] = null;
        }

        $incident->update($updates);

        IncidentActivity::create([
            'incident_id' => $incident->id,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => $newStatus === 'resolvido' ? 'resolvido' : ($oldStatus === 'resolvido' ? 'reaberto' : 'status_alterado'),
            'notes' => $validated['resolution_notes'] ?? ($validated['notes'] ?? "Status alterado de '{$oldStatus}' para '{$newStatus}'."),
            'metadata' => ['from' => $oldStatus, 'to' => $newStatus],
            'created_at' => now(),
        ]);

        return response()->json(['data' => $incident->fresh(['activities'])]);
    }

    public function updateAssignee(Request $request, int $incidentId): JsonResponse
    {
        $this->context($request);
        $incident = SystemIncident::find($incidentId) ?? abort(404);

        $validated = $request->validate([
            'assignee_id' => 'sometimes|nullable|integer',
            'assignee_name' => 'required|string|max:140',
        ]);

        $oldAssignee = $incident->assignee_name ?: 'Sem responsável';
        $newAssignee = $validated['assignee_name'];

        $updates = [
            'assignee_id' => $validated['assignee_id'] ?? null,
            'assignee_name' => $newAssignee,
            'updated_at' => now(),
        ];

        // Move to em_analise if was aberto
        if ($incident->status === 'aberto') {
            $updates['status'] = 'em_analise';
        }

        $incident->update($updates);

        IncidentActivity::create([
            'incident_id' => $incident->id,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'atribuido',
            'notes' => "Responsável alterado de '{$oldAssignee}' para '{$newAssignee}'.",
            'metadata' => ['old_assignee' => $oldAssignee, 'new_assignee' => $newAssignee],
            'created_at' => now(),
        ]);

        return response()->json(['data' => $incident->fresh(['activities'])]);
    }

    public function updatePriority(Request $request, int $incidentId): JsonResponse
    {
        $this->context($request);
        $incident = SystemIncident::find($incidentId) ?? abort(404);

        $validated = $request->validate([
            'priority' => 'required|in:P0,P1,P2,P3',
            'reason' => 'sometimes|nullable|string|max:500',
        ]);

        $oldPriority = $incident->priority;
        $newPriority = $validated['priority'];

        $incident->update([
            'priority' => $newPriority,
            'updated_at' => now(),
        ]);

        IncidentActivity::create([
            'incident_id' => $incident->id,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'prioridade_alterada',
            'notes' => "Prioridade alterada de '{$oldPriority}' para '{$newPriority}'.".(! empty($validated['reason']) ? " Motivo: {$validated['reason']}" : ''),
            'metadata' => ['from' => $oldPriority, 'to' => $newPriority],
            'created_at' => now(),
        ]);

        return response()->json(['data' => $incident->fresh(['activities'])]);
    }

    public function addComment(Request $request, int $incidentId): JsonResponse
    {
        $this->context($request);
        $incident = SystemIncident::find($incidentId) ?? abort(404);

        $validated = $request->validate([
            'comment' => 'required|string|min:2|max:2000',
        ]);

        $activity = IncidentActivity::create([
            'incident_id' => $incident->id,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'comentario',
            'notes' => $validated['comment'],
            'created_at' => now(),
        ]);

        return response()->json(['data' => $activity], 201);
    }

    public function reportError(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
            'error_type' => 'sometimes|nullable|string|max:100',
            'source_module' => 'sometimes|nullable|string|max:100',
            'condo_id' => 'sometimes|nullable|integer',
            'correlation_id' => 'sometimes|nullable|string|max:64',
            'stack_trace' => 'sometimes|nullable|string',
            'context' => 'sometimes|nullable|array',
            'environment' => 'sometimes|nullable|string|max:40',
            'app_version' => 'sometimes|nullable|string|max:30',
        ]);

        $message = $validated['message'];
        $errorType = $validated['error_type'] ?: 'UnhandledException';
        $sourceModule = $validated['source_module'] ?: 'Backend API';
        $environment = $validated['environment'] ?: 'production';
        $correlationId = $validated['correlation_id'] ?: ('CORR-'.bin2hex(random_bytes(8)));

        // Deterministic fingerprint for intelligent grouping
        $normalizedMsg = preg_replace('/[0-9a-f]{8}-[0-9a-f]{4}/i', '<UUID>', $message);
        $normalizedMsg = preg_replace('/\d+/', '<N>', $normalizedMsg);
        $fingerprint = hash('sha256', "{$errorType}::{$sourceModule}::{$normalizedMsg}");

        // Search for existing open incident
        $existing = SystemIncident::where('fingerprint', $fingerprint)
            ->whereIn('status', ['aberto', 'reconhecido', 'em_analise'])
            ->first();

        if ($existing) {
            $newCount = $existing->occurrences_count + 1;
            $updates = [
                'occurrences_count' => $newCount,
                'last_seen_at' => now(),
                'updated_at' => now(),
            ];

            // Escalation rule: if recurring > 10 times in production, escalate to P0
            if ($newCount >= 10 && $existing->priority !== 'P0') {
                $updates['priority'] = 'P0';
                IncidentActivity::create([
                    'incident_id' => $existing->id,
                    'user_id' => null,
                    'user_name' => 'Sistema (Escalonamento Automático)',
                    'action' => 'prioridade_alterada',
                    'notes' => "Prioridade elevada para P0 devido à alta frequência ({$newCount} repetições).",
                    'metadata' => ['trigger' => 'frequency_threshold', 'count' => $newCount],
                    'created_at' => now(),
                ]);
            }

            $existing->update($updates);

            IncidentOccurrence::create([
                'incident_id' => $existing->id,
                'correlation_id' => $correlationId,
                'message' => $message,
                'context' => $validated['context'] ?? null,
                'created_at' => now(),
            ]);

            return response()->json(['data' => $existing, 'grouped' => true]);
        }

        // New Incident
        $code = 'INC-'.str_pad((string) (SystemIncident::max('id') + 1), 5, '0', STR_PAD_LEFT);
        $incident = SystemIncident::create([
            'code' => $code,
            'title' => "[{$errorType}] ".mb_substr($message, 0, 120),
            'description' => $message,
            'type' => 'erro',
            'category' => 'tecnico',
            'source_module' => $sourceModule,
            'priority' => 'P1',
            'status' => 'aberto',
            'condo_id' => $validated['condo_id'] ?? null,
            'fingerprint' => $fingerprint,
            'occurrences_count' => 1,
            'first_seen_at' => now(),
            'last_seen_at' => now(),
            'environment' => $environment,
            'correlation_id' => $correlationId,
            'app_version' => $validated['app_version'] ?: '1.0.0',
            'technical_context' => $validated['context'] ?? null,
            'stack_trace' => $validated['stack_trace'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        IncidentActivity::create([
            'incident_id' => $incident->id,
            'user_id' => null,
            'user_name' => 'Monitoramento Automático',
            'action' => 'criado',
            'notes' => 'Erro técnico capturado e indexado com sucesso.',
            'created_at' => now(),
        ]);

        IncidentOccurrence::create([
            'incident_id' => $incident->id,
            'correlation_id' => $correlationId,
            'message' => $message,
            'context' => $validated['context'] ?? null,
            'created_at' => now(),
        ]);

        return response()->json(['data' => $incident, 'grouped' => false], 201);
    }

    public function rules(Request $request): JsonResponse
    {
        $this->context($request);
        $rules = MonitoringRule::orderBy('id')->get();

        return response()->json(['data' => $rules]);
    }

    public function updateRule(Request $request, int $ruleId): JsonResponse
    {
        $this->context($request, ['superadmin']);
        $rule = MonitoringRule::find($ruleId) ?? abort(404);

        $validated = $request->validate([
            'active' => 'sometimes|boolean',
            'threshold' => 'sometimes|integer|min:1',
            'window_minutes' => 'sometimes|integer|min:1',
            'priority' => 'sometimes|in:P0,P1,P2,P3',
        ]);

        $rule->update($validated);

        return response()->json(['data' => $rule]);
    }
}
