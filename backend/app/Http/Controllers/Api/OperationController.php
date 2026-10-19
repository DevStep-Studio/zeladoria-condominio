<?php

namespace App\Http\Controllers\Api;

use App\Services\OperationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class OperationController
{
    public function __invoke(Request $request, string $operation, OperationService $service): JsonResponse
    {
        $validated = $request->validate(['parameters' => ['present', 'array', 'max:1000']]);

        return response()->json(['data' => $service->execute($operation, $validated['parameters'])]);
    }
}
