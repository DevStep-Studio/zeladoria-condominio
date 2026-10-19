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
        $memberships = DB::table('memberships as m')
            ->join('condominiums as c', 'c.id', '=', 'm.condo_id')
            ->leftJoin('units as u', 'u.id', '=', 'm.unit_id')
            ->where('m.user_id', $user->id)->where('m.status', 'ativo')
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
        $condo = $active ? DB::table('condominiums')->find($active['condoId']) : ($vendor ? DB::table('condominiums')->find($vendor->condo_id) : null);
        $roles = array_values(array_unique([...($user->is_super_admin ? ['superadmin', 'sindico', 'morador', 'prestador'] : []), ...($vendor ? ['prestador'] : []), ...array_column($memberships, 'role')]));
        $allowedHere = $user->is_super_admin ? $roles : array_values(array_unique([...($active ? [$active['role']] : []), ...($vendor ? ['prestador'] : [])]));
        $defaultRole = $user->is_super_admin ? 'superadmin' : ($active['role'] ?? ($vendor ? 'prestador' : 'morador'));
        $role = in_array($requestedRole, $allowedHere, true) ? $requestedRole : $defaultRole;

        return ['user' => $this->serializer->serialize('users', $user->getAttributes()), 'memberships' => $memberships, 'condo' => $condo ? $this->serializer->serialize('condominiums', $condo) : null, 'role' => $role, 'availableRoles' => $roles, 'unitId' => $active['unitId'] ?? null, 'vendorId' => $vendor->id ?? null];
    }
}
