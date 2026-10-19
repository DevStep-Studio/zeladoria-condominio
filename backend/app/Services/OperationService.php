<?php

namespace App\Services;

use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/** Executes only operations registered on the server; callers cannot submit SQL or identifiers. */
final class OperationService
{
    private array $entities;

    private array $operations;

    public function __construct()
    {
        $this->entities = json_decode(file_get_contents(resource_path('api/entities.json')), true, flags: JSON_THROW_ON_ERROR);
        $this->operations = json_decode(file_get_contents(resource_path('api/operations.json')), true, flags: JSON_THROW_ON_ERROR);
    }

    public function execute(string $name, array $parameters): mixed
    {
        $op = $this->operations[$name] ?? abort(404, 'Operação não encontrada.');
        if (count($parameters) !== $op['parameters']) {
            throw ValidationException::withMessages(['parameters' => 'Parâmetros inválidos para esta operação.']);
        }
        $parameters = $this->decodeDates($parameters);
        if ($op['kind'] === 'health') {
            DB::select('SELECT 1');

            return ['rowCount' => 1];
        }
        if ($op['kind'] === 'select') {
            return $this->select($op, $parameters);
        }

        return DB::transaction(function () use ($op, $parameters) {
            $entity = $this->entities[$op['source']['table']];
            $table = $this->identifier($entity['name']);
            $bindings = [];
            $where = isset($op['where']) ? $this->expression($op['where'], $parameters, $bindings) : null;
            $suffix = $where ? ' WHERE '.$where : '';
            if ($op['kind'] === 'delete') {
                if (! $where) {
                    throw new RuntimeException('Delete requires a predicate.');
                }

                return ['rowCount' => DB::delete('DELETE FROM '.$table.$suffix, $bindings)];
            }
            $data = $parameters[$op['data']['p']] ?? [];
            if ($op['kind'] === 'update') {
                if (! $where) {
                    throw new RuntimeException('Update requires a predicate.');
                }
                $data = $this->normalizeData($entity, $data);
                if (! $data) {
                    return ['rowCount' => 0];
                }
                // Lock and remember IDs, since a mutation may change its own predicate.
                $ids = isset($op['returning']) ? array_column(DB::select('SELECT id FROM '.$table.$suffix.' FOR UPDATE', $bindings), 'id') : [];
                $assignments = implode(', ', array_map(fn ($c) => $this->identifier($c).' = ?', array_keys($data)));
                $count = DB::update('UPDATE '.$table.' SET '.$assignments.$suffix, [...array_values($data), ...$bindings]);

                return isset($op['returning']) ? $this->byIds($op, $parameters, $ids) : ['rowCount' => $count];
            }
            $rows = array_is_list($data) ? $data : [$data];
            if (! $rows) {
                return isset($op['returning']) ? [] : ['rowCount' => 0];
            }
            $ids = [];
            $count = 0;
            foreach ($rows as $row) {
                $row = $this->normalizeData($entity, $row);
                $columns = implode(', ', array_map($this->identifier(...), array_keys($row)));
                $values = implode(', ', array_fill(0, count($row), '?'));
                $sql = 'INSERT '.(isset($op['ignore']) ? 'IGNORE ' : '').'INTO '.$table.' ('.$columns.') VALUES ('.$values.')';
                $affected = DB::affectingStatement($sql, array_values($row));
                $count += $affected;
                if ($affected) {
                    $ids[] = $row['id'] ?? (int) DB::getPdo()->lastInsertId();
                }
            }

            return isset($op['returning']) ? $this->byIds($op, $parameters, $ids) : ['rowCount' => $count];
        });
    }

    private function byIds(array $op, array $parameters, array $ids): array
    {
        if (! $ids) {
            return [];
        }

        return $this->select(['kind' => 'select', 'source' => $op['source'], 'where' => ['op' => 'inArray', 'a' => [['c' => [$op['source']['table'], 'id', null]], ['v' => $ids]]]], $parameters);
    }

