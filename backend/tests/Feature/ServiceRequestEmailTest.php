<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ServiceRequested;
use App\Notifications\ServiceStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

final class ServiceRequestEmailTest extends TestCase
{
    use RefreshDatabase;

    private int $condo;

    private int $vendor;

    private User $customer;

    private User $provider;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.frontend.token' => str_repeat('e', 64), 'services.frontend.url' => 'https://frontend.example']);
        $this->withHeader('X-Service-Token', str_repeat('e', 64));
        $this->condo = DB::table('condominiums')->insertGetId(['name' => 'Condomínio A', 'slug' => 'condo-a', 'public_page' => true]);
        foreach (['customer', 'provider'] as $role) {
            $id = DB::table('users')->insertGetId(['name' => $role, 'email' => $role.'@example.com', 'password_hash' => 'unused']);
            $this->{$role} = User::findOrFail($id);
        }
        $this->vendor = DB::table('vendors')->insertGetId(['condo_id' => $this->condo, 'user_id' => $this->provider->id, 'name' => 'Eletricista', 'slug' => 'electrician', 'category' => 'eletrica', 'active' => true, 'onboarding_status' => 'aprovado']);
        DB::table('memberships')->insert(['condo_id' => $this->condo, 'user_id' => $this->customer->id, 'role' => 'morador']);
        $this->withToken($this->customer->createToken('test')->plainTextToken);
    }

    private function payload(?int $vendor): array
    {
        return ['condoId' => $this->condo, 'vendorId' => $vendor, 'mode' => 'quote', 'category' => 'eletrica', 'title' => 'Reparo da tomada', 'description' => 'Tomada da cozinha quebrada', 'scheduledDate' => '2026-12-20', 'scheduledTimeSlot' => '09:00 - 12:00'];
    }

    public function test_selected_provider_and_customer_receive_individual_emails(): void
    {
        Notification::fake();
        $response = $this->postJson('/api/v1/servicos', $this->payload($this->vendor))->assertCreated();
        $response->assertJsonMissingPath('data.emailWarning');
        $code = $response->json('data.code');
        Notification::assertSentTo($this->customer, ServiceRequested::class, function (ServiceRequested $notification) use ($code): bool {
            $this->assertSame($code, $notification->code);
            $this->assertFalse($notification->forProvider);
            $this->assertSame('https://frontend.example/painel/servicos?tab=minhascontratacoes', $notification->toMail($this->customer)->actionUrl);
            $this->assertSame('Condomínio A', $notification->condoName);
            $this->assertSame('Reparo da tomada', $notification->title);

            return true;
        });
        Notification::assertSentTo($this->provider, ServiceRequested::class, function (ServiceRequested $notification): bool {
            $this->assertTrue($notification->forProvider);
            $this->assertSame('https://frontend.example/prestador/chamados', $notification->toMail($this->provider)->actionUrl);
            $this->assertSame('2026-12-20', $notification->scheduledDate);

            return true;
        });
        Notification::assertCount(2);
        $this->assertDatabaseHas('service_requests', ['id' => $response->json('data.requestId'), 'vendor_id' => $this->vendor]);
    }

    public function test_request_without_a_provider_only_confirms_to_customer(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/servicos', $this->payload(null))->assertCreated();
        Notification::assertSentTo($this->customer, ServiceRequested::class);
        Notification::assertNotSentTo($this->provider, ServiceRequested::class);
        Notification::assertCount(1);
    }

    public function test_invalid_request_does_not_send_emails_or_create_service(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/servicos', [...$this->payload($this->vendor), 'title' => ''])->assertUnprocessable();
        Notification::assertNothingSent();
        $this->assertDatabaseCount('service_requests', 0);
    }

    public function test_entire_attendance_flow_emails_both_parties_only_on_successful_changes(): void
    {
        Notification::fake();
        $created = $this->postJson('/api/v1/servicos', $this->payload($this->vendor))->assertCreated();
        $id = $created->json('data.requestId');
        Notification::fake();
        $this->app['auth']->forgetGuards();
        $this->withToken($this->provider->createToken('provider-test')->plainTextToken);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/aceite')->assertOk();
        foreach (['a_caminho', 'chegou', 'em_atendimento'] as $status) {
            $this->patchJson('/api/v1/prestador/chamados/'.$id.'/status', ['status' => $status])->assertOk();
            foreach ([$this->customer, $this->provider] as $recipient) {
                Notification::assertSentTo($recipient, ServiceStatusChanged::class, fn ($notification) => $notification->status === $status);
            }
        }
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/conclusao', [])->assertOk();
        Notification::assertSentTo($this->customer, ServiceStatusChanged::class, function ($notification): bool {
            if ($notification->status !== 'prestador_concluiu') {
                return false;
            }
            $this->assertStringContainsString('aguardando confirmação', $notification->toMail($this->customer)->subject);

            return true;
        });
        Notification::assertCount(10);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/conclusao', [])->assertConflict();
        Notification::assertCount(10);
        $this->app['auth']->forgetGuards();
        $this->withToken($this->customer->createToken('customer-test')->plainTextToken);
        $this->postJson('/api/v1/servicos/'.$id.'/validacao', ['approved' => true])->assertOk();
        Notification::assertSentTo($this->provider, ServiceStatusChanged::class, fn ($notification) => $notification->status === 'concluido');
        Notification::assertCount(12);
        $this->postJson('/api/v1/servicos/'.$id.'/validacao', ['approved' => true])->assertOk();
        Notification::assertCount(12);
    }

    public function test_internal_payment_operations_notify_only_when_status_changes(): void
    {
        Notification::fake();
        $created = $this->postJson('/api/v1/servicos', $this->payload($this->vendor))->assertCreated();
        $id = $created->json('data.requestId');
        Notification::fake();
        $payload = ['parameters' => [['status' => 'orcamento_aprovado'], $id]];
        $this->postJson('/api/v1/operations/lib.services.payments.payment-service.009', $payload)->assertOk();
        Notification::assertSentTo($this->customer, ServiceStatusChanged::class, fn ($notification) => $notification->status === 'orcamento_aprovado');
        Notification::assertSentTo($this->provider, ServiceStatusChanged::class, fn ($notification) => $notification->status === 'orcamento_aprovado');
        Notification::assertCount(2);
        $this->postJson('/api/v1/operations/lib.services.payments.payment-service.009', $payload)->assertOk();
        Notification::assertCount(2);
    }

    public function test_provider_cancellation_notifies_both_and_does_not_notify_for_foreign_service(): void
    {
        Notification::fake();
        $created = $this->postJson('/api/v1/servicos', $this->payload($this->vendor))->assertCreated();
        $id = $created->json('data.requestId');
        Notification::fake();
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/recusa', [])->assertForbidden();
        Notification::assertNothingSent();
        $this->app['auth']->forgetGuards();
        $this->withToken($this->provider->createToken('provider-test')->plainTextToken);
        $this->postJson('/api/v1/prestador/chamados/'.$id.'/recusa', ['reason' => 'Indisponível'])->assertOk();
        Notification::assertSentTo($this->customer, ServiceStatusChanged::class, fn ($notification) => $notification->status === 'cancelado');
        Notification::assertSentTo($this->provider, ServiceStatusChanged::class, fn ($notification) => $notification->status === 'cancelado');
        Notification::assertCount(2);
    }

    public function test_smtp_failure_keeps_service_and_still_attempts_other_recipient(): void
    {
        $attempts = [];
        Notification::shouldReceive('send')->twice()->andReturnUsing(function (User $recipient, ServiceRequested $notification) use (&$attempts): void {
            $attempts[] = $recipient->id;
            if ($recipient->id === $this->customer->id) {
                throw new \RuntimeException('SMTP unavailable');
            }
        });
        $response = $this->postJson('/api/v1/servicos', $this->payload($this->vendor))->assertCreated();
        $this->assertNotEmpty($response->json('data.emailWarning'));
        $this->assertSame([$this->customer->id, $this->provider->id], $attempts);
        $this->assertDatabaseCount('service_requests', 1);
        $this->assertDatabaseHas('service_requests', ['id' => $response->json('data.requestId'), 'vendor_id' => $this->vendor]);
    }
}
