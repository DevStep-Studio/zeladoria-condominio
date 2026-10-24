<?php

namespace App\Http\Controllers\Api;

use App\Services\OperationService;
use App\Services\ProviderService;
use App\Services\SessionService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class UtilityController
{
    public function health(): JsonResponse
    {
        $started = hrtime(true);
        try {
            DB::select('SELECT 1');
            $ok = true;
        } catch (Throwable) {
            $ok = false;
        }

        return response()->json(['data' => ['ok' => $ok, 'service' => 'zeladoria-api', 'database' => $ok ? 'up' : 'down', 'driver' => 'mysql', 'ms' => (int) ((hrtime(true) - $started) / 1000000), 'checkedAt' => now()->toIso8601String()]], $ok ? 200 : 503)->header('Cache-Control', 'no-store');
    }

    public function condominiums(): JsonResponse
    {
        return response()->json(['data' => DB::table('condominiums')->where('public_page', true)->select('id', 'name', 'city')->orderBy('name')->get()]);
    }

    public function mural(Request $request, ProviderService $rows): JsonResponse
    {
        $data = $request->validate(['c' => 'sometimes|nullable|string|max:80']);
        $query = DB::table('condominiums')->where('public_page', true);
        if (! empty($data['c'])) {
            $query->where('slug', $data['c']);
        }
        $condo = $query->orderBy('id')->first() ?? abort(404);
        $news = DB::table('announcements')->where('condo_id', $condo->id)->where('show_on_tv', true)->where('audience', 'todos')->where('published_at', '<=', DB::raw('CURRENT_TIMESTAMP(6)'))->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', DB::raw('CURRENT_TIMESTAMP(6)')))->orderByDesc('pinned')->orderByDesc('published_at')->limit(12);
        $agenda = DB::table('reservations as r')->join('amenities as a', 'a.id', '=', 'r.amenity_id')->where('r.condo_id', $condo->id)->where('a.condo_id', $condo->id)->where('r.status', 'aprovada')->where('r.date', now('America/Sao_Paulo')->format('Y-m-d'))->select('a.name as amenity', 'r.date', 'r.start_time as start', 'r.end_time as end')->orderBy('r.start_time')->get();

        return response()->json(['data' => ['condo' => $rows->row('condominiums', $condo), 'news' => $rows->rows('announcements', $news), 'agenda' => $agenda]]);
    }

    public function template(string $type): Response
    {
        $templates = ['unidades' => "bloco;unidade;andar;fracao;vagas\nBloco A;101;1;0,95;1\nBloco A;102;1;1,05;2\nBloco B;201;2;1,00;1", 'moradores' => "bloco;unidade;nome;email;telefone\nBloco A;302;Ana Ribeiro;ana@email.com;(41) 98888-7070\nBloco B;101;Bruno Tavares;bruno@email.com;(41) 98777-6060"];
        abort_unless(isset($templates[$type]), 404, 'Modelo não encontrado.');

        return response("\xEF\xBB\xBF".$templates[$type]."\n", 200, ['Content-Type' => 'text/csv; charset=utf-8', 'Content-Disposition' => 'attachment; filename="modelo-'.$type.'.csv"']);
    }

    public function export(Request $request, string $entity, SessionService $sessions, OperationService $operations): Response
    {
        $session = $sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
        $condoId = $session['condo']['id'] ?? abort(403);
        if ($request->integer('condoId')) {
            abort_unless($condoId === $request->integer('condoId'), 404);
        }
        $staff = ['superadmin', 'sindico', 'conselho', 'zelador'];
        $allowed = match ($entity) {
            'financeiro' => ['superadmin', 'sindico', 'conselho'], 'auditoria' => ['superadmin', 'sindico'], 'avisos-erros' => ['superadmin', 'sindico', 'conselho', 'zelador'], 'visitantes', 'encomendas' => [...$staff, 'porteiro'], default => $staff
        };
        abort_unless(in_array($session['role'], $allowed, true), 403);

        if ($entity === 'avisos-erros') {
            $query = DB::table('system_incidents');
            if ($session['role'] !== 'superadmin') {
                $query->where(function ($q) use ($condoId) {
                    $q->where('condo_id', $condoId)->orWhereNull('condo_id');
                });
            }
            $incidents = $query->orderByDesc('last_seen_at')->get();
            $rows = [];
            foreach ($incidents as $inc) {
                $rows[] = [
                    'id' => $inc->code,
                    'tipo' => $inc->type,
                    'prioridade' => $inc->priority,
                    'status' => $inc->status,
                    'titulo' => $inc->title,
                    'modulo' => $inc->source_module,
                    'responsavel' => $inc->assignee_name ?: 'Sem responsável',
                    'ocorrencias' => $inc->occurrences_count,
                    'primeira_ocorrencia' => $inc->first_seen_at,
                    'ultima_ocorrencia' => $inc->last_seen_at,
                    'resolvido_em' => $inc->resolved_at ?: '-',
                    'resolvido_por' => $inc->resolved_by_name ?: '-',
                    'solucao' => $inc->resolution_notes ?: '-',
                ];
            }
        } else {
            $ids = ['moradores' => '001', 'ocorrencias' => '002', 'visitantes' => '003', 'encomendas' => '004', 'financeiro' => '005', 'contratos' => '007', 'auditoria' => '008'];
            abort_unless(isset($ids[$entity]), 404);
            $rows = $operations->execute('app.api.export.-entity-.route.'.$ids[$entity], [$condoId]);
            if ($entity === 'financeiro') {
                $charges = $operations->execute('app.api.export.-entity-.route.006', [$condoId]);
                foreach ($charges as $c) {
                    $rows[] = ['tipo' => 'cobranca', 'descricao' => 'Unidade '.$c['unidade'], 'categoria' => 'taxa_condominial', 'centro_custo' => '-', 'valor' => $c['valor'], 'vencimento' => $c['vencimento'], 'pagamento' => '', 'status' => $c['status']];
                }
            }
        }
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, "\xEF\xBB\xBF");
        if (! $rows) {
            fwrite($stream, "sem registros\n");
        } else {
            $keys = array_keys($rows[0]);
            fputcsv($stream, $keys, ';', '"', '');
            foreach ($rows as $row) {
                $values = [];
                foreach ($keys as $key) {
                    $value = $row[$key] ?? '';
                    if (is_array($value) && isset($value['$date'])) {
                        $value = CarbonImmutable::parse($value['$date'])->setTimezone('America/Sao_Paulo')->format('d/m/Y H:i');
                    }
                    if ($key === 'valor') {
                        $value = 'R$ '.number_format(((int) $value) / 100, 2, ',', '.');
                    }
                    // Prevent spreadsheet formulas from executing when opening exported user input.
                    $values[] = is_string($value) && preg_match('/^[=+@\-\t\r]/', $value) ? "'".$value : $value;
                }
                fputcsv($stream, $values, ';', '"', '');
            }
        }
        rewind($stream);
        $csv = stream_get_contents($stream);
        fclose($stream);
        DB::table('audit_logs')->insert(['condo_id' => $condoId, 'user_id' => $request->user()->id, 'user_name' => $request->user()->name, 'action' => 'exportar', 'entity' => 'exportacao_'.$entity, 'summary' => 'Exportou '.count($rows).' registros', 'critical' => true, 'origin' => 'api']);

        return response($csv, 200, ['Content-Type' => 'text/csv; charset=utf-8', 'Content-Disposition' => 'attachment; filename="'.$entity.'-'.now('America/Sao_Paulo')->format('Y-m-d').'.csv"']);
    }

    public function visitPass(string $token, OperationService $operations): JsonResponse
    {
        $rows = $operations->execute('app.v.-token-.page.001', [$token]);
        abort_unless(! empty($rows), 404, 'Convite não encontrado.');

        return response()->json(['data' => $rows[0]]);
    }

    public function publicBooking(Request $request, OperationService $operations): JsonResponse
    {
        $condos = $operations->execute('app.agendar.page.001', []);
        $condo = $condos[0] ?? null;
        $services = $condo ? $operations->execute('app.agendar.page.002', [$condo['id']]) : [];
        $serviceParam = $request->query('service');
        $selectedService = collect($services)->first(fn ($item) => (string) $item['id'] === (string) $serviceParam) ?? ($services[0] ?? null);
        $dateParam = (string) $request->query('date', '');
        $hasValidDate = (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateParam);
        $today = now('America/Sao_Paulo')->format('Y-m-d');
        $existing = ($condo && $selectedService)
            ? $operations->execute('app.agendar.page.003', [$condo['id'], $selectedService['id'], $hasValidDate, $dateParam ?: null, $today, ['pendente', 'aprovada']])
            : [];

        return response()->json(['data' => ['condo' => $condo, 'services' => $services, 'existing' => $existing]]);
    }

    public function audit(Request $request, OperationService $operations): JsonResponse
    {
        $entry = $request->validate([
            'condoId' => 'nullable|integer',
            'userId' => 'nullable|integer',
            'userName' => 'required|string|max:160',
            'action' => 'required|string|max:80',
            'entity' => 'required|string|max:80',
            'entityId' => 'nullable|string|max:80',
            'summary' => 'nullable|string|max:240',
            'before' => 'nullable|array',
            'after' => 'nullable|array',
            'ip' => 'nullable|string|max:80',
            'userAgent' => 'nullable|string|max:500',
            'origin' => 'required|string|max:40',
            'critical' => 'required|boolean',
        ]);
        $operations->execute('lib.audit.001', [$entry]);

        return response()->json(['data' => ['success' => true]], 201);
    }

    public function notify(Request $request, OperationService $operations): JsonResponse
    {
        $data = $request->validate([
            'items' => 'required|array|min:1|max:500',
            'items.*.condoId' => 'required|integer|min:1',
            'items.*.userId' => 'required|integer|min:1',
            'items.*.title' => 'required|string|max:240',
            'items.*.body' => 'required|string|max:5000',
            'items.*.link' => 'nullable|string|max:500',
            'items.*.channel' => 'required|in:app,email,whatsapp',
        ]);
        $operations->execute('lib.audit.002', [$data['items']]);

        return response()->json(['data' => ['success' => true]], 201);
    }

    public function options(Request $request, int $condo, OperationService $operations): JsonResponse
    {
        $type = $request->query('type', 'units');
        if ($type === 'blocks') {
            return response()->json(['data' => $operations->execute('lib.queries.002', [$condo])]);
        }
        if ($type === 'people') {
            $roles = $request->input('roles');
            $rolesList = is_array($roles) && count($roles) > 0 ? $roles : null;

            return response()->json(['data' => $operations->execute('lib.queries.003', [$rolesList, $condo, $rolesList, $condo])]);
        }

        return response()->json(['data' => $operations->execute('lib.queries.001', [$condo])]);
    }

    public function assemblyMinutesDownload(Request $request, int $assembly, SessionService $sessions, OperationService $operations): Response
    {
        $session = $sessions->context($request->user(), $request->integer('condoId') ?: null, $request->query('role'));
        $condoId = $session['condo']['id'] ?? abort(401, 'Não autorizado - Sessão expirada ou inválida.');
        $assemblies = $operations->execute('app.api.assemblies.-id-.minutes.download.route.001', [$assembly, $condoId]);
        $assemblyRow = $assemblies[0] ?? abort(404, 'Assembleia não encontrada.');
        $isStaff = in_array($session['role'], ['superadmin', 'sindico', 'conselho', 'zelador'], true);

        if (! $isStaff && $session['role'] === 'morador') {
            if ($assemblyRow['audienceScope'] === 'bloco' && ! empty($assemblyRow['targetBlockId']) && ! empty($session['unitId'])) {
                $units = $operations->execute('app.api.assemblies.-id-.minutes.download.route.002', [$session['unitId']]);
                $unit = $units[0] ?? null;
                abort_if(($unit['blockId'] ?? null) !== $assemblyRow['targetBlockId'], 403, 'Sem permissão para acessar esta ata.');
            } elseif ($assemblyRow['audienceScope'] === 'unidade' && ! empty($assemblyRow['targetUnitId'])) {
                abort_if($session['unitId'] !== $assemblyRow['targetUnitId'], 403, 'Sem permissão para acessar esta ata.');
            }
        }

        $minutesRows = $operations->execute('app.api.assemblies.-id-.minutes.download.route.003', [$assembly]);
        $minutes = $minutesRows[0] ?? abort(404, 'Ata ainda não cadastrada.');
        abort_if(! $isStaff && $minutes['status'] !== 'publicada', 403, 'A ata ainda está em revisão pela administração e não foi publicada.');

        $condos = $operations->execute('app.api.assemblies.-id-.minutes.download.route.004', [$condoId]);
        $condo = $condos[0] ?? null;
        $condoSlug = preg_replace('/[^a-z0-9]+/', '-', mb_strtolower($condo['name'] ?? 'condominio'));
        $firstCallIso = is_array($assemblyRow['firstCallAt']) ? ($assemblyRow['firstCallAt']['$date'] ?? '') : (string) $assemblyRow['firstCallAt'];
        $dateStr = substr($firstCallIso, 0, 10) ?: now()->format('Y-m-d');
        $safeFilename = $minutes['fileName'] ?: "ata-assembleia-{$condoSlug}-{$dateStr}.pdf";

        $operations->execute('app.api.assemblies.-id-.minutes.download.route.005', [[
            'assemblyId' => $assembly,
            'minutesId' => $minutes['id'],
            'version' => $minutes['currentVersion'] ?: '1.0',
            'userId' => $request->user()->id,
            'unitId' => $session['unitId'] ?? null,
        ]]);

        DB::table('audit_logs')->insert([
            'condo_id' => $condoId,
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'baixar_ata',
            'entity' => 'ata_assembleia',
            'entity_id' => (string) $assembly,
            'summary' => mb_substr('Baixou ata v'.($minutes['currentVersion'] ?: '1.0').' de "'.$assemblyRow['title'].'"', 0, 235),
            'origin' => 'api',
        ]);

        $textBody = $minutes['content'] ?: ($minutes['summary'] ?: "ATA DE ASSEMBLEIA CONDOMINIAL\n\nCondomínio: ".($condo['name'] ?? 'Condomínio')."\nTítulo: {$assemblyRow['title']}\nData: {$dateStr}\nVersão: ".($minutes['currentVersion'] ?: '1.0')."\nStatus: {$minutes['status']}\n\nRESUMO DAS DELIBERAÇÕES:\n".($minutes['summary'] ?: 'Sem resumo anexado.')."\n\nATA COMPLETA:\n".($minutes['content'] ?: 'Sem conteúdo textual adicional.'));

        return response($textBody, 200, [
            'Content-Type' => ($minutes['fileFormat'] ?? '') === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$safeFilename.'"',
            'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
        ]);
    }

    public function commercialLead(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => 'required|string|min:2|max:140',
            'condominio' => 'nullable|string|max:160',
            'whatsapp' => 'nullable|string|max:30',
            'email' => 'required|email|max:160',
            'assunto' => 'required|string|max:100',
            'mensagem' => 'nullable|string|max:3000',
        ]);

        $subject = '[Comercial] ' . $data['assunto'] . (! empty($data['condominio']) ? ' - ' . $data['condominio'] : ' - ' . $data['nome']);
        $body = "Nome: {$data['nome']}\n"
            . (! empty($data['condominio']) ? 'Condomínio/Empresa: ' . $data['condominio'] . "\n" : '')
            . (! empty($data['whatsapp']) ? 'WhatsApp: ' . $data['whatsapp'] . "\n" : '')
            . "E-mail: {$data['email']}\n"
            . "Assunto: {$data['assunto']}\n"
            . (! empty($data['mensagem']) ? "\nMensagem:\n" . $data['mensagem'] : '');

        $ticketId = DB::table('support_tickets')->insertGetId([
            'condo_id' => null,
            'user_id' => null,
            'subject' => mb_substr($subject, 0, 200),
            'body' => $body,
            'category' => 'comercial',
            'priority' => 'alta',
            'status' => 'aberto',
            'answer' => null,
            'satisfaction' => null,
            'created_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'condo_id' => null,
            'user_id' => null,
            'user_name' => mb_substr($data['nome'], 0, 140),
            'action' => 'solicitacao_comercial',
            'entity' => 'lead_comercial',
            'entity_id' => (string) $ticketId,
            'summary' => mb_substr("Solicitação comercial: {$data['assunto']} ({$data['nome']})", 0, 240),
            'origin' => 'site_publico',
            'critical' => false,
            'ip' => mb_substr((string) $request->ip(), 0, 60),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 240),
            'created_at' => now(),
        ]);

        return response()->json([
            'data' => [
                'success' => true,
                'ticketId' => $ticketId,
                'message' => 'Recebemos sua solicitação! Nossa equipe entrará em contato pelos dados informados.',
            ],
        ], 201);
    }
}
