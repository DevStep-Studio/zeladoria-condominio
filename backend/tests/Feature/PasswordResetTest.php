<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PasswordService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

final class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.frontend.token' => str_repeat('p', 64), 'services.frontend.url' => 'https://frontend.example']);
        $this->withHeader('X-Service-Token', str_repeat('p', 64));
    }

    private function user(): User
    {
        $id = DB::table('users')->insertGetId(['name' => 'Morador', 'email' => 'morador@example.com', 'password_hash' => app(PasswordService::class)->hash('senha-antiga')]);

        return User::findOrFail($id);
    }

    public function test_recovery_sends_a_real_notification_and_reset_is_single_use(): void
    {
        Notification::fake();
        $user = $this->user();
        $user->createToken('old-session');
        $this->postJson('/api/v1/auth/forgot-password', ['email' => ' MORADOR@example.com '])->assertOk();
        $token = '';
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user, &$token): bool {
            $token = $notification->token;
            $mail = $notification->toMail($user);
            $this->assertStringStartsWith('https://frontend.example/redefinir-senha?', $mail->actionUrl);
            $this->assertStringContainsString(rawurlencode($user->email), $mail->actionUrl);

            return true;
        });
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
        $payload = ['email' => $user->email, 'token' => $token, 'password' => 'nova-senha123', 'password_confirmation' => 'nova-senha123'];
        $this->postJson('/api/v1/auth/reset-password', [...$payload, 'token' => 'incorrect'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertOk();
        $this->assertTrue(app(PasswordService::class)->verify('nova-senha123', $user->fresh()->password_hash));
        $this->assertFalse(app(PasswordService::class)->verify('senha-antiga', $user->fresh()->password_hash));
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertUnprocessable();
    }

    public function test_unknown_address_receives_no_notification_or_token(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.com'])->assertOk();
        Notification::assertNothingSent();
        $this->assertDatabaseCount('password_reset_tokens', 0);
    }

    public function test_transport_failure_is_visible_and_does_not_block_retry(): void
    {
        $user = $this->user();
        Notification::shouldReceive('send')->once()->andThrow(new \RuntimeException('SMTP unavailable'));
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertStatus(503);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_expired_token_cannot_change_password(): void
    {
        Notification::fake();
        $user = $this->user();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();
        $notification = Notification::sent($user, ResetPassword::class)->first();
        $this->travel(61)->minutes();
        $this->postJson('/api/v1/auth/reset-password', ['email' => $user->email, 'token' => $notification->token, 'password' => 'nova-senha123', 'password_confirmation' => 'nova-senha123'])->assertUnprocessable();
        $this->assertTrue(app(PasswordService::class)->verify('senha-antiga', $user->fresh()->password_hash));
    }
}
