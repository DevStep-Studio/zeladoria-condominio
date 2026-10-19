<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ServiceRequested;
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
