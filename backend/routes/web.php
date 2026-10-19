<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'zeladoria-api', 'version' => 'v1']));
