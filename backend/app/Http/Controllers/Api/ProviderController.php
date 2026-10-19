<?php

namespace App\Http\Controllers\Api;

use App\Services\ProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class ProviderController
{
    public function __construct(private ProviderService $providers) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->providers->row('vendors', $this->providers->vendor($request))]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);

        return response()->json(['data' => ['vendor' => $this->providers->row('vendors', $v), 'requests' => $this->providers->requestRows($v, 20), 'quotes' => array_slice($this->providers->quotes($v), 0, 10), 'reviews' => array_slice($this->providers->reviews($v), 0, 5)]]);
    }

    public function update(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = $request->validate([
            'description' => 'sometimes|nullable|string|max:10000', 'whatsapp' => 'sometimes|nullable|string|max:32', 'phone' => 'sometimes|nullable|string|max:32',
            'serviceArea' => 'sometimes|nullable|string|max:240', 'serviceRadiusKm' => 'sometimes|numeric|min:1|max:1000', 'workingHours' => 'sometimes|nullable|string|max:1000',
            'photoUrl' => 'sometimes|nullable|string|max:4000000', 'coverUrl' => 'sometimes|nullable|string|max:4000000',
            'services' => 'sometimes|array|max:100', 'services.*' => 'array:id,name,description,priceFromCents,priceType,estimatedDurationMinutes,warrantyDays',
            'services.*.id' => 'required|string|max:100', 'services.*.name' => 'required|string|max:200', 'services.*.description' => 'sometimes|nullable|string|max:5000', 'services.*.priceFromCents' => 'nullable|integer|min:0|max:100000000',
            'portfolio' => 'sometimes|array|max:100', 'portfolio.*' => 'array:url,caption,category,date', 'portfolio.*.url' => 'required|string|max:4000000', 'portfolio.*.caption' => 'sometimes|nullable|string|max:1000',
        ]);
        $columns = ['description' => 'description', 'whatsapp' => 'whatsapp', 'phone' => 'phone', 'serviceArea' => 'service_area', 'serviceRadiusKm' => 'service_radius_km', 'workingHours' => 'working_hours', 'photoUrl' => 'photo_url', 'coverUrl' => 'cover_url', 'services' => 'services', 'portfolio' => 'portfolio'];
        DB::transaction(function () use ($request, $v, $data, $columns) {
            $values = [];
            foreach ($data as $key => $value) {
                $values[$columns[$key]] = in_array($key, ['services', 'portfolio'], true) ? json_encode($value, JSON_THROW_ON_ERROR) : $value;
            }
            if ($values) {
                DB::table('vendors')->where('id', $v->id)->update($values);
            }
            $this->providers->audit($request, $v, 'atualizar', 'prestador', $v->id, 'Atualizou o perfil e catálogo do prestador');
        });

        return response()->json(['data' => ['success' => true]]);
    }

    public function availability(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = $request->validate(['isOnline' => 'sometimes|boolean', 'availableNow' => 'sometimes|boolean', 'toggle' => 'sometimes|in:online,available']);

        return DB::transaction(function () use ($v, $data) {
            $current = DB::table('vendors')->where('id', $v->id)->lockForUpdate()->first();
            $values = [];
            if (array_key_exists('isOnline', $data)) {
                $values['is_online'] = $data['isOnline'];
            }
            if (array_key_exists('availableNow', $data)) {
                $values['available_now'] = $data['availableNow'];
            }
            if (($data['toggle'] ?? null) === 'online') {
                $values['is_online'] = ! $current->is_online;
            }
            if (($data['toggle'] ?? null) === 'available') {
                $values = ['is_online' => ! $current->available_now, 'available_now' => ! $current->available_now];
            }
            if ($values) {
                DB::table('vendors')->where('id', $v->id)->update($values);
            }

            return response()->json(['data' => ['success' => true, 'isOnline' => (bool) ($values['is_online'] ?? $current->is_online), 'availableNow' => (bool) ($values['available_now'] ?? $current->available_now)]]);
        });
    }

    public function agenda(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);

        return response()->json(['data' => ['vendor' => $this->providers->row('vendors', $v), 'appointments' => $this->providers->requestRows($v, agenda: true)]]);
    }

    public function reviews(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->providers->reviews($this->providers->vendor($request))]);
    }

    public function earnings(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);

        return response()->json(['data' => ['vendor' => $this->providers->row('vendors', $v),
            'services' => $this->providers->rows('serviceRequests', DB::table('service_requests')->where('vendor_id', $v->id)->where('condo_id', $v->condo_id)->where('status', 'concluido')->orderByDesc('completed_at')),
            'orders' => $this->providers->rows('paymentOrders', DB::table('payment_orders')->where('vendor_id', $v->id)->where('condo_id', $v->condo_id)->orderByDesc('created_at')),
        ]]);
    }

    public function plans(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);

        return response()->json(['data' => $this->providers->rows('promotionPlans', DB::table('promotion_plans')->where('active', true)->where(fn ($q) => $q->whereNull('condo_id')->orWhere('condo_id', $v->condo_id))->orderBy('id'))]);
    }

    public function promotions(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);

        return response()->json(['data' => $this->providers->rows('providerPromotions', DB::table('provider_promotions')->where('vendor_id', $v->id)->where('condo_id', $v->condo_id)->orderByDesc('created_at'))]);
    }

    public function storePromotion(Request $request): JsonResponse
    {
        $v = $this->providers->vendor($request);
        $data = $request->validate(['planId' => 'required|integer|min:1', 'categoryId' => 'sometimes|nullable|string|max:100', 'region' => 'sometimes|nullable|string|max:120']);
        $plan = DB::table('promotion_plans')->where('id', $data['planId'])->where('active', true)->where(fn ($q) => $q->whereNull('condo_id')->orWhere('condo_id', $v->condo_id))->first() ?? abort(404, 'Plano não encontrado.');

        return DB::transaction(function () use ($request, $v, $data, $plan) {
            // Paid campaigns require payment confirmation; creating one never simulates a successful charge.
            $free = $plan->price_cents === 0;
            $id = DB::table('provider_promotions')->insertGetId(['condo_id' => $v->condo_id, 'vendor_id' => $v->id, 'plan_id' => $plan->id, 'type' => $plan->type, 'category_id' => $data['categoryId'] ?? $v->category, 'region' => $data['region'] ?? $v->service_area, 'starts_at' => now(), 'ends_at' => now()->addDays($plan->duration_days), 'status' => $free ? 'ACTIVE' : 'PENDING', 'amount_cents' => $plan->price_cents, 'payment_status' => $free ? 'paid' : 'pending']);
            if ($free) {
                DB::table('vendors')->where('id', $v->id)->update(['sponsored' => true]);
            }
            $this->providers->audit($request, $v, 'criar', 'campanha', $id, 'Criou campanha de destaque');

            return response()->json(['data' => ['success' => true, 'promotionId' => $id, 'status' => $free ? 'ACTIVE' : 'PENDING']], 201);
        });
    }

    public function destroyPromotion(Request $request, int $promotion): JsonResponse
    {
        $v = $this->providers->vendor($request);

        return DB::transaction(function () use ($v, $promotion) {
            $row = DB::table('provider_promotions')->where('id', $promotion)->where('vendor_id', $v->id)->where('condo_id', $v->condo_id)->lockForUpdate()->first() ?? abort(404);
            DB::table('provider_promotions')->where('id', $row->id)->update(['status' => 'CANCELLED']);
            $active = DB::table('provider_promotions')->where('vendor_id', $v->id)->where('status', 'ACTIVE')->where('payment_status', 'paid')->where('ends_at', '>', now())->exists();
            DB::table('vendors')->where('id', $v->id)->update(['sponsored' => $active]);

            return response()->json(['data' => ['success' => true]]);
        });
    }
}
