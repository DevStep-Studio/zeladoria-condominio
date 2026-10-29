<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PasswordService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class Priority1SecurityAndStabilityTest extends TestCase
{
    use RefreshDatabase;

    private string $serviceToken;

    private int $condoA;

    private int $condoB;

    private User $moradorA;

    private User $sindicoA;

    private User $superadmin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->serviceToken = str_repeat('s', 64);
        config(['services.frontend.token' => $this->serviceToken]);

        $this->condoA = DB::table('condominiums')->insertGetId(['name' => 'Condomínio A', 'slug' => 'condo-a', 'public_page' => true]);
        $this->condoB = DB::table('condominiums')->insertGetId(['name' => 'Condomínio B', 'slug' => 'condo-b', 'public_page' => true]);

        $passwords = app(PasswordService::class);
        $moradorId = DB::table('users')->insertGetId([
            'name' => 'Morador A',
            'email' => 'morador@condoa.com',
            'password_hash' => $passwords->hash('senha1234'),
            'status' => 'ativo',
            'is_super_admin' => false,
        ]);
        $this->moradorA = User::findOrFail($moradorId);
        DB::table('memberships')->insert(['user_id' => $moradorId, 'condo_id' => $this->condoA, 'role' => 'morador', 'status' => 'ativo']);

        $sindicoId = DB::table('users')->insertGetId([
            'name' => 'Síndico A',
            'email' => 'sindico@condoa.com',
            'password_hash' => $passwords->hash('senha1234'),
            'status' => 'ativo',
            'is_super_admin' => false,
        ]);
        $this->sindicoA = User::findOrFail($sindicoId);
        DB::table('memberships')->insert(['user_id' => $sindicoId, 'condo_id' => $this->condoA, 'role' => 'sindico', 'status' => 'ativo']);

        $superadminId = DB::table('users')->insertGetId([
            'name' => 'Superadmin',
            'email' => 'superadmin@zeladoria.com',
            'password_hash' => $passwords->hash('senha1234'),
            'status' => 'ativo',
            'is_super_admin' => true,
        ]);
        $this->superadmin = User::findOrFail($superadminId);
    }

    private function actingAsUser(User $user, int $condoId, string $role): static
    {
        $token = $user->createToken('test', ['*'])->plainTextToken;

        return $this->withHeader('X-Service-Token', $this->serviceToken)
            ->withHeader('Authorization', 'Bearer '.$token);
    }

    public function test_non_superadmin_is_forbidden_from_admin_panel_endpoints(): void
    {
        $this->actingAsUser($this->moradorA, $this->condoA, 'morador')
            ->getJson('/api/v1/painel/admin?condoId='.$this->condoA)
            ->assertForbidden();

        $this->actingAsUser($this->sindicoA, $this->condoA, 'sindico')
            ->getJson('/api/v1/painel/admin?condoId='.$this->condoA)
            ->assertForbidden();

        $this->actingAsUser($this->superadmin, $this->condoA, 'superadmin')
            ->getJson('/api/v1/painel/admin?condoId='.$this->condoA)
            ->assertOk();
    }

    public function test_get_notificacoes_is_idempotent_and_does_not_mark_as_read(): void
    {
        $notifId = DB::table('notifications')->insertGetId([
            'condo_id' => $this->condoA,
            'user_id' => $this->moradorA->id,
            'title' => 'Comunicado urgente',
            'body' => 'Manutenção na caixa d’água',
            'channel' => 'app',
            'read_at' => null,
            'created_at' => now(),
        ]);

        $response = $this->actingAsUser($this->moradorA, $this->condoA, 'morador')
            ->getJson('/api/v1/painel/notificacoes?condoId='.$this->condoA)
            ->assertOk();

        $this->assertNull(DB::table('notifications')->where('id', $notifId)->value('read_at'));
    }

    public function test_occurrence_comments_do_not_leak_cross_tenant_or_internal_notes_to_residents(): void
    {
        $occA = DB::table('occurrences')->insertGetId([
            'condo_id' => $this->condoA,
            'code' => 'OC-1001',
            'title' => 'Barulho Bloco A',
            'description' => 'Música alta',
            'visibility' => 'publica',
            'status' => 'recebida',
            'reported_by_id' => $this->moradorA->id,
            'occurred_at' => now(),
            'created_at' => now(),
        ]);

        $occB = DB::table('occurrences')->insertGetId([
            'condo_id' => $this->condoB,
            'code' => 'OC-2001',
            'title' => 'Vazamento Bloco B',
            'description' => 'Vazamento no teto',
            'visibility' => 'publica',
            'status' => 'recebida',
            'reported_by_id' => $this->sindicoA->id,
            'occurred_at' => now(),
            'created_at' => now(),
        ]);

        $commentPublicA = DB::table('occurrence_comments')->insertGetId([
            'occurrence_id' => $occA,
            'user_id' => $this->sindicoA->id,
            'body' => 'Equipe notificada.',
            'internal' => false,
            'created_at' => now(),
        ]);

        $commentInternalA = DB::table('occurrence_comments')->insertGetId([
            'occurrence_id' => $occA,
            'user_id' => $this->sindicoA->id,
            'body' => 'Nota interna sigilosa do conselho.',
            'internal' => true,
            'created_at' => now(),
        ]);

        $commentCondoB = DB::table('occurrence_comments')->insertGetId([
            'occurrence_id' => $occB,
            'user_id' => $this->sindicoA->id,
            'body' => 'Comentário confidencial de outro condomínio.',
            'internal' => false,
            'created_at' => now(),
        ]);

        $res = $this->actingAsUser($this->moradorA, $this->condoA, 'morador')
            ->getJson('/api/v1/painel/ocorrencias?condoId='.$this->condoA)
            ->assertOk();

        $commentIds = array_column($res->json('data.comments'), 'id');
        $this->assertContains($commentPublicA, $commentIds);
        $this->assertNotContains($commentInternalA, $commentIds);
        $this->assertNotContains($commentCondoB, $commentIds);
    }
}
