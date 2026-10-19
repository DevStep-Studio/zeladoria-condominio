<?php

return [
    'default' => 'mysql',
    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'zeladoria'),
            'username' => env('DB_USERNAME', 'zeladoria'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => 'InnoDB',
            'timezone' => '+00:00',
            'options' => [
                // Preserve the affected-row contract for idempotent updates.
                (defined('Pdo\\Mysql::ATTR_FOUND_ROWS') ? constant('Pdo\\Mysql::ATTR_FOUND_ROWS') : constant('PDO::MYSQL_ATTR_FOUND_ROWS')) => true,
            ],
        ],
    ],
    'migrations' => ['table' => 'migrations', 'update_date_on_publish' => true],
];
