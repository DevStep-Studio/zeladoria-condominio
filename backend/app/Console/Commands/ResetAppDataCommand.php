<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetAppDataCommand extends Command
{
    protected $signature = 'app:wipe-data {--force : Forçar execução sem confirmação}';

    protected $description = 'Limpa todas as ocorrências, chamados, reservas, visitas, encomendas e registros operacionais do sistema';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('Deseja realmente apagar todas as ocorrências e dados operacionais salvos?')) {
            $this->info('Operação cancelada.');
            return 0;
        }

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

        $cleared = 0;
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
                $cleared++;
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info("Sucesso! {$cleared} tabelas operacionais foram truncadas e limpas.");
        return 0;
    }
}
