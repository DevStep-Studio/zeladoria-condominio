<?php

namespace App\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class ProviderService
{
    public const OPEN_STATUSES = ['solicitado', 'buscando_prestador', 'proposta_enviada', 'aguardando_orcamentos'];

    public function __construct(private EntitySerializer $serializer) {}

    public function vendor(Request $request): object
    {
        abort_if($request->user()->status === 'bloqueado', 401);
        $vendor = DB::table('vendors')->where('user_id', $request->user()->id)->first();
        if (! $vendor && $request->user()->is_super_admin) {
            $vendor = DB::table('vendors')->orderBy('id')->first();
        }
        abort_unless($vendor, 403, 'Perfil de prestador não encontrado.');
        abort_if(! $vendor->active || in_array($vendor->onboarding_status, ['suspenso', 'rejeitado'], true), 403, 'Perfil de prestador indisponível.');

        return $vendor;
    }

    public function row(string $entity, object $row, array $extras = []): array
    {
        return [...$this->serializer->serialize($entity, $row), ...array_intersect_key((array) $row, array_flip($extras))];
    }

    public function rows(string $entity, Builder $query, array $extras = []): array
    {
        return $query->get()->map(fn ($row) => $this->row($entity, $row, $extras))->all();
    }

    public function requests(object $vendor): Builder
    {
        return DB::table('service_requests as r')->where('r.condo_id', $vendor->condo_id)
            ->where(function (Builder $q) use ($vendor) {
                $q->where('r.vendor_id', $vendor->id)->orWhere(function (Builder $open) use ($vendor) {
                    $open->whereNull('r.vendor_id')->where('r.category', $vendor->category)->whereIn('r.status', self::OPEN_STATUSES);
                });
            });
    }

    public function requestRows(object $vendor, ?int $limit = null, bool $agenda = false): array
    {
        $q = $this->requests($vendor)->join('users as u', 'u.id', '=', 'r.customer_id')->leftJoin('condominiums as c', 'c.id', '=', 'r.condo_id')
            ->select('r.*', 'u.name as customerName', 'u.phone as customerPhone', 'c.name as condoName')->orderByDesc('r.created_at')->orderByDesc('r.id');
        if ($agenda) {
            $q->where('r.vendor_id', $vendor->id)->whereIn('r.status', ['aceito', 'orcamento_aprovado', 'a_caminho', 'chegou', 'em_atendimento'])->whereNotNull('r.scheduled_date');
        }
        if ($limit) {
            $q->limit($limit);
        }
        $rows = $this->rows('serviceRequests', $q, ['customerName', 'customerPhone', 'condoName']);
        foreach ($rows as &$row) {
            if ($row['vendorId'] !== $vendor->id) {
                $row['customerPhone'] = null;
            }
        }

        return $rows;
    }

    public function ownedRequest(object $vendor, int $id, bool $lock = false): object
    {
        $q = DB::table('service_requests')->where('id', $id)->where('condo_id', $vendor->condo_id)->where('vendor_id', $vendor->id);
        if ($lock) {
            $q->lockForUpdate();
        }

        return $q->first() ?? abort(404, 'Chamado não encontrado.');
    }

    public function quotes(object $vendor): array
    {
        return $this->rows('serviceQuotes', DB::table('service_quotes as q')->join('service_requests as r', 'r.id', '=', 'q.request_id')->where('q.vendor_id', $vendor->id)->where('r.condo_id', $vendor->condo_id)->select('q.*')->orderByDesc('q.created_at')->orderByDesc('q.id'));
    }

    public function reviews(object $vendor): array
    {
        return $this->rows('serviceReviews', DB::table('service_reviews as r')->join('users as u', 'u.id', '=', 'r.customer_id')->join('service_requests as sr', 'sr.id', '=', 'r.request_id')->where('r.vendor_id', $vendor->id)->where('sr.condo_id', $vendor->condo_id)->select('r.*', 'u.name as customerName', 'u.name as authorName')->orderByDesc('r.created_at')->orderByDesc('r.id'), ['customerName', 'authorName']);
    }

    public function message(Request $request, object $service, string $body): void
    {
        DB::table('service_messages')->insert(['request_id' => $service->id, 'sender_id' => $request->user()->id, 'sender_role' => 'prestador', 'body' => $body]);
        DB::table('notifications')->insert(['condo_id' => $service->condo_id, 'user_id' => $service->customer_id, 'title' => 'Atualização no serviço '.$service->code, 'body' => $body, 'link' => '/painel/servicos', 'channel' => 'app']);
    }

    public function audit(Request $request, object $vendor, string $action, string $entity, int $id, string $summary): void
    {
        DB::table('audit_logs')->insert(['condo_id' => $vendor->condo_id, 'user_id' => $request->user()->id, 'user_name' => $request->user()->name, 'action' => $action, 'entity' => $entity, 'entity_id' => (string) $id, 'summary' => mb_substr($summary, 0, 235), 'origin' => 'api', 'ip' => $request->ip()]);
    }
}
