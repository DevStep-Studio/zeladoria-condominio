<?php

namespace App\Http\Controllers\Api;

use App\Services\ProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class MarketplaceProviderController
{
    public function __construct(private ProviderService $providers) {}

    private function publicVendor(object $vendor): array
    {
        $data = $this->providers->row('vendors', $vendor);
        foreach (['bankInfo', 'pixInfo', 'identityVerification', 'documents', 'userId', 'verifiedById', 'email', 'notes'] as $field) {
            unset($data[$field]);
        }

        return $data;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate(['condoId' => 'sometimes|integer|min:1', 'category' => 'sometimes|string|max:40', 'q' => 'sometimes|string|max:160']);
        $query = DB::table('vendors as v')->join('condominiums as c', 'c.id', '=', 'v.condo_id')->where('c.public_page', true)->where('v.active', true)->whereNotIn('v.onboarding_status', ['suspenso', 'rejeitado'])->select('v.*');
        if (isset($filters['condoId'])) {
            $query->where('v.condo_id', $filters['condoId']);
        }
        if (isset($filters['category'])) {
            $query->where('v.category', $filters['category']);
        }
        if (! empty($filters['q'])) {
            $query->where('v.name', 'like', '%'.$filters['q'].'%');
        }

        return response()->json(['data' => $query->orderByDesc('v.verified')->orderBy('v.name')->orderBy('v.id')->limit(100)->get()->map($this->publicVendor(...))->all()]);
    }

    public function show(string $slug): JsonResponse
    {
        $v = DB::table('vendors as v')->join('condominiums as c', 'c.id', '=', 'v.condo_id')->where('v.slug', $slug)->where('v.active', true)->where('c.public_page', true)->whereNotIn('v.onboarding_status', ['suspenso', 'rejeitado'])->select('v.*')->first() ?? abort(404);
        $reviews = $this->providers->reviews($v);
        foreach ($reviews as &$review) {
            unset($review['customerId']);
        }

        return response()->json(['data' => ['vendor' => $this->publicVendor($v), 'reviews' => $reviews]]);
    }
}
