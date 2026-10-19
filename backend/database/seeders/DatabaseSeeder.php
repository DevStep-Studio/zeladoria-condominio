<?php

namespace Database\Seeders;

use App\Services\PasswordService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('Dados de demonstração não podem ser criados em produção.');
        }
        if (DB::table('condominiums')->exists() || DB::table('users')->exists()) {
            $this->command?->info('Banco já contém dados; nenhuma demonstração foi inserida.');

            return;
        }
        $fixture = json_decode(file_get_contents(__DIR__.'/demo-data.json'), true, flags: JSON_THROW_ON_ERROR);
        $entities = json_decode(file_get_contents(resource_path('api/entities.json')), true, flags: JSON_THROW_ON_ERROR);
        $days = (int) CarbonImmutable::parse($fixture['baseDate'], 'UTC')->diffInDays(CarbonImmutable::now('UTC')->startOfDay());
        DB::transaction(function () use ($fixture, $entities, $days) {
            foreach ($fixture['entities'] as $name => $rows) {
                $entity = $entities[$name];
                foreach ($rows as $row) {
                    $data = [];
                    foreach ($row as $key => $value) {
                        $column = $entity['columns'][$key];
                        if ($value !== null) {
                            if ($column['type'] === 'json') {
                                $value = json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
                            } elseif ($column['type'] === 'boolean') {
                                $value = (int) $value;
                            } elseif ($column['type'] === 'date') {
                                $value = CarbonImmutable::parse($value)->utc()->addDays($days)->format('Y-m-d H:i:s.u');
                            } elseif (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) {
                                $value = CarbonImmutable::parse($value, 'UTC')->addDays($days)->format('Y-m-d');
                            }
                        }
                        $data[$column['name']] = $value;
                    }
                    DB::table($entity['name'])->insert($data);
                }
            }
            $vendor = DB::table('vendors')->where('slug', 'carlos-eletrica')->first();
            if ($vendor) {
                $id = DB::table('users')->insertGetId(['name' => 'Carlos Eduardo Silva', 'email' => 'carlos@eletrica.com.br', 'password_hash' => app(PasswordService::class)->hash('demo1234'), 'phone' => '(41) 99111-2233']);
                DB::table('vendors')->where('id', $vendor->id)->update(['user_id' => $id]);
            }
        });
    }
}
