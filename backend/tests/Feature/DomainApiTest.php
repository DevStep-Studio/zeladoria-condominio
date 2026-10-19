<?php

namespace Tests\Feature;

use App\Models\Condominium;
use App\Models\User;
use App\Services\OperationService;
use App\Services\PasswordService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class DomainApiTest extends TestCase
{
    use RefreshDatabase;

    private string $serviceToken;

    private int $condo;

    private int $otherCondo;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->serviceToken = str_repeat('s', 64);
        config(['services.frontend.token' => $this->serviceToken]);
        $this->condo = DB::table('condominiums')->insertGetId(['name' => 'Condomínio A', 'slug' => 'condo-a']);
        $this->otherCondo = DB::table('condominiums')->insertGetId(['name' => 'Condomínio B', 'slug' => 'condo-b']);
        $id = DB::table('users')->insertGetId(['name' => 'Moradora', 'email' => 'moradora@example.com', 'password_hash' => app(PasswordService::class)->hash('senha1234')]);
        $this->user = User::findOrFail($id);
        DB::table('memberships')->insert(['user_id' => $id, 'condo_id' => $this->condo, 'role' => 'morador']);
    }

    private function service(): static
    {
        return $this->withHeader('X-Service-Token', $this->serviceToken);
    }

    private function login(): string
    {
        return $this->service()->postJson('/api/v1/auth/login', ['email' => 'moradora@example.com', 'password' => 'senha1234'])->assertOk()->json('data.token');
    }

    public function test_api_rejects_requests_without_the_private_service_credential(): void
    {
        $this->postJson('/api/v1/operations/lib.queries.002', ['parameters' => [$this->condo]])->assertUnauthorized();
        $this->withHeader('X-Service-Token', 'wrong')->postJson('/api/v1/auth/login', ['email' => $this->user->email, 'password' => 'senha1234'])->assertUnauthorized();
    }

    public function test_only_registered_operations_and_exact_parameter_counts_are_accepted(): void
    {
        $this->service()->postJson('/api/v1/operations/execute-sql', ['parameters' => ['DROP TABLE users']])->assertNotFound();
        $this->service()->postJson('/api/v1/operations/lib.queries.002', ['parameters' => []])->assertUnprocessable();
        $this->assertTrue(Schema::hasTable('users'));
    }

    public function test_mysql_tenant_filter_and_join_keep_other_condominium_data_out(): void
    {
        $a = DB::table('blocks')->insertGetId(['name' => 'Bloco A', 'condo_id' => $this->condo]);
        DB::table('blocks')->insert(['name' => 'Bloco B', 'condo_id' => $this->otherCondo]);
        DB::table('units')->insert(['number' => '101', 'condo_id' => $this->condo, 'block_id' => $a]);
        $this->service()->postJson('/api/v1/operations/lib.queries.002', ['parameters' => [$this->condo]])->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Bloco A');
        $this->service()->postJson('/api/v1/operations/lib.queries.001', ['parameters' => [$this->condo]])->assertOk()->assertJsonPath('data.0.block', 'Bloco A')->assertJsonPath('data.0.number', '101');
        $this->assertSame('mysql', DB::connection()->getDriverName());
    }

    public function test_an_idempotent_update_reports_the_matched_record(): void
    {
        $this->service()->postJson('/api/v1/operations/lib.actions.session.001', ['parameters' => [['theme' => 'light'], $this->user->id]])
            ->assertOk()->assertJsonPath('data.rowCount', 1);

        $this->assertDatabaseHas('users', ['id' => $this->user->id, 'theme' => 'light']);
    }

    public function test_insert_returning_preserves_boolean_json_null_and_server_defaults(): void
    {
        $response = $this->service()->postJson('/api/v1/operations/lib.actions.reservas.017', ['parameters' => [[
            'condoId' => $this->condo, 'name' => "Salão ' especial", 'requiresApproval' => false,
            'images' => ['https://example.com/a.jpg'], 'description' => null,
        ]]])->assertOk()->assertJsonPath('data.0.requiresApproval', false)->assertJsonPath('data.0.active', true)->assertJsonPath('data.0.images.0', 'https://example.com/a.jpg')->assertJsonPath('data.0.description', null);
        $this->assertIsInt($response->json('data.0.id'));
        $this->assertDatabaseHas('amenities', ['id' => $response->json('data.0.id'), 'name' => "Salão ' especial"]);
    }

    public function test_values_are_bound_and_unregistered_fields_are_rejected(): void
    {
        $payload = "x'); DROP TABLE users; --";
        $this->service()->postJson('/api/v1/operations/lib.actions.reservas.017', ['parameters' => [['condoId' => $this->condo, 'name' => $payload]]])->assertOk()->assertJsonPath('data.0.name', $payload);
        $this->assertTrue(Schema::hasTable('users'));
        $this->service()->postJson('/api/v1/operations/lib.actions.reservas.017', ['parameters' => [['condoId' => $this->condo, 'name' => 'Teste', 'unknownColumn' => true]]])->assertUnprocessable();
    }

    public function test_login_returns_opaque_token_and_does_not_expose_password_hash(): void
    {
        $token = $this->login();
        $this->assertNotEmpty($token);
        $this->service()->withToken($token)->getJson('/api/v1/auth/session?condoId='.$this->condo)->assertOk()->assertJsonPath('data.role', 'morador')->assertJsonPath('data.user.passwordHash', '');
        $this->service()->postJson('/api/v1/auth/login', ['email' => $this->user->email, 'password' => 'wrong'])->assertUnauthorized();
    }

    public function test_membership_role_in_another_condominium_cannot_elevate_current_role(): void
    {
        DB::table('memberships')->insert(['user_id' => $this->user->id, 'condo_id' => $this->otherCondo, 'role' => 'sindico']);
        $token = $this->login();
        $this->service()->withToken($token)->getJson('/api/v1/auth/session?condoId='.$this->condo.'&role=sindico')->assertOk()->assertJsonPath('data.role', 'morador');
        $this->service()->withToken($token)->getJson('/api/v1/auth/session?condoId='.$this->otherCondo.'&role=sindico')->assertOk()->assertJsonPath('data.role', 'sindico');
    }

    public function test_blocked_users_and_inactive_memberships_do_not_get_access(): void
    {
        DB::table('memberships')->where('user_id', $this->user->id)->update(['status' => 'inativo']);
        $token = $this->login();
        $this->service()->withToken($token)->getJson('/api/v1/auth/session')->assertOk()->assertJsonPath('data.memberships', [])->assertJsonPath('data.condo', null);
        DB::table('users')->where('id', $this->user->id)->update(['status' => 'bloqueado']);
        $this->app['auth']->forgetGuards();
        $this->service()->withToken($token)->getJson('/api/v1/auth/session')->assertUnauthorized();
    }

    public function test_password_change_validates_current_password_and_revokes_other_tokens(): void
    {
        $first = $this->login();
        $current = $this->login();
        $this->service()->withToken($current)->putJson('/api/v1/auth/password', ['currentPassword' => 'wrong', 'newPassword' => 'novaSenha123', 'confirmPassword' => 'novaSenha123'])->assertUnprocessable();
        $this->service()->withToken($current)->putJson('/api/v1/auth/password', ['currentPassword' => 'senha1234', 'newPassword' => 'novaSenha123', 'confirmPassword' => 'novaSenha123'])->assertOk();
        $this->assertCount(1, $this->user->tokens()->get());
        $this->assertTrue(app(PasswordService::class)->verify('novaSenha123', $this->user->fresh()->password_hash));
        $this->assertFalse(app(PasswordService::class)->verify('senha1234', $this->user->fresh()->password_hash));
    }

    public function test_logout_revokes_the_current_token_in_mysql(): void
    {
        $token = $this->login();
        $this->service()->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        $this->assertCount(0, $this->user->tokens()->get());
        $this->app['auth']->forgetGuards();
        $this->service()->withToken($token)->getJson('/api/v1/auth/session')->assertUnauthorized();
    }

    public function test_legacy_scrypt_passwords_remain_valid_without_a_postgresql_dependency(): void
    {
        $passwords = app(PasswordService::class);
        $hash = '0123456789abcdef0123456789abcdef:9deffce46a5dc3ab537164f5892d37511a848d6f639f646eb31088b58c83d63e';
        $this->assertTrue($passwords->verify('teste123', $hash));
        $this->assertFalse($passwords->verify('incorrect', $hash));
    }

    public function test_every_registered_read_operation_executes_with_mysql_syntax(): void
    {
        $catalog = json_decode(file_get_contents(resource_path('api/operations.json')), true, flags: JSON_THROW_ON_ERROR);
        $service = app(OperationService::class);
        foreach ($catalog as $name => $operation) {
            if ($operation['kind'] !== 'select') {
                continue;
            }
            $parameters = array_fill(0, $operation['parameters'], null);
            $prepare = function (mixed $node) use (&$prepare, &$parameters): void {
                if (! is_array($node)) {
                    return;
                }
                if (in_array($node['op'] ?? null, ['inArray', 'notInArray'], true)) {
                    $markList = function (array $expr) use (&$markList, &$parameters): void {
                        if (isset($expr['p'])) {
                            $parameters[$expr['p']] = [];
                        }
                        if (isset($expr['if'])) {
                            $markList($expr['yes']);
                            $markList($expr['no']);
                        }
                    };
                    $markList($node['a'][1]);
                }
                foreach ($node as $child) {
                    $prepare($child);
                }
            };
            $prepare($operation);
            if (isset($operation['limit']['p'])) {
                $parameters[$operation['limit']['p']] = 1;
            }
            try {
                $this->assertIsArray($service->execute($name, $parameters), $name);
            } catch (\Throwable $error) {
                $this->fail($name.': '.$error->getMessage());
            }
        }
    }

    public function test_execution_checklist_and_evidence_survive_a_mysql_json_round_trip(): void
    {
        $id = DB::table('service_requests')->insertGetId(['condo_id' => $this->condo, 'customer_id' => $this->user->id, 'code' => 'SRV-TEST-001', 'title' => 'Reparo', 'description' => 'Reparo elétrico', 'category' => 'eletrica', 'checklist' => json_encode([['item' => 'Verificar tensão', 'checked' => true]]), 'materials_used' => json_encode([['name' => 'Cabo', 'quantity' => 3]])]);
        $request = DB::table('service_requests')->find($id);
        $this->assertTrue(json_decode($request->checklist, true)[0]['checked']);
        $this->assertSame(3, json_decode($request->materials_used, true)[0]['quantity']);
    }

    public function test_eloquent_models_and_painel_domain_routes_work_end_to_end(): void
    {
        $condoModel = Condominium::findOrFail($this->condo);
        $this->assertSame('Condomínio A', $condoModel->name);

        $token = $this->login();
        $this->service()->withToken($token)->getJson('/api/v1/painel/layout?condoId='.$this->condo)
            ->assertOk()
            ->assertJsonStructure(['data' => ['unread', 'annCount']]);

        $this->service()->withToken($token)->getJson('/api/v1/painel/dashboard?condoId='.$this->condo.'&role=morador')
            ->assertOk()
            ->assertJsonPath('data.condoRow.id', $this->condo);

        $this->service()->withToken($token)->getJson('/api/v1/painel/comunicados?condoId='.$this->condo)
            ->assertOk()
            ->assertJsonStructure(['data']);

        $this->service()->withToken($token)->patchJson('/api/v1/auth/theme', ['theme' => 'dark'])
            ->assertOk();
        $this->assertSame('dark', $this->user->fresh()->theme);
    }
}
