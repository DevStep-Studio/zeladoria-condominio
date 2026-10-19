<?php

namespace App\Services;

use Illuminate\Support\Str;

final class ServiceCategory
{
    private const ALIASES = [
        'eletricista' => 'eletrica',
        'encanador' => 'hidraulica',
        'pintor' => 'pintura',
        'marceneiro' => 'marcenaria',
        'chaveiro' => 'seguranca',
        'ar-condicionado' => 'climatizacao',
        'ar condicionado' => 'climatizacao',
        'ar_condicionado' => 'climatizacao',
        'reparos_gerais' => 'servicos',
        'seguranca_eletronica' => 'seguranca',
        'portoes_eletronicos' => 'portoes',
    ];

    public static function normalize(string $category): string
    {
        $key = Str::lower(trim(Str::ascii($category)));

        return self::ALIASES[$key] ?? $key;
    }

    public static function variants(string $category): array
    {
        $canonical = self::normalize($category);

        return array_values(array_unique([$canonical, $category, ...array_keys(self::ALIASES, $canonical, true)]));
    }
}
