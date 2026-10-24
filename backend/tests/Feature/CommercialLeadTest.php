<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class CommercialLeadTest extends TestCase
{
    use RefreshDatabase;

    private string $serviceToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->serviceToken = str_repeat('s', 64);
        config(['services.frontend.token' => $this->serviceToken]);
    }

    private function service(): static
    {
        return $this->withHeader('X-Service-Token', $this->serviceToken);
    }

    public function test_commercial_lead_requires_service_token(): void
    {
        $this->postJson('/api/v1/comercial/solicitacao', [
            'nome' => 'Carlos Silva',
            'whatsapp' => '(11) 98765-4321',
            'email' => 'carlos@exemplo.com.br',
            'assunto' => 'Conhecer os serviços',
        ])->assertUnauthorized();
    }

    public function test_commercial_lead_validates_required_fields(): void
    {
        $this->service()->postJson('/api/v1/comercial/solicitacao', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nome', 'email', 'assunto']);
    }

    public function test_commercial_lead_persists_in_support_tickets_and_audit_logs(): void
    {
        $response = $this->service()->postJson('/api/v1/comercial/solicitacao', [
            'nome' => 'Mariana Oliveira',
            'condominio' => 'Residencial Bela Vista',
            'whatsapp' => '(41) 99123-4567',
            'email' => 'mariana@condominiobelavista.com.br',
            'assunto' => 'Solicitar uma proposta',
            'mensagem' => 'Gostaríamos de conhecer a solução para portaria e controle de acessos.',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.success', true);
        $ticketId = $response->json('data.ticketId');
        $this->assertNotNull($ticketId);

        $this->assertDatabaseHas('support_tickets', [
            'id' => $ticketId,
            'category' => 'comercial',
            'priority' => 'alta',
            'status' => 'aberto',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'solicitacao_comercial',
            'entity' => 'lead_comercial',
            'entity_id' => (string) $ticketId,
        ]);
    }
}