    private function normalizeData(array $entity, mixed $data): array
    {
        if (! is_array($data)) {
            throw ValidationException::withMessages(['parameters' => 'Dados inválidos.']);
        }
        $result = [];
        foreach ($data as $key => $value) {
            $column = $entity['columns'][$key] ?? throw ValidationException::withMessages(['parameters' => 'Campo não permitido: '.$key]);
            if ($value !== null) {
                $value = match ($column['type']) {
                    'json' => json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                    'boolean' => (int) (bool) $value,
                    'date' => (new DateTimeImmutable($value))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.u'),
                    default => $value,
                };
            }
            $result[$column['name']] = $value;
        }

        return $result;
    }

    private function select(array $op, array $parameters): array
    {
        $entity = $this->entities[$op['source']['table']];
        $fields = $op['fields'] ?? array_map(fn ($key) => ['c' => [$op['source']['table'], $key, $op['source']['alias'] ?? null]], array_combine(array_keys($entity['columns']), array_keys($entity['columns'])));
        $bindings = [];
        $columns = [];
        foreach ($fields as $key => $expr) {
            $columns[] = $this->expression($expr, $parameters, $bindings).' AS '.$this->identifier($key);
        }
        $sql = 'SELECT '.implode(', ', $columns).' FROM '.$this->table($op['source']);
        foreach ($op['joins'] ?? [] as $join) {
            $sql .= ($join['kind'] === 'left' ? ' LEFT JOIN ' : ' INNER JOIN ').$this->table($join).' ON '.$this->expression($join['on'], $parameters, $bindings);
        }
        if (isset($op['where'])) {
            $where = $this->expression($op['where'], $parameters, $bindings);
            if ($where !== null) {
                $sql .= ' WHERE '.$where;
            }
        }
        if (isset($op['group'])) {
            $sql .= ' GROUP BY '.implode(', ', array_map(fn ($e) => $this->expression($e, $parameters, $bindings), $op['group']));
        }
        if (isset($op['order'])) {
            $sql .= ' ORDER BY '.implode(', ', array_map(fn ($e) => $this->expression($e, $parameters, $bindings), $op['order']));
        }
        if (isset($op['limit'])) {
            $limit = $this->value($op['limit'], $parameters);
            if (! is_numeric($limit) || $limit < 0 || $limit > 100000) {
                throw ValidationException::withMessages(['parameters' => 'Limite inválido.']);
            }
            $sql .= ' LIMIT '.(int) $limit;
        }

        return array_map(function ($row) use ($fields) {
            $row = (array) $row;
            foreach ($fields as $key => $expr) {
                $row[$key] = $this->cast($row[$key], $expr);
            }

            return $row;
        }, DB::select($sql, $bindings));
    }

