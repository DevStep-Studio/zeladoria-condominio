<?php

namespace App\Services;

use DateTimeImmutable;
use DateTimeZone;

final class EntitySerializer
{
    public function serialize(string $entity, object|array $row): array
    {
        $entities = json_decode(file_get_contents(resource_path('api/entities.json')), true, flags: JSON_THROW_ON_ERROR);
        $row = (array) $row;
        $result = [];
        foreach ($entities[$entity]['columns'] as $key => $column) {
            $v = $row[$column['name']] ?? null;
            $result[$key] = $v === null ? null : match ($column['type']) {
                'boolean' => (bool) $v,
                'number' => str_contains($column['sqlType'], 'double') ? (float) $v : (int) $v,
                'json' => is_string($v) ? json_decode($v, true, flags: JSON_THROW_ON_ERROR) : $v,
                'date' => ['$date' => (new DateTimeImmutable($v, new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.u\Z')],
                default => $v,
            };
        }
        if ($entity === 'users') {
            $result['passwordHash'] = '';
        }

        return $result;
    }
}
