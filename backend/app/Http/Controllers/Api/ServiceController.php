<?php

namespace App\Http\Controllers\Api;

use App\Services\OperationService;
use App\Services\ProviderService;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ServiceController
{
    public function __construct(private SessionService $sessions, private OperationService $operations, private ProviderService $rows) {}

    private function context(Request $request): array
    {
        $ctx = $this->sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
        abort_unless($ctx['condo'], 403);
        if ($request->integer('condoId')) {
            abort_unless($ctx['condo']['id'] === $request->integer('condoId'), 404);
        }
        abort_unless(in_array($ctx['role'], ['superadmin', 'sindico', 'conselho', 'zelador', 'porteiro', 'morador'], true), 403);

        return $ctx;
    }

    private function scoped(Request $request, array $ctx, int $id, bool $lock = false): object
    {
        $q = DB::table('service_requests')->where('id', $id)->where('condo_id', $ctx['condo']['id']);
        if (! in_array($ctx['role'], ['superadmin', 'sindico', 'conselho', 'zelador'], true)) {
            $q->where('customer_id', $request->user()->id);
        }
        if ($lock) {
            $q->lockForUpdate();
        }

        return $q->first() ?? abort(404);
    }

    public function index(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condo = $ctx['condo']['id'];
        $limited = ! in_array($ctx['role'], ['superadmin', 'sindico', 'conselho', 'zelador'], true);
        $read = fn ($n, $args) => $this->operations->execute('app.painel.servicos.page.'.$n, $args);
        $requests = $read('001', [$condo, $limited, $request->user()->id]);
        $ids = array_column($requests, 'id');
        $result = ['marketplaceRequests' => $requests, 'services' => $read('009', [$condo, $limited, $request->user()->id]), 'condoInfo' => $read('010', [$condo])[0], 'vendors' => $this->sanitizeVendors($read('011', [$condo])), 'initialFavorites' => array_column($read('012', [$request->user()->id]), 'vendorId')];
        foreach (['quotes' => '002', 'reviews' => '003', 'evidences' => '004', 'messages' => '005', 'inspections' => '006', 'paymentOrders' => '007', 'addendums' => '008'] as $key => $operation) {
            $result[$key] = $ids ? $read($operation, [$ids]) : [];
        }

        return response()->json(['data' => $result]);
    }

    private function sanitizeVendors(array $vendors): array
    {
        foreach ($vendors as &$vendor) {
            foreach (['bankInfo', 'pixInfo', 'identityVerification', 'documents', 'notes', 'email'] as $key) {
                $vendor[$key] = null;
            }
        }

        return $vendors;
    }

    public function providers(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condo = $ctx['condo']['id'];
        $vendors = $this->sanitizeVendors($this->operations->execute('lib.services.providers-query.001', [$condo]));
        $ids = array_column($vendors, 'id');

        return response()->json(['data' => ['vendorRows' => $vendors, 'ticketRows' => $ids ? $this->operations->execute('lib.services.providers-query.002', [$condo, $ids]) : [], 'serviceReviewRows' => $ids ? $this->operations->execute('lib.services.providers-query.003', [$ids]) : []]]);
    }

    public function history(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $requests = $this->operations->execute('lib.services.payments.payment-service.147', [$request->user()->id, $ctx['condo']['id']]);
        $byVendor = [];
        foreach ($requests as $row) {
            $id = $row['vendorId'];
            if (! $id) {
                continue;
            }
            $date = $row['completedAt'] ?? $row['createdAt'];
            $byVendor[$id] ??= ['count' => 0, 'date' => $date];
            $byVendor[$id]['count']++;
            if ($date['$date'] > $byVendor[$id]['date']['$date']) {
                $byVendor[$id]['date'] = $date;
            }
        }
        $vendors = $byVendor ? $this->sanitizeVendors($this->operations->execute('lib.services.payments.payment-service.148', [array_keys($byVendor)])) : [];
        foreach ($vendors as &$v) {
            $v['hireCount'] = $byVendor[$v['id']]['count'];
            $v['lastHiredAt'] = $byVendor[$v['id']]['date'];
        }
        usort($vendors, fn ($a, $b) => strcmp($b['lastHiredAt']['$date'], $a['lastHiredAt']['$date']));

        return response()->json(['data' => $vendors]);
    }

    public function store(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate(['vendorId' => 'sometimes|nullable|integer|min:1', 'mode' => 'required|in:on_demand,quote', 'category' => 'required|string|max:40', 'title' => 'required|string|max:200', 'description' => 'required|string|max:10000', 'urgency' => 'sometimes|in:agora,hoje,agendar,media,urgente', 'scheduledDate' => 'sometimes|nullable|date_format:Y-m-d', 'scheduledTimeSlot' => 'sometimes|nullable|string|max:80', 'location' => 'sometimes|nullable|string|max:160', 'attachments' => 'sometimes|array|max:30', 'attachments.*' => 'string|max:4000000']);

        return DB::transaction(function () use ($request, $ctx, $data) {
            $condoId = $ctx['condo']['id'];
            $vendor = isset($data['vendorId']) ? DB::table('vendors')->where('id', $data['vendorId'])->where('condo_id', $condoId)->where('active', true)->whereNotIn('onboarding_status', ['suspenso', 'rejeitado'])->first() ?? abort(404) : null;
            DB::table('condominiums')->where('id', $condoId)->lockForUpdate()->first();
            $code = 'SRV-'.now('America/Sao_Paulo')->year.'-'.str_pad((string) ((int) DB::table('service_requests')->where('condo_id', $condoId)->max('id') + 1), 4, '0', STR_PAD_LEFT).'-'.Str::upper(Str::random(4));
            $id = DB::table('service_requests')->insertGetId(['condo_id' => $condoId, 'customer_id' => $request->user()->id, 'unit_id' => $ctx['unitId'], 'vendor_id' => $vendor?->id, 'code' => $code, 'mode' => $data['mode'], 'category' => mb_strtolower($data['category']), 'title' => trim($data['title']), 'description' => trim($data['description']), 'urgency' => $data['urgency'] ?? ($data['mode'] === 'on_demand' ? 'agora' : 'hoje'), 'scheduled_date' => $data['scheduledDate'] ?? null, 'scheduled_time_slot' => $data['scheduledTimeSlot'] ?? null, 'location' => $data['location'] ?? 'Minha Unidade', 'attachments' => json_encode($data['attachments'] ?? [], JSON_THROW_ON_ERROR), 'status' => $data['mode'] === 'on_demand' && ! $vendor ? 'buscando_prestador' : 'solicitado']);
            DB::table('service_messages')->insert(['request_id' => $id, 'sender_id' => $request->user()->id, 'sender_role' => 'sistema', 'body' => 'Chamado registrado: '.$code]);
            if ($vendor?->user_id) {
                DB::table('notifications')->insert(['condo_id' => $condoId, 'user_id' => $vendor->user_id, 'title' => 'Novo chamado: '.$code, 'body' => trim($data['title']), 'link' => '/prestador/chamados']);
            }

            return response()->json(['data' => ['success' => true, 'requestId' => $id, 'code' => $code]], 201);
        });
    }

    public function show(Request $request, int $service): JsonResponse
    {
        $ctx = $this->context($request);
        $row = $this->scoped($request, $ctx, $service);

        return response()->json(['data' => ['request' => $this->rows->row('serviceRequests', $row), 'messages' => $this->rows->rows('serviceMessages', DB::table('service_messages')->where('request_id', $row->id)->orderBy('id')), 'quotes' => $this->rows->rows('serviceQuotes', DB::table('service_quotes')->where('request_id', $row->id)->orderByDesc('id'))]]);
    }

    public function message(Request $request, int $service): JsonResponse
    {
        $data = $request->validate(['body' => 'required|string|max:10000', 'attachmentUrl' => 'sometimes|nullable|string|max:4000000']);
        $vendor = DB::table('vendors')->where('user_id', $request->user()->id)->first();
        if ($vendor) {
            $vendor = $this->rows->vendor($request);
        }
        $row = $vendor ? DB::table('service_requests')->where('id', $service)->where('vendor_id', $vendor->id)->where('condo_id', $vendor->condo_id)->first() : null;
        if (! $row) {
            $row = $this->scoped($request, $this->context($request), $service);
        }
        $id = DB::table('service_messages')->insertGetId(['request_id' => $row->id, 'sender_id' => $request->user()->id, 'sender_role' => $vendor && $row->vendor_id === $vendor->id ? 'prestador' : 'morador', 'body' => trim($data['body']), 'attachment_url' => $data['attachmentUrl'] ?? null]);

        return response()->json(['data' => ['success' => true, 'message' => $this->rows->row('serviceMessages', DB::table('service_messages')->find($id))]], 201);
    }

    public function favorite(Request $request, int $vendor): JsonResponse
    {
        $ctx = $this->context($request);
        abort_unless(DB::table('vendors')->where('id', $vendor)->where('condo_id', $ctx['condo']['id'])->where('active', true)->exists(), 404);

        return DB::transaction(function () use ($request, $vendor) {
            DB::table('users')->where('id', $request->user()->id)->lockForUpdate()->first();
            $q = DB::table('customer_favorites')->where('customer_id', $request->user()->id)->where('vendor_id', $vendor);
            $exists = $q->exists();
            if ($exists) {
                $q->delete();
            } else {
                DB::table('customer_favorites')->insert(['customer_id' => $request->user()->id, 'vendor_id' => $vendor]);
            }

            return response()->json(['data' => ['success' => true, 'isFavorite' => ! $exists]]);
        });
    }

    public function review(Request $request, int $service): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate(['rating' => 'required|integer|between:1,5', 'punctualityRating' => 'sometimes|integer|between:1,5', 'qualityRating' => 'sometimes|integer|between:1,5', 'communicationRating' => 'sometimes|integer|between:1,5', 'costBenefitRating' => 'sometimes|integer|between:1,5', 'comment' => 'sometimes|nullable|string|max:5000', 'photos' => 'sometimes|array|max:20', 'photos.*' => 'string|max:4000000']);

        return DB::transaction(function () use ($request, $ctx, $service, $data) {
            $row = $this->scoped($request, $ctx, $service, true);
            abort_unless($row->customer_id === $request->user()->id && $row->status === 'concluido' && $row->vendor_id, 403, 'Apenas o contratante pode avaliar serviços concluídos.');
            abort_if(DB::table('service_reviews')->where('request_id', $row->id)->exists(), 409, 'Este serviço já foi avaliado.');
            $values = ['request_id' => $row->id, 'vendor_id' => $row->vendor_id, 'customer_id' => $request->user()->id, 'rating' => $data['rating'], 'comment' => $data['comment'] ?? null, 'photos' => json_encode($data['photos'] ?? [], JSON_THROW_ON_ERROR), 'is_verified' => true];
            foreach (['punctualityRating', 'qualityRating', 'communicationRating', 'costBenefitRating'] as $key) {
                $values[Str::snake($key)] = $data[$key] ?? $data['rating'];
            }
            $id = DB::table('service_reviews')->insertGetId($values);
            DB::table('vendors')->where('id', $row->vendor_id)->update(['rating' => (int) round((float) DB::table('service_reviews')->where('vendor_id', $row->vendor_id)->avg('rating'))]);

            return response()->json(['data' => ['success' => true, 'reviewId' => $id]], 201);
        });
    }

    public function notifyQuote(Request $request, int $quote): JsonResponse
    {
        $ctx = $this->context($request);
        $q = DB::table('service_quotes')->where('id', $quote)->first();
        if ($q) {
            $vendor = DB::table('vendors')->where('id', $q->vendor_id)->first();
            if ($vendor?->user_id) {
                DB::table('notifications')->insert([
                    'condo_id' => $ctx['condo']['id'],
                    'user_id' => $vendor->user_id,
                    'title' => 'Orçamento aprovado pelo cliente!',
                    'body' => 'Sua proposta de R$ '.number_format($q->total_cents / 100, 2, '.', '').' foi aprovada sob proteção Zeladoria Protege.',
                    'link' => '/prestador/chamados',
                    'channel' => 'app',
                ]);
            }
        }

        return response()->json(['data' => ['success' => true]]);
    }

    public function confirmCompletion(Request $request, int $service): JsonResponse
    {
        $ctx = $this->context($request);

        return DB::transaction(function () use ($request, $ctx, $service) {
            $row = DB::table('service_requests')->where('id', $service)->where('condo_id', $ctx['condo']['id'])->lockForUpdate()->first() ?? abort(404, 'Chamado não encontrado.');
            abort_unless($row->customer_id === $request->user()->id || $ctx['role'] === 'superadmin', 403, 'Apenas o solicitante pode confirmar a conclusão.');
            DB::table('service_requests')->where('id', $row->id)->update([
                'status' => 'concluido',
                'completed_at' => $row->completed_at ?? now(),
                'updated_at' => now(),
            ]);
            DB::table('service_messages')->insert([
                'request_id' => $row->id,
                'sender_id' => $request->user()->id,
                'sender_role' => 'morador',
                'body' => 'O cliente confirmou a conclusão do atendimento com sucesso.',
            ]);

            return response()->json(['data' => ['success' => true]]);
        });
    }

    public function dispute(Request $request, int $service): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate([
            'reason' => 'required|string|max:200',
            'description' => 'required|string|max:5000',
        ]);

        return DB::transaction(function () use ($request, $ctx, $service, $data) {
            $row = $this->scoped($request, $ctx, $service, true);
            $id = DB::table('service_disputes')->insertGetId([
                'request_id' => $row->id,
                'opened_by_id' => $request->user()->id,
                'reason' => trim($data['reason']),
                'description' => trim($data['description']),
                'status' => 'aberta',
            ]);
            DB::table('service_requests')->where('id', $row->id)->update([
                'status' => 'em_disputa',
                'updated_at' => now(),
            ]);
            DB::table('audit_logs')->insert([
                'condo_id' => $ctx['condo']['id'],
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'action' => 'criar',
                'entity' => 'service_dispute',
                'entity_id' => (string) $id,
                'summary' => mb_substr("Abriu disputa no serviço #{$row->id}: {$data['reason']}", 0, 235),
                'origin' => 'api',
            ]);

            return response()->json(['data' => ['success' => true, 'disputeId' => $id]], 201);
        });
    }

    public function validateCompletion(Request $request, int $service): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate([
            'approved' => 'required|boolean',
            'rating' => 'sometimes|nullable|integer|between:1,5',
            'reviewComment' => 'sometimes|nullable|string|max:5000',
            'correctionNotes' => 'sometimes|nullable|string|max:5000',
        ]);

        return DB::transaction(function () use ($request, $ctx, $service, $data) {
            $row = DB::table('service_requests')->where('id', $service)->where('condo_id', $ctx['condo']['id'])->lockForUpdate()->first() ?? abort(404, 'Chamado não encontrado.');
            $isOwner = $row->customer_id === $request->user()->id;
            $isAdmin = in_array($ctx['role'], ['sindico', 'superadmin'], true);
            abort_unless($isOwner || $isAdmin, 403, 'Não autorizado a validar este serviço.');

            if ($data['approved']) {
                $now = now();
                DB::table('service_requests')->where('id', $row->id)->update([
                    'status' => 'concluido',
                    'completed_at' => $row->completed_at ?? $now,
                    'validated_at' => $now,
                    'validated_by_id' => $request->user()->id,
                    'updated_at' => $now,
                ]);
                if (! empty($data['rating']) && $row->vendor_id) {
                    $rating = max(1, min(5, (int) $data['rating']));
                    if (! DB::table('service_reviews')->where('request_id', $row->id)->exists()) {
                        DB::table('service_reviews')->insert([
                            'request_id' => $row->id,
                            'vendor_id' => $row->vendor_id,
                            'customer_id' => $row->customer_id,
                            'rating' => $rating,
                            'punctuality_rating' => $rating,
                            'quality_rating' => $rating,
                            'communication_rating' => $rating,
                            'cost_benefit_rating' => $rating,
                            'comment' => isset($data['reviewComment']) && trim($data['reviewComment']) !== '' ? trim($data['reviewComment']) : null,
                            'is_verified' => true,
                        ]);
                        $avg = (float) DB::table('service_reviews')->where('vendor_id', $row->vendor_id)->avg('rating');
                        DB::table('vendors')->where('id', $row->vendor_id)->update(['rating' => (int) round($avg)]);
                    }
                }
                $ratingSuffix = ! empty($data['rating']) ? "Avaliação: {$data['rating']} estrelas." : '';
                DB::table('service_messages')->insert([
                    'request_id' => $row->id,
                    'sender_id' => $request->user()->id,
                    'sender_role' => 'morador',
                    'body' => trim("Serviço validado e concluído com sucesso pelo cliente! {$ratingSuffix}"),
                ]);
                if ($row->vendor_id) {
                    $vendor = DB::table('vendors')->where('id', $row->vendor_id)->first();
                    if ($vendor?->user_id) {
                        DB::table('notifications')->insert([
                            'condo_id' => $row->condo_id,
                            'user_id' => $vendor->user_id,
                            'title' => "Serviço aprovado: {$row->title}",
                            'body' => 'O morador aprovou a conclusão do serviço.'.(! empty($data['rating']) ? " Nota: {$data['rating']}/5." : ''),
                            'link' => '/prestador/chamados',
                            'channel' => 'app',
                        ]);
                    }
                }

                return response()->json(['data' => ['success' => true, 'status' => 'concluido']]);
            }

            $notes = trim((string) ($data['correctionNotes'] ?? ''));
            abort_if($notes === '', 422, 'É obrigatório fornecer o motivo ou instruções de correção para o prestador.');
            DB::table('service_requests')->where('id', $row->id)->update([
                'status' => 'correcao_solicitada',
                'correction_notes' => $notes,
                'updated_at' => now(),
            ]);
            DB::table('service_messages')->insert([
                'request_id' => $row->id,
                'sender_id' => $request->user()->id,
                'sender_role' => 'morador',
                'body' => "Solicitação de correção no serviço: \"{$notes}\". Por favor, faça os ajustes necessários.",
            ]);
            if ($row->vendor_id) {
                $vendor = DB::table('vendors')->where('id', $row->vendor_id)->first();
                if ($vendor?->user_id) {
                    DB::table('notifications')->insert([
                        'condo_id' => $row->condo_id,
                        'user_id' => $vendor->user_id,
                        'title' => "Ajuste solicitado no serviço: {$row->title}",
                        'body' => "O morador solicitou uma correção: {$notes}",
                        'link' => '/prestador/chamados',
                        'channel' => 'app',
                    ]);
                }
            }

            return response()->json(['data' => ['success' => true, 'status' => 'correcao_solicitada']]);
        });
    }

    public function storeTicket(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string|max:10000',
            'category' => 'required|string|max:60',
            'priority' => 'required|string|max:40',
            'location' => 'sometimes|nullable|string|max:160',
            'preferredTime' => 'sometimes|nullable|string|max:120',
            'vendorId' => 'sometimes|nullable|integer|min:1',
            'unitId' => 'sometimes|nullable|integer|min:1',
            'aiPriority' => 'sometimes|nullable|string|max:40',
            'aiSummary' => 'sometimes|nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $ctx, $data) {
            $condoId = $ctx['condo']['id'];
            $vendor = ! empty($data['vendorId'])
                ? DB::table('vendors')->where('id', $data['vendorId'])->where('condo_id', $condoId)->first()
                : null;
            $count = (int) DB::table('tickets')->where('condo_id', $condoId)->count();
            $code = 'SRV-'.str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
            $days = $data['priority'] === 'urgente' ? 1 : ($data['priority'] === 'alta' ? 2 : 5);
            $id = DB::table('tickets')->insertGetId([
                'condo_id' => $condoId,
                'code' => $code,
                'unit_id' => $ctx['role'] === 'morador' ? $ctx['unitId'] : ($data['unitId'] ?? $ctx['unitId'] ?? null),
                'title' => trim($data['title']),
                'description' => trim($data['description']),
                'category' => $data['category'],
                'priority' => $data['priority'],
                'status' => 'solicitado',
                'location' => $data['location'] ?? 'Unidade do Morador',
                'preferred_time' => $data['preferredTime'] ?? null,
                'vendor_id' => $vendor?->id,
                'ai_priority' => $data['aiPriority'] ?? $data['priority'],
                'ai_summary' => $data['aiSummary'] ?? null,
                'opened_by_id' => $request->user()->id,
                'due_at' => now()->addDays($days),
            ]);
            $sindicos = DB::table('memberships')->where('condo_id', $condoId)->where('role', 'sindico')->where('status', 'ativo')->pluck('user_id');
            foreach ($sindicos as $userId) {
                DB::table('notifications')->insert([
                    'condo_id' => $condoId,
                    'user_id' => $userId,
                    'title' => "Nova solicitação de serviço: {$code}",
                    'body' => "{$data['title']} ({$data['category']}) - Solicitado por {$request->user()->name}".($vendor ? " - Prestador: {$vendor->name}" : ''),
                    'link' => '/painel/servicos',
                    'channel' => 'app',
                ]);
            }
            DB::table('audit_logs')->insert([
                'condo_id' => $condoId,
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'action' => 'criar',
                'entity' => 'servico',
                'entity_id' => (string) $id,
                'summary' => mb_substr("Solicitou serviço {$code}: {$data['title']}", 0, 235),
                'origin' => 'api',
            ]);

            return response()->json(['data' => ['success' => true, 'id' => $id, 'code' => $code]], 201);
        });
    }

    public function updateTicketStatus(Request $request, int $ticket): JsonResponse
    {
        $ctx = $this->context($request);
        abort_unless(in_array($ctx['role'], ['superadmin', 'sindico', 'conselho', 'zelador', 'porteiro'], true), 403);
        $data = $request->validate([
            'status' => 'sometimes|nullable|string|max:40',
            'vendorId' => 'sometimes|nullable|integer|min:1',
            'assignedToId' => 'sometimes|nullable|integer|min:1',
            'scheduledFor' => 'sometimes|nullable|string|max:120',
            'costCents' => 'sometimes|nullable|integer|min:0',
            'report' => 'sometimes|nullable|string|max:5000',
            'comment' => 'sometimes|nullable|string|max:5000',
        ]);

        return DB::transaction(function () use ($request, $ctx, $ticket, $data) {
            $condoId = $ctx['condo']['id'];
            $existing = DB::table('tickets')->where('id', $ticket)->where('condo_id', $condoId)->lockForUpdate()->first() ?? abort(404, 'Serviço não encontrado.');
            $status = ! empty($data['status']) ? $data['status'] : $existing->status;
            $isClosed = in_array($status, ['concluido', 'cancelado'], true);
            DB::table('tickets')->where('id', $existing->id)->update([
                'status' => $status,
                'vendor_id' => ($data['vendorId'] ?? null) ?: $existing->vendor_id,
                'assigned_to_id' => ($data['assignedToId'] ?? null) ?: $existing->assigned_to_id,
                'scheduled_for' => ($data['scheduledFor'] ?? null) ?: $existing->scheduled_for,
                'cost_cents' => ($data['costCents'] ?? null) ?: $existing->cost_cents,
                'report' => ($data['report'] ?? null) ?: $existing->report,
                'closed_at' => $isClosed ? now() : $existing->closed_at,
            ]);
            if (! empty($data['comment'])) {
                DB::table('ticket_comments')->insert([
                    'ticket_id' => $existing->id,
                    'user_id' => $request->user()->id,
                    'body' => trim($data['comment']),
                    'internal' => false,
                ]);
            }
            if ($existing->opened_by_id) {
                DB::table('notifications')->insert([
                    'condo_id' => $condoId,
                    'user_id' => $existing->opened_by_id,
                    'title' => "Atualização no serviço {$existing->code}",
                    'body' => 'O status foi alterado para: '.mb_strtoupper(str_replace('_', ' ', $status)),
                    'link' => '/painel/servicos',
                    'channel' => 'app',
                ]);
            }
            DB::table('audit_logs')->insert([
                'condo_id' => $condoId,
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'action' => 'atualizar',
                'entity' => 'servico',
                'entity_id' => (string) $existing->id,
                'summary' => mb_substr("Atualizou status do serviço {$existing->code} para {$status}", 0, 235),
                'origin' => 'api',
            ]);

            return response()->json(['data' => ['success' => true]]);
        });
    }

    public function rateTicket(Request $request, int $ticket): JsonResponse
    {
        $ctx = $this->context($request);
        $data = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'ratingComment' => 'sometimes|nullable|string|max:2000',
        ]);

        return DB::transaction(function () use ($request, $ctx, $ticket, $data) {
            $condoId = $ctx['condo']['id'];
            $existing = DB::table('tickets')->where('id', $ticket)->where('condo_id', $condoId)->lockForUpdate()->first() ?? abort(404, 'Serviço não encontrado.');
            if ($ctx['role'] === 'morador' && $existing->opened_by_id !== $request->user()->id) {
                abort(403, 'Apenas quem abriu o chamado pode avaliar.');
            }
            DB::table('tickets')->where('id', $existing->id)->update([
                'rating' => $data['rating'],
                'rating_comment' => $data['ratingComment'] ?? null,
            ]);
            DB::table('audit_logs')->insert([
                'condo_id' => $condoId,
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'action' => 'avaliar',
                'entity' => 'servico',
                'entity_id' => (string) $existing->id,
                'summary' => mb_substr("Avaliou o serviço {$existing->code} com nota {$data['rating']}/5", 0, 235),
                'origin' => 'api',
            ]);

            return response()->json(['data' => ['success' => true]]);
        });
    }
}