    private function cast(mixed $value, array $expr): mixed
    {
        if ($value === null) {
            return null;
        }
        if (isset($expr['c'])) {
            [$table, $key] = $expr['c'];
            $column = $this->entities[$table]['columns'][$key];
            if ($table === 'users' && $key === 'passwordHash') {
                return '';
            }

            return match ($column['type']) {
                'json' => is_string($value) ? json_decode($value, true, flags: JSON_THROW_ON_ERROR) : $value,
                'boolean' => (bool) $value,
                'number' => str_contains($column['sqlType'], 'double') || str_contains($column['sqlType'], 'real') ? (float) $value : (int) $value,
                'date' => ['$date' => (new DateTimeImmutable($value, new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.u\Z')],
                default => $value,
            };
        }
        if (($expr['op'] ?? null) === 'count') {
            return (int) $value;
        }
        if (in_array($expr['op'] ?? null, ['sum', 'avg'], true)) {
            return (string) $value;
        }
        if (in_array($expr['op'] ?? null, ['min', 'max'], true) && isset($expr['a'][0])) {
            return $this->cast($value, $expr['a'][0]);
        }
        if (isset($expr['raw']) && str_contains(strtolower(json_encode($expr['raw'])), 'count(')) {
            return (int) $value;
        }

        return $value;
    }

    private function expression(array $expr, array $parameters, array &$bindings): ?string
    {
        if (isset($expr['skip'])) {
            return null;
        }
        if (isset($expr['if'])) {
            return $this->expression($this->jsTruthy($this->value($expr['if'], $parameters)) ? $expr['yes'] : $expr['no'], $parameters, $bindings);
        }
        if (isset($expr['c'])) {
            [$table, $key, $alias] = $expr['c'];

            return $this->identifier($alias ?? $this->entities[$table]['name']).'.'.$this->identifier($this->entities[$table]['columns'][$key]['name']);
        }
        if (array_key_exists('p', $expr) || array_key_exists('v', $expr)) {
            $bindings[] = $this->value($expr, $parameters);

            return '?';
        }
        if (isset($expr['raw'])) {
            $sql = '';
            foreach ($expr['raw'] as $part) {
                $sql .= is_string($part) ? $part : $this->expression($part, $parameters, $bindings);
            }
            $sql = preg_replace('/(`[^`]+`\.`[^`]+`)::date\b/i', 'DATE($1)', $sql);

            return '('.preg_replace('/::(?:int|integer|text)\b/i', '', $sql).')';
        }
        $op = $expr['op'];
        $args = $expr['a'];
        if (in_array($op, ['inArray', 'notInArray'])) {
            $column = $this->expression($args[0], $parameters, $bindings);
            $values = $this->value($args[1], $parameters);
            if (! is_array($values)) {
                throw ValidationException::withMessages(['parameters' => 'Lista inválida.']);
            }
            if (! $values) {
                return $op === 'inArray' ? '(1 = 0)' : '(1 = 1)';
            }
            array_push($bindings, ...$values);

            return $column.($op === 'inArray' ? ' IN (' : ' NOT IN (').implode(', ', array_fill(0, count($values), '?')).')';
        }
        if (in_array($op, ['and', 'or'])) {
            $parts = [];
            foreach ($args as $a) {
                $part = $this->expression($a, $parameters, $bindings);
                if ($part !== null) {
                    $parts[] = $part;
                }
            }

            return $parts ? '('.implode($op === 'and' ? ' AND ' : ' OR ', $parts).')' : null;
        }
        $parts = [];
        foreach ($args as $a) {
            $parts[] = $this->expression($a, $parameters, $bindings);
        }

        return match ($op) {
            'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike' => '('.$parts[0].' '.(['eq' => '=', 'ne' => '<>', 'gt' => '>', 'gte' => '>=', 'lt' => '<', 'lte' => '<=', 'like' => 'LIKE', 'ilike' => 'LIKE'][$op]).' '.$parts[1].')',
            'isNull' => $parts[0].' IS NULL', 'isNotNull' => $parts[0].' IS NOT NULL',
            'asc' => $parts[0].' ASC', 'desc' => $parts[0].' DESC',
            'not' => 'NOT ('.$parts[0].')',
            'count', 'sum', 'avg', 'min', 'max' => strtoupper($op).'('.($parts[0] ?? '*').')',
            'between', 'notBetween' => $parts[0].($op === 'between' ? ' BETWEEN ' : ' NOT BETWEEN ').$parts[1].' AND '.$parts[2],
            default => throw new RuntimeException('Unsupported server expression: '.$op),
        };
    }

    private function jsTruthy(mixed $value): bool
    {
        return $value !== null && $value !== false && $value !== 0 && $value !== 0.0 && $value !== '';
    }

    private function value(array $expr, array $parameters): mixed
    {
        if (isset($expr['if'])) {
            return $this->value($this->jsTruthy($this->value($expr['if'], $parameters)) ? $expr['yes'] : $expr['no'], $parameters);
        }

        return array_key_exists('p', $expr) ? ($parameters[$expr['p']] ?? null) : ($expr['v'] ?? null);
    }

    private function table(array $source): string
    {
        return $this->identifier($this->entities[$source['table']]['name']).(isset($source['alias']) ? ' AS '.$this->identifier($source['alias']) : '');
    }

    private function identifier(string $name): string
    {
        if (! preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/D', $name)) {
            throw new RuntimeException('Invalid server identifier.');
        }

        return '`'.$name.'`';
    }

    private function decodeDates(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }
        if (count($value) === 1 && isset($value['$date'])) {
            return (new DateTimeImmutable($value['$date']))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.u');
        }

        return array_map($this->decodeDates(...), $value);
    }
}
