<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Limpa todo o app: apaga todas as ocorrências, chamados, reservas, visitas,
     * encomendas, transações financeiras, comunicados e registros operacionais salvos,
     * preservando apenas a estrutura física (condomínios, blocos, unidades) e usuários de acesso.
     */
    public function up(): void
    {
        $tables = [
            'occurrence_comments',
            'occurrences',
            'ticket_comments',
            'tickets',
            'visits',
            'visitors',
            'parcels',
            'shifts',
            'reservations',
            'agenda_events',
            'announcements',
            'poll_votes',
            'poll_options',
            'polls',
            'documents',
            'contract_addendums',
            'contracts',
            'maintenance_orders',
            'assembly_votes',
            'assembly_attendance',
            'assembly_agenda',
            'assembly_minute_versions',
            'assembly_minutes',
            'assembly_minute_downloads',
            'assembly_notification_logs',
            'assemblies',
            'transactions',
            'budgets',
            'charges',
            'lost_items',
            'move_requests',
            'support_tickets',
            'notifications',
            'audit_logs',
            'service_messages',
            'service_reviews',
            'service_inspections',
            'service_evidences',
            'service_disputes',
            'service_warranty_tickets',
            'payouts',
            'payment_orders',
            'service_contracts',
            'service_quotes',
            'service_requests',
            'payment_webhook_events',
            'customer_favorites',
            'import_jobs',
            'system_incidents',
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    public function down(): void
    {
        // Operação irreversível de limpeza solicitada pelo usuário
    }
};
