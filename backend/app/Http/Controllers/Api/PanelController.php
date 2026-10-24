<?php

namespace App\Http\Controllers\Api;

use App\Services\OperationService;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class PanelController
{
    public function __construct(private SessionService $sessions, private OperationService $operations) {}

    private function context(Request $request): array
    {
        return $this->sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
    }

    private function condoId(array $ctx): int
    {
        return $ctx['condo']['id'] ?? abort(403);
    }

    public function achados(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => $this->operations->execute('app.painel.achados.page.001', [$condoId])]);
    }

    public function comunicados(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => $this->operations->execute('app.painel.comunicados.page.001', [$condoId])]);
    }

    public function documentos(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => $this->operations->execute('app.painel.documentos.page.001', [$condoId])]);
    }

    public function mudancas(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => $this->operations->execute('app.painel.mudancas.page.001', [$condoId])]);
    }

    public function notificacoes(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $this->operations->execute('app.painel.notificacoes.page.001', [['readAt' => ['$date' => now()->toIso8601String()]], $request->user()->id]);

        return response()->json(['data' => $this->operations->execute('app.painel.notificacoes.page.002', [$request->user()->id, $condoId])]);
    }

    public function perfil(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        return response()->json(['data' => [
            'userData' => $this->operations->execute('app.painel.perfil.page.001', [$userId])[0] ?? null,
            'userMemberships' => $this->operations->execute('app.painel.perfil.page.002', [$userId]),
        ]]);
    }

    public function portaria(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $isResident = $ctx['role'] === 'morador';

        return response()->json(['data' => [
            'visitRows' => $this->operations->execute('app.painel.portaria.page.001', [$condoId, $isResident, $request->user()->id]),
            'parcelRows' => $this->operations->execute('app.painel.portaria.page.002', [$condoId, $isResident && $ctx['unitId'], $ctx['unitId']]),
        ]]);
    }

    public function turnos(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => [
            'rows' => $this->operations->execute('app.painel.turnos.page.001', [$condoId]),
            'openShift' => $this->operations->execute('app.painel.turnos.page.002', [$condoId])[0] ?? null,
        ]]);
    }

    public function agenda(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => [
            'events' => $this->operations->execute('app.painel.agenda.page.001', [$condoId]),
            'amenityList' => $this->operations->execute('app.painel.agenda.page.002', [$condoId]),
            'approvedReservations' => $this->operations->execute('app.painel.agenda.page.003', [$condoId]),
        ]]);
    }

    public function fornecedores(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => [
            'vendorRows' => $this->operations->execute('app.painel.fornecedores.page.001', [$condoId]),
            'contractRows' => $this->operations->execute('app.painel.fornecedores.page.002', [$condoId]),
        ]]);
    }

    public function financeiro(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => [
            'txRows' => $this->operations->execute('app.painel.financeiro.page.001', [$condoId]),
            'chargeRows' => $this->operations->execute('app.painel.financeiro.page.002', [$condoId]),
            'budgetRows' => $this->operations->execute('app.painel.financeiro.page.003', [$condoId]),
            'vendorRows' => $this->operations->execute('app.painel.financeiro.page.004', [$condoId]),
        ]]);
    }

    public function manutencao(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => [
            'assetRows' => $this->operations->execute('app.painel.manutencao.page.001', [$condoId]),
            'planRows' => $this->operations->execute('app.painel.manutencao.page.002', [$condoId]),
            'orderRows' => $this->operations->execute('app.painel.manutencao.page.003', [$condoId]),
            'vendorRows' => $this->operations->execute('app.painel.manutencao.page.004', [$condoId]),
        ]]);
    }

    public function moradores(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => [
            'people' => $this->operations->execute('app.painel.moradores.page.001', [$condoId]),
            'blockList' => $this->operations->execute('app.painel.moradores.page.002', [$condoId]),
            'unitRows' => $this->operations->execute('app.painel.moradores.page.003', [$condoId]),
        ]]);
    }

    public function enquetes(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));
        $rows = $this->operations->execute('app.painel.enquetes.page.001', [$condoId]);
        $ids = array_column($rows, 'id');

        return response()->json(['data' => [
            'rows' => $rows,
            'options' => $ids ? $this->operations->execute('app.painel.enquetes.page.002', [$ids]) : [],
            'votes' => $ids ? $this->operations->execute('app.painel.enquetes.page.003', [$ids]) : [],
        ]]);
    }

    public function ocorrencias(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $canManage = in_array($ctx['role'], ['superadmin', 'sindico', 'conselho', 'zelador', 'porteiro'], true);

        return response()->json(['data' => [
            'occurrenceRows' => $this->operations->execute('app.painel.ocorrencias.page.001', [$condoId]),
            'comments' => $this->operations->execute('app.painel.ocorrencias.page.002', []),
            'staffMembers' => $canManage ? $this->operations->execute('app.painel.ocorrencias.page.003', [$condoId, ['sindico', 'superadmin', 'zelador', 'porteiro', 'conselho']]) : [],
        ]]);
    }

    public function novaOcorrencia(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);

        return response()->json(['data' => [
            'unitRow' => $ctx['unitId'] ? ($this->operations->execute('app.painel.ocorrencias.nova.page.001', [$ctx['unitId']])[0] ?? null) : null,
            'condoBlocks' => $this->operations->execute('app.painel.ocorrencias.nova.page.002', [$condoId]),
            'condoAmenities' => $this->operations->execute('app.painel.ocorrencias.nova.page.003', [$condoId]),
        ]]);
    }

    public function reservas(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $canManage = in_array($ctx['role'], ['superadmin', 'sindico', 'conselho', 'zelador'], true);

        return response()->json(['data' => [
            'amenityRows' => $canManage
                ? $this->operations->execute('app.painel.reservas.page.001', [$condoId])
                : $this->operations->execute('app.painel.reservas.page.002', [$condoId]),
            'blockRows' => $this->operations->execute('app.painel.reservas.page.003', [$condoId]),
            'reservationRows' => $this->operations->execute('app.painel.reservas.page.004', [$condoId]),
            'unit' => $ctx['unitId'] ? ($this->operations->execute('app.painel.reservas.page.005', [$ctx['unitId']])[0] ?? null) : null,
        ]]);
    }

    public function implantacao(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));

        return response()->json(['data' => [
            'blockCount' => $this->operations->execute('app.painel.implantacao.page.001', [$condoId])[0] ?? ['n' => 0],
            'unitCount' => $this->operations->execute('app.painel.implantacao.page.002', [$condoId])[0] ?? ['n' => 0],
            'peopleCount' => $this->operations->execute('app.painel.implantacao.page.003', [$condoId])[0] ?? ['n' => 0],
            'amenityCount' => $this->operations->execute('app.painel.implantacao.page.004', [$condoId])[0] ?? ['n' => 0],
            'people' => $this->operations->execute('app.painel.implantacao.page.005', [$condoId]),
            'jobs' => $this->operations->execute('app.painel.implantacao.page.006', [$condoId]),
        ]]);
    }

    public function ajuda(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $ctx['condo']['id'] ?? ($request->integer('condoId') ?: null);
        $isSupport = ! empty($ctx['user']['isSuperAdmin']) || $ctx['role'] === 'superadmin';

        if ($isSupport) {
            $tickets = DB::table('support_tickets as st')
                ->leftJoin('users as u', 'u.id', '=', 'st.user_id')
                ->leftJoin('condominiums as c', 'c.id', '=', 'st.condo_id')
                ->select([
                    'st.id',
                    'st.subject',
                    'st.body',
                    'st.category',
                    'st.priority',
                    'st.status',
                    'st.answer',
                    'st.satisfaction',
                    'st.created_at as createdAt',
                    'u.name as author',
                    'u.email as authorEmail',
                    'c.name as condoName',
                    'st.condo_id as condoId',
                ])
                ->orderByDesc('st.created_at')
                ->get()
                ->map(fn ($t) => (array) $t)
                ->all();
        } else {
            $tickets = $condoId
                ? $this->operations->execute('app.painel.ajuda.page.002', [false, $condoId, $condoId, $condoId])
                : [];
        }

        return response()->json(['data' => [
            'articles' => $this->operations->execute('app.painel.ajuda.page.001', []),
            'tickets' => $tickets,
        ]]);
    }

    public function auditoria(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));
        $q = $request->query('q');
        $f = $request->query('f');

        return response()->json(['data' => $this->operations->execute('app.painel.auditoria.page.001', [
            $condoId, $q, "%{$q}%", "%{$q}%", "%{$q}%", "%{$q}%", $f === 'criticos', $f === 'suporte',
        ])]);
    }

    public function livro(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $v = $request->query('v');
        $allowed = $ctx['role'] === 'porteiro' || $ctx['role'] === 'zelador'
            ? ['publica', 'administrativa']
            : ['publica', 'administrativa', 'sigilosa'];

        return response()->json(['data' => $this->operations->execute('app.painel.livro.page.001', [
            $condoId, $v && in_array($v, $allowed, true), [$v], $ctx['role'] === 'porteiro' || $ctx['role'] === 'zelador', ['publica', 'administrativa'], ['publica', 'administrativa', 'sigilosa'],
        ])]);
    }

    public function relatorios(Request $request): JsonResponse
    {
        $condoId = $this->condoId($this->context($request));
        $today = $request->query('today', now('America/Sao_Paulo')->format('Y-m-d'));
        $expiringUntil = $request->query('expiringUntil', now('America/Sao_Paulo')->addDays(45)->format('Y-m-d'));

        return response()->json(['data' => [
            'tx' => $this->operations->execute('app.painel.relatorios.page.001', [$condoId]),
            'overdue' => $this->operations->execute('app.painel.relatorios.page.002', [$condoId])[0] ?? ['n' => 0, 'total' => 0],
            'lateMaint' => $this->operations->execute('app.painel.relatorios.page.003', [$condoId, $today])[0] ?? ['n' => 0],
            'expiring' => $this->operations->execute('app.painel.relatorios.page.004', [$condoId, $expiringUntil])[0] ?? ['n' => 0],
        ]]);
    }

    public function adocao(Request $request): JsonResponse
    {
        $this->context($request);

        return response()->json(['data' => [
            'condos' => $this->operations->execute('app.painel.adocao.page.001', []),
            'memberRows' => $this->operations->execute('app.painel.adocao.page.002', []),
            'unitRows' => $this->operations->execute('app.painel.adocao.page.003', []),
            'moduleUsage' => $this->operations->execute('app.painel.adocao.page.004', []),
            'imports' => $this->operations->execute('app.painel.adocao.page.005', []),
            'support' => $this->operations->execute('app.painel.adocao.page.006', []),
        ]]);
    }

    public function admin(Request $request): JsonResponse
    {
        $this->context($request);

        return response()->json(['data' => [
            'totalCondos' => $this->operations->execute('app.painel.admin.page.001', [])[0]['totalCondos'] ?? 0,
            'totalUsers' => $this->operations->execute('app.painel.admin.page.002', [])[0]['totalUsers'] ?? 0,
            'totalVendors' => $this->operations->execute('app.painel.admin.page.003', [])[0]['totalVendors'] ?? 0,
            'totalTickets' => $this->operations->execute('app.painel.admin.page.004', [])[0]['totalTickets'] ?? 0,
            'totalContracts' => $this->operations->execute('app.painel.admin.page.005', [])[0]['totalContracts'] ?? 0,
            'financialStats' => $this->operations->execute('app.painel.admin.page.006', [['paid', 'released']])[0] ?? null,
            'pendingOrdersCount' => $this->operations->execute('app.painel.admin.page.007', [])[0]['pendingOrdersCount'] ?? 0,
            'openDisputesCount' => $this->operations->execute('app.painel.admin.page.008', [])[0]['openDisputesCount'] ?? 0,
            'recentLogs' => $this->operations->execute('app.painel.admin.page.009', []),
        ]]);
    }

    public function adminAdministradores(Request $request): JsonResponse
    {
        $this->context($request);

        return response()->json(['data' => $this->operations->execute('app.painel.admin.administradores.page.001', [])]);
    }

    public function adminCondominios(Request $request): JsonResponse
    {
        $this->context($request);

        return response()->json(['data' => [
            'condosList' => $this->operations->execute('app.painel.admin.condominios.page.001', []),
            'unitCounts' => $this->operations->execute('app.painel.admin.condominios.page.002', []),
        ]]);
    }

    public function adminMarketplace(Request $request): JsonResponse
    {
        $this->context($request);

        return response()->json(['data' => [
            'allVendors' => $this->operations->execute('app.painel.admin.marketplace.page.001', []),
            'reviewsList' => $this->operations->execute('app.painel.admin.marketplace.page.002', []),
        ]]);
    }

    public function adminMarketplaceDestaques(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);

        return response()->json(['data' => [
            'plans' => $this->operations->execute('app.painel.admin.marketplace.destaques.page.001', []),
            'campaigns' => $this->operations->execute('app.painel.admin.marketplace.destaques.page.002', [$condoId]),
        ]]);
    }

    public function adminMarketplaceTaxas(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);

        return response()->json(['data' => $this->operations->execute('app.painel.admin.marketplace.taxas.page.001', [$condoId])]);
    }

    public function adminPrestadores(Request $request): JsonResponse
    {
        $this->context($request);

        return response()->json(['data' => $this->operations->execute('app.painel.admin.prestadores.page.001', [])]);
    }

    public function adminSindicos(Request $request): JsonResponse
    {
        $this->context($request);

        return response()->json(['data' => $this->operations->execute('app.painel.admin.sindicos.page.001', [])]);
    }

    public function adminUsuarios(Request $request): JsonResponse
    {
        $this->context($request);

        return response()->json(['data' => $this->operations->execute('app.painel.admin.usuarios.page.001', [])]);
    }

    public function adminZeladoriaPay(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);

        return response()->json(['data' => [
            'orders' => $this->operations->execute('app.painel.admin.zeladoria-pay.page.001', [$condoId]),
            'disputes' => $this->operations->execute('app.painel.admin.zeladoria-pay.page.002', []),
            'allPayouts' => $this->operations->execute('app.painel.admin.zeladoria-pay.page.003', [$condoId]),
            'recipients' => $this->operations->execute('app.painel.admin.zeladoria-pay.page.004', []),
            'paidInspections' => $this->operations->execute('app.painel.admin.zeladoria-pay.page.005', []),
        ]]);
    }

    public function encomendas(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $isResident = $ctx['role'] === 'morador';
        $staleBefore = ['$date' => now()->subDays(7)->toIso8601String()];

        return response()->json(['data' => [
            'rows' => $this->operations->execute('app.painel.encomendas.page.001', [$condoId, $isResident && $ctx['unitId'], $ctx['unitId']]),
            'stale' => $this->operations->execute('app.painel.encomendas.page.002', [$condoId, $staleBefore])[0] ?? ['id' => 0],
        ]]);
    }

    public function visitantes(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $isResident = $ctx['role'] === 'morador';
        $status = $request->query('status');

        return response()->json(['data' => [
            'rows' => $this->operations->execute('app.painel.visitantes.page.001', [$condoId, $isResident && $ctx['unitId'], $ctx['unitId'], $status && $status !== 'todos', $status]),
            'recurring' => $this->operations->execute('app.painel.visitantes.page.002', [$condoId]),
            'allVisitsInScope' => $this->operations->execute('app.painel.visitantes.page.003', [$condoId, $isResident && $ctx['unitId'], $ctx['unitId']]),
        ]]);
    }

    public function chamados(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $isSuperAdmin = ($ctx['role'] === 'superadmin') || ! empty($ctx['user']['isSuperAdmin']);
        $condoId = $ctx['condo']['id'] ?? ($request->integer('condoId') ?: null);

        if (! $condoId && ! $isSuperAdmin) {
            abort(403);
        }

        $statuses = ['aberto', 'em_andamento', 'aguardando_morador', 'concluido'];
        $priorities = ['baixa', 'media', 'alta'];
        $categories = ['manutencao', 'seguranca', 'convivencia', 'limpeza', 'administrativo'];
        $s = $request->query('s');
        $p = (string) $request->query('p', '');
        $c = (string) $request->query('c', '');
        $search = trim((string) $request->query('q', ''));
        $activeStatus = $s && in_array($s, $statuses, true) ? $s : 'todos';

        if (! $condoId && $isSuperAdmin) {
            $query = DB::table('tickets as t')
                ->leftJoin('users as u', 'u.id', '=', 't.opened_by_id')
                ->leftJoin('units as un', 'un.id', '=', 't.unit_id')
                ->leftJoin('blocks as b', 'b.id', '=', 'un.block_id')
                ->leftJoin('condominiums as c_condo', 'c_condo.id', '=', 't.condo_id')
                ->select([
                    't.id',
                    't.code',
                    't.title',
                    't.description',
                    't.category',
                    't.priority',
                    't.status',
                    't.ai_priority as aiPriority',
                    't.ai_summary as aiSummary',
                    't.due_at as dueAt',
                    't.created_at as createdAt',
                    't.rating',
                    't.assigned_to_id as assignedToId',
                    't.condo_id as condoId',
                    'c_condo.name as condoName',
                    'u.name as openedBy',
                    'un.number as unit',
                    'b.name as block',
                ]);

            if ($activeStatus !== 'todos') {
                $query->where('t.status', $activeStatus);
            }
            if ($p && in_array($p, $priorities, true)) {
                $query->where('t.priority', $p);
            }
            if ($c && in_array($c, $categories, true)) {
                $query->where('t.category', $c);
            }
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('t.title', 'like', "%{$search}%")
                        ->orWhere('t.code', 'like', "%{$search}%")
                        ->orWhere('t.description', 'like', "%{$search}%");
                });
            }
            $rows = $query->orderByDesc('t.created_at')->get()->map(fn ($r) => (array) $r)->all();
        } else {
            $rows = $this->operations->execute('app.painel.chamados.page.001', [
                $condoId,
                $ctx['role'] === 'morador',
                $request->user()->id,
                $activeStatus !== 'todos',
                $s && in_array($s, $statuses, true),
                $s,
                in_array($p, $priorities, true),
                $p,
                in_array($c, $categories, true),
                $c,
                $search,
                "%{$search}%",
                "%{$search}%",
                "%{$search}%",
            ]);

            if ($isSuperAdmin && $condoId && ! empty($ctx['condo']['name'])) {
                foreach ($rows as &$r) {
                    if (empty($r['condoName'])) {
                        $r['condoName'] = $ctx['condo']['name'];
                    }
                }
                unset($r);
            }
        }
        $ids = array_column($rows, 'id');

        return response()->json(['data' => [
            'rows' => $rows,
            'comments' => $ids ? $this->operations->execute('app.painel.chamados.page.002', [$ids]) : [],
        ]]);
    }

    public function assembleias(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $allAssemblies = $this->operations->execute('app.painel.assembleias.page.001', [$condoId]);
        $isResident = $ctx['role'] === 'morador';
        $residentBlockId = null;

        if ($isResident && $ctx['unitId']) {
            $u = $this->operations->execute('app.painel.assembleias.page.002', [$ctx['unitId']])[0] ?? null;
            $residentBlockId = $u['blockId'] ?? null;
        }

        $visibleAssemblies = array_values(array_filter($allAssemblies, function (array $a) use ($isResident, $ctx, $residentBlockId) {
            if (! $isResident) {
                return true;
            }
            if (($a['audienceScope'] ?? null) === 'unidade') {
                return ($a['targetUnitId'] ?? null) === $ctx['unitId'];
            }
            if (($a['audienceScope'] ?? null) === 'bloco') {
                return ($a['targetBlockId'] ?? null) === $residentBlockId;
            }

            return true;
        }));

        $ids = array_column($visibleAssemblies, 'id');
        $minutesList = $ids ? $this->operations->execute('app.painel.assembleias.page.006', [$ids]) : [];
        $minuteIds = array_column($minutesList, 'id');

        return response()->json(['data' => [
            'visibleAssemblies' => $visibleAssemblies,
            'agenda' => $ids ? $this->operations->execute('app.painel.assembleias.page.003', [$ids]) : [],
            'attendance' => $ids ? $this->operations->execute('app.painel.assembleias.page.004', [$ids]) : [],
            'votes' => $ids ? $this->operations->execute('app.painel.assembleias.page.005', [$ids]) : [],
            'minutesList' => $minutesList,
            'versions' => $minuteIds ? $this->operations->execute('app.painel.assembleias.page.007', [$minuteIds]) : [],
            'condoBlocks' => $this->operations->execute('app.painel.assembleias.page.008', [$condoId]),
        ]]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $ctx = $this->context($request);
        $condoId = $this->condoId($ctx);
        $isResident = $ctx['role'] === 'morador';
        $isPorteiro = $ctx['role'] === 'porteiro' || $ctx['role'] === 'zelador';
        $isSindico = in_array($ctx['role'], ['sindico', 'superadmin', 'conselho'], true);
        $todayStr = (string) $request->query('todayStr', now()->format('Y-m-d'));
        $in7DaysStr = (string) $request->query('in7DaysStr', now()->addDays(7)->format('Y-m-d'));
        $residentUnitId = $request->integer('residentUnitId') ?: $ctx['unitId'];
        $nowIso = ['$date' => now()->toIso8601String()];

        $payload = [
            'condoRow' => $this->operations->execute('app.painel.page.001', [$condoId])[0] ?? null,
            'allUnitsRaw' => $this->operations->execute('app.painel.page.002', [$condoId]),
            'mapOccRows' => $this->operations->execute('app.painel.page.026', [$condoId, $isResident, $request->user()->id]),
            'reservationRows' => $this->operations->execute('app.painel.page.027', [$condoId, $todayStr, $isResident, $request->user()->id]),
            'assemblyRows' => $this->operations->execute('app.painel.page.028', [$condoId, $nowIso]),
            'announcementRows' => $this->operations->execute('app.painel.page.029', [$condoId]),
        ];

        if ($isPorteiro) {
            $payload['porteiro'] = [
                'openShiftRow' => $this->operations->execute('app.painel.page.003', [$condoId])[0] ?? null,
                'closedShiftRow' => $this->operations->execute('app.painel.page.004', [$condoId])[0] ?? null,
                'insideRows' => $this->operations->execute('app.painel.page.005', [$condoId]),
                'expectedRows' => $this->operations->execute('app.painel.page.006', [$condoId, ['autorizado', 'aguardando']]),
                'parcelRows' => $this->operations->execute('app.painel.page.007', [$condoId, ['pendente', 'aguardando_retirada', 'recebida']]),
                'todayReservationsCount' => $this->operations->execute('app.painel.page.008', [$condoId, $todayStr])[0]['count'] ?? 0,
            ];
        } elseif ($isSindico) {
            $payload['sindico'] = [
                'openOccCount' => $this->operations->execute('app.painel.page.009', [$condoId])[0] ?? ['count' => 0],
                'highPriorityOccCount' => $this->operations->execute('app.painel.page.010', [$condoId, ['alta', 'urgente']])[0] ?? ['count' => 0],
                'pendingReservationsCount' => $this->operations->execute('app.painel.page.011', [$condoId])[0] ?? ['count' => 0],
                'pendingSuggestionsCount' => $this->operations->execute('app.painel.page.012', [$condoId, ['aberto', 'pendente', 'em_analise']])[0] ?? ['count' => 0],
                'overdueMaintenanceCount' => $this->operations->execute('app.painel.page.013', [$condoId, $in7DaysStr])[0] ?? ['count' => 0],
                'unassignedOrdersCount' => $this->operations->execute('app.painel.page.014', [$condoId])[0] ?? ['count' => 0],
                'executingOrdersCount' => $this->operations->execute('app.painel.page.015', [$condoId])[0] ?? ['count' => 0],
                'todayVisitsCount' => $this->operations->execute('app.painel.page.016', [$condoId])[0] ?? ['count' => 0],
                'todayProvidersCount' => $this->operations->execute('app.painel.page.017', [$condoId])[0] ?? ['count' => 0],
                'todayResCount' => $this->operations->execute('app.painel.page.018', [$condoId, $todayStr])[0] ?? ['count' => 0],
                'todayMaintCount' => $this->operations->execute('app.painel.page.019', [$condoId, $todayStr])[0] ?? ['count' => 0],
                'assetsWithIssues' => $this->operations->execute('app.painel.page.020', [$condoId]),
                'logRows' => $this->operations->execute('app.painel.page.021', [$condoId, ['publica', 'administrativa', 'sigilosa']]),
            ];
        } else {
            $payload['morador'] = [
                'myOpenOccCount' => $this->operations->execute('app.painel.page.022', [$condoId, $request->user()->id])[0] ?? ['count' => 0],
                'myPendingResCount' => $this->operations->execute('app.painel.page.023', [$condoId, $request->user()->id, $todayStr])[0] ?? ['count' => 0],
                'myParcelsCount' => $residentUnitId
                    ? ($this->operations->execute('app.painel.page.024', [$condoId, $residentUnitId, ['aguardando_retirada', 'recebida', 'pendente']])[0] ?? ['count' => 0])
                    : ['count' => 0],
                'annCount' => $this->operations->execute('app.painel.page.025', [$condoId])[0] ?? ['count' => 0],
            ];
        }

        return response()->json(['data' => $payload]);
    }
}
