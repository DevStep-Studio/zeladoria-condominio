<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PasswordService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class ProviderApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.frontend.token' => str_repeat('p', 64)]);
        $this->withHeader('X-Service-Token', str_repeat('p', 64));
    }

    private function condo(string $slug = 'condo-a'): int
    {
        return DB::table('condominiums')->insertGetId(['name' => $slug, 'slug' => $slug, 'public_page' => true]);
    }

    private function user(string $email = 'prestador@example.com'): User
    {
        $id = DB::table('users')->insertGetId(['name' => $email, 'email' => $email, 'password_hash' => app(PasswordService::class)->hash('senha1234')]);

        return User::findOrFail($id);
    }

    private function provider(int $condo, User $user): int
    {
        return DB::table('vendors')->insertGetId(['condo_id' => $condo, 'user_id' => $user->id, 'name' => 'Eletricista', 'slug' => 'prestador-'.$user->id, 'category' => 'eletrica', 'onboarding_status' => 'aprovado', 'active' => true, 'verified' => false, 'bank_info' => '{"account":"secret"}', 'identity_verification' => '{"frontUrl":"private-document"}']);
    }

    private function authenticate(User $user): void
    {
        $this->app['auth']->forgetGuards();
        $this->withToken($user->createToken('test', ['*'], now()->addDay())->plainTextToken);
    }

    private function service(int $condo, User $customer, ?int $vendor, string $status = 'solicitado'): int
    {
        return DB::table('service_requests')->insertGetId(['condo_id' => $condo, 'customer_id' => $customer->id, 'vendor_id' => $vendor, 'code' => 'SRV-'.uniqid(), 'title' => 'Reparo elétrico', 'description' => 'Tomada quebrada', 'category' => 'eletrica', 'status' => $status]);
    }

    public function test_provider_routes_require_a_user_session_and_a_provider_profile(): void
    {
        $this->getJson('/api/v1/prestador/dashboard')->assertUnauthorized();
        $user = $this->user();
        $this->authenticate($user);
        $this->getJson('/api/v1/prestador/dashboard')->assertForbidden();
    }

    public function test_provider_can_update_only_own_profile_with_validated_fields(): void
    {
        $condo = $this->condo();
        $user = $this->user();
        $vendor = $this->provider($condo, $user);
        $otherUser = $this->user('other@example.com');
        $other = $this->provider($condo, $otherUser);
        $this->authenticate($user);

        $this->patchJson('/api/v1/prestador/perfil', ['description' => 'Especialista', 'verified' => true, 'userId' => $otherUser->id, 'vendorId' => $other, 'portfolio' => [['url' => '/foto.jpg', 'caption' => 'Reparo']]])->assertOk()->assertJsonPath('data.success', true);
        $this->assertDatabaseHas('vendors', ['id' => $vendor, 'description' => 'Especialista', 'verified' => false, 'user_id' => $user->id]);
        $this->assertDatabaseMissing('vendors', ['id' => $other, 'description' => 'Especialista']);
        $this->patchJson('/api/v1/prestador/perfil', ['serviceRadiusKm' => -1])->assertUnprocessable()->assertJsonValidationErrors('serviceRadiusKm');
    }

    public function test_provider_dashboard_never_includes_requests_assigned_to_other_vendors_or_tenants(): void
    {
        $a = $this->condo();
        $b = $this->condo('condo-b');
        $user = $this->user();
        $vendor = $this->provider($a, $user);
        $other = $this->provider($a, $this->user('other@example.com'));
        $customer = $this->user('customer@example.com');
        $own = $this->service($a, $customer, $vendor);
        $open = $this->service($a, $customer, null, 'buscando_prestador');
        $this->service($a, $customer, $other);
        $this->service($b, $customer, null, 'buscando_prestador');
        $this->authenticate($user);

        $response = $this->getJson('/api/v1/prestador/dashboard?vendorId='.$other.'&condoId='.$b)->assertOk()->assertJsonCount(2, 'data.requests')->assertJsonPath('data.vendor.id', $vendor);
        $this->assertEqualsCanonicalizing([$own, $open], array_column($response->json('data.requests'), 'id'));
    }

    public function test_accept_is_atomic_and_does_not_steal_another_providers_assignment(): void
    {
        $condo = $this->condo();
        $a = $this->user();
        $va = $this->provider($condo, $a);
        $b = $this->user('other@example.com');
        $this->provider($condo, $b);
        $customer = $this->user('customer@example.com');
        $id = $this->service($condo, $customer, null, 'buscando_prestador');
        $this->authenticate($a);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/aceite')->assertOk();
        $this->authenticate($b);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/aceite')->assertNotFound();
        $this->assertDatabaseHas('service_requests', ['id' => $id, 'vendor_id' => $va, 'status' => 'aceito']);
        $this->assertSame(1, DB::table('service_messages')->where('request_id', $id)->count());
    }

    public function test_foreign_requests_cannot_be_modified_and_invalid_transitions_do_not_write(): void
    {
        $condo = $this->condo();
        $user = $this->user();
        $this->provider($condo, $user);
        $otherUser = $this->user('other@example.com');
        $other = $this->provider($condo, $otherUser);
        $customer = $this->user('customer@example.com');
        $id = $this->service($condo, $customer, $other);
        $this->authenticate($user);
        $this->patchJson('/api/v1/prestador/chamados/'.$id.'/status', ['status' => 'a_caminho'])->assertNotFound();
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/recusa')->assertNotFound();
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/evidencias', ['stage' => 'ANTES', 'fileUrl' => '/foto.jpg'])->assertNotFound();
        $this->assertDatabaseHas('service_requests', ['id' => $id, 'status' => 'solicitado']);
        $this->assertDatabaseCount('service_evidences', 0);
    }

    public function test_completion_requires_execution_and_leaves_customer_confirmation_pending(): void
    {
        $condo = $this->condo();
        $user = $this->user();
        $vendor = $this->provider($condo, $user);
        $customer = $this->user('customer@example.com');
        $id = $this->service($condo, $customer, $vendor, 'aceito');
        $this->authenticate($user);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/conclusao')->assertConflict();
        DB::table('service_requests')->where('id', $id)->update(['status' => 'em_atendimento']);
        $this->patchJson('/api/v1/prestador/chamados/'.$id.'/execucao', ['checklist' => [['item' => 'Conferir', 'checked' => true]], 'materialsUsed' => [['name' => 'Cabo', 'quantity' => 2]]])->assertOk();
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/conclusao', ['finalNotes' => 'Reparo realizado', 'finalPhotos' => ['/depois.jpg']])->assertOk();
        $this->assertDatabaseHas('service_requests', ['id' => $id, 'status' => 'prestador_concluiu', 'completed_at' => null, 'validated_at' => null]);
        $this->assertDatabaseHas('service_evidences', ['request_id' => $id, 'vendor_id' => $vendor, 'stage' => 'DEPOIS']);
        $this->assertTrue(json_decode(DB::table('service_requests')->where('id', $id)->value('checklist'), true)[0]['checked']);
    }

    public function test_quote_is_versioned_and_cannot_modify_a_signed_contract(): void
    {
        $condo = $this->condo();
        $user = $this->user();
        $vendor = $this->provider($condo, $user);
        $customer = $this->user('customer@example.com');
        $id = $this->service($condo, $customer, $vendor, 'aceito');
        $this->authenticate($user);
        $body = ['laborCents' => 10000, 'materialsCents' => 2500, 'description' => 'Trocar tomada', 'estimatedDays' => 1];
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/orcamentos', $body)->assertCreated();
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/orcamentos', $body)->assertCreated();
        $this->assertDatabaseHas('service_quotes', ['request_id' => $id, 'version' => 1, 'status' => 'substituida']);
        $this->assertDatabaseHas('service_quotes', ['request_id' => $id, 'version' => 2, 'total_cents' => 12500, 'status' => 'pendente']);
        DB::table('service_quotes')->where('request_id', $id)->where('version', 2)->update(['status' => 'aceito']);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/orcamentos', $body)->assertConflict();
        $this->assertSame(2, DB::table('service_quotes')->where('request_id', $id)->count());
    }

    public function test_public_provider_profile_never_exposes_banking_or_identity_documents(): void
    {
        $condo = $this->condo();
        $user = $this->user();
        $vendor = $this->provider($condo, $user);
        $response = $this->getJson('/api/v1/prestadores/prestador-'.$user->id)->assertOk()->assertJsonPath('data.vendor.id', $vendor);
        $this->assertArrayNotHasKey('bankInfo', $response->json('data.vendor'));
        $this->assertArrayNotHasKey('identityVerification', $response->json('data.vendor'));
        $this->assertStringNotContainsString('private-document', $response->getContent());
    }

    public function test_mural_filters_private_expired_and_non_tv_announcements(): void
    {
        $condo = $this->condo();
        foreach ([['Publicado', true, 'todos', null], ['Privado', true, 'bloco', null], ['Não TV', false, 'todos', null], ['Expirado', true, 'todos', now()->subDay()]] as [$title, $tv, $audience, $expires]) {
            DB::table('announcements')->insert(['condo_id' => $condo, 'title' => $title, 'body' => 'Aviso', 'show_on_tv' => $tv, 'audience' => $audience, 'expires_at' => $expires]);
        }
        $this->getJson('/api/v1/mural?c=condo-a')->assertOk()->assertJsonCount(1, 'data.news')->assertJsonPath('data.news.0.title', 'Publicado');
        DB::table('condominiums')->where('id', $condo)->update(['public_page' => false]);
        $this->getJson('/api/v1/mural?c=condo-a')->assertNotFound();
    }

    public function test_status_and_csv_templates_have_domain_routes(): void
    {
        $this->getJson('/api/v1/status')->assertOk()->assertJsonPath('data.driver', 'mysql')->assertJsonPath('data.ok', true);
        $this->get('/api/v1/modelos/unidades')->assertOk()->assertSee('bloco;unidade');
        $this->get('/api/v1/modelos/unknown')->assertNotFound();
    }

    public function test_service_routes_scope_requests_to_the_customer_and_condominium(): void
    {
        $a = $this->condo();
        $b = $this->condo('condo-b');
        $customer = $this->user('customer@example.com');
        $other = $this->user('other@example.com');
        DB::table('memberships')->insert(['condo_id' => $a, 'user_id' => $customer->id, 'role' => 'morador']);
        $own = $this->service($a, $customer, null);
        $foreign = $this->service($a, $other, null);
        $this->service($b, $customer, null);
        $this->authenticate($customer);
        $this->getJson('/api/v1/servicos?condoId='.$a)->assertOk()->assertJsonCount(1, 'data.marketplaceRequests')->assertJsonPath('data.marketplaceRequests.0.id', $own);
        $this->postJson('/api/v1/servicos/'.$foreign.'/mensagens', ['body' => 'Tentativa'])->assertNotFound();
        $this->getJson('/api/v1/servicos?condoId='.$b)->assertNotFound();
        $this->get('/api/v1/export/moradores?condoId='.$a)->assertForbidden();
    }

    public function test_resident_hiring_reaches_provider_and_status_returns_to_resident(): void
    {
        $condo = $this->condo();
        $customer = $this->user('resident@example.com');
        $provider = $this->user();
        $vendor = $this->provider($condo, $provider);
        DB::table('vendors')->where('id', $vendor)->update(['category' => 'eletricista']);
        DB::table('memberships')->insert(['condo_id' => $condo, 'user_id' => $customer->id, 'role' => 'morador']);
        $this->authenticate($customer);
        $this->getJson('/api/v1/servicos/prestadores?condoId='.$condo)->assertOk()->assertJsonPath('data.vendorRows.0.id', $vendor);
        $result = $this->postJson('/api/v1/servicos', ['condoId' => $condo, 'vendorId' => $vendor, 'mode' => 'quote', 'category' => 'eletrica', 'title' => 'Consertar tomada', 'description' => 'A tomada não funciona']);
        $result->assertCreated()->assertJsonPath('data.success', true);
        $id = $result->json('data.requestId');
        $this->assertDatabaseHas('service_requests', ['id' => $id, 'customer_id' => $customer->id, 'vendor_id' => $vendor, 'status' => 'solicitado']);
        $this->assertDatabaseHas('notifications', ['user_id' => $provider->id, 'link' => '/prestador/chamados']);
        $this->authenticate($provider);
        $this->getJson('/api/v1/auth/session')->assertOk()->assertJsonPath('data.condo', null)->assertJsonPath('data.role', 'prestador');
        $this->getJson('/api/v1/prestador/chamados/'.$id)->assertOk()->assertJsonPath('data.request.id', $id);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/aceite')->assertOk();
        $this->authenticate($customer);
        $this->getJson('/api/v1/servicos/'.$id.'?condoId='.$condo)->assertOk()->assertJsonPath('data.request.status', 'aceito');
        $this->assertDatabaseHas('notifications', ['user_id' => $customer->id, 'link' => '/painel/servicos']);
    }

    public function test_provider_can_switch_to_condo_only_with_an_active_membership(): void
    {
        $condo = $this->condo();
        $provider = $this->user();
        $this->provider($condo, $provider);
        $this->authenticate($provider);
        $this->getJson('/api/v1/auth/session?role=morador&condoId='.$condo)->assertOk()->assertJsonPath('data.role', 'prestador')->assertJsonPath('data.condo', null);
        DB::table('memberships')->insert(['condo_id' => $condo, 'user_id' => $provider->id, 'role' => 'morador', 'status' => 'ativo']);
        $this->getJson('/api/v1/auth/session?role=morador&condoId='.$condo)->assertOk()->assertJsonPath('data.role', 'morador')->assertJsonPath('data.condo.id', $condo);
        $this->getJson('/api/v1/painel/layout?role=morador&condoId='.$condo)->assertOk();
        DB::table('memberships')->where('user_id', $provider->id)->update(['status' => 'inativo']);
        $this->getJson('/api/v1/auth/session?role=morador&condoId='.$condo)->assertOk()->assertJsonPath('data.role', 'prestador')->assertJsonPath('data.condo', null);
    }

    public function test_open_opportunities_match_legacy_and_registration_categories(): void
    {
        $condo = $this->condo();
        $customer = $this->user('customer@example.com');
        $provider = $this->user();
        $vendor = $this->provider($condo, $provider);
        DB::table('vendors')->where('id', $vendor)->update(['category' => 'eletricista']);
        $id = $this->service($condo, $customer, null, 'buscando_prestador');
        $this->authenticate($provider);
        $this->getJson('/api/v1/prestador/chamados')->assertOk()->assertJsonFragment(['id' => $id]);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/aceite')->assertOk();
        $this->assertDatabaseHas('service_requests', ['id' => $id, 'vendor_id' => $vendor, 'status' => 'aceito']);
    }

    public function test_registration_does_not_reuse_an_existing_account_or_trust_verification_flags(): void
    {
        $condo = $this->condo();
        $body = ['name' => 'João', 'lastName' => 'Silva', 'email' => 'joao@example.com', 'password' => 'senha1234', 'phone' => '41999999999', 'providerType' => 'autonomo', 'category' => 'eletrica', 'services' => [['id' => 's1', 'name' => 'Reparo', 'priceFromCents' => 10000]], 'serviceArea' => 'Curitiba', 'serviceRadiusKm' => 15, 'condoId' => $condo, 'verified' => true, 'isSuperAdmin' => true];
        $this->postJson('/api/v1/prestadores/cadastro', $body)->assertCreated()->assertJsonPath('data.success', true);
        $this->assertDatabaseHas('users', ['email' => 'joao@example.com', 'is_super_admin' => false]);
        $this->assertDatabaseHas('vendors', ['email' => 'joao@example.com', 'verified' => false, 'onboarding_status' => 'em_analise']);
        $this->postJson('/api/v1/prestadores/cadastro', $body)->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertDatabaseCount('users', 1);
    }

    public function test_paid_promotions_do_not_become_active_without_payment_confirmation(): void
    {
        $condo = $this->condo();
        $user = $this->user();
        $vendor = $this->provider($condo, $user);
        $plan = DB::table('promotion_plans')->insertGetId(['name' => 'Destaque', 'type' => 'categoria', 'duration_days' => 7, 'price_cents' => 2990, 'active' => true]);
        $this->authenticate($user);
        $this->postJson('/api/v1/prestador/campanhas', ['planId' => $plan])->assertCreated()->assertJsonPath('data.status', 'PENDING');
        $this->assertDatabaseHas('provider_promotions', ['vendor_id' => $vendor, 'status' => 'PENDING', 'payment_status' => 'pending']);
        $this->assertDatabaseHas('vendors', ['id' => $vendor, 'sponsored' => false]);
    }
}
