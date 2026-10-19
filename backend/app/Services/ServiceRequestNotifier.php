<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\ServiceRequested;
use App\Notifications\ServiceStatusChanged;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Throwable;

final class ServiceRequestNotifier
{
    public function transition(int $requestId, Closure $mutate): JsonResponse
    {
        [$response, $changed, $status] = DB::transaction(function () use ($requestId, $mutate) {
            $before = DB::table('service_requests')->where('id', $requestId)->lockForUpdate()->value('status');
            $quoteBefore = DB::table('service_quotes')->where('request_id', $requestId)->max('id');
            $response = $mutate();
            $status = DB::table('service_requests')->where('id', $requestId)->value('status');
            $quoteAfter = DB::table('service_quotes')->where('request_id', $requestId)->max('id');

            return [$response, $before !== $status || $quoteBefore !== $quoteAfter, $status];
        });
        if ($changed && $status !== null) {
            if (! $this->sendStatus($requestId, $status)) {
                $payload = $response->getData(true);
                $payload['data']['emailWarning'] = 'Atualização salva, mas não foi possível enviar todos os e-mails. Acompanhe pelo painel.';
                $response->setData($payload);
            }
        }

        return $response;
    }

    public function sendStatus(int $requestId, string $status): bool
    {
        try {
            return $this->send($requestId, $status);
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }

    /** Send each recipient independently, after the caller has persisted the request. */
    public function send(int $requestId, ?string $status = null): bool
    {
        $service = DB::table('service_requests')->find($requestId);
        $customer = User::findOrFail($service->customer_id);
        $vendorId = $service->vendor_id;
        if (! $vendorId && $status !== null) {
            $vendorId = DB::table('service_quotes')->where('request_id', $requestId)->orderByDesc('id')->value('vendor_id');
        }
        $vendor = $vendorId ? DB::table('vendors')->find($vendorId) : null;
        $provider = $vendor?->user_id ? User::find($vendor->user_id) : null;
        $condoName = DB::table('condominiums')->where('id', $service->condo_id)->value('name');
        $recipients = [['user' => $customer, 'email' => $customer->email, 'forProvider' => false]];
        if ($vendor) {
            $recipients[] = ['user' => $provider, 'email' => $provider?->email ?: $vendor->email, 'forProvider' => true];
        }
        $delivered = true;
        foreach ($recipients as $recipient) {
            try {
                if (! $recipient['email']) {
                    throw new \RuntimeException('Destinatário da solicitação sem e-mail cadastrado.');
                }
                $notification = $status !== null
                    ? new ServiceStatusChanged($service->code, $service->title, $status, $recipient['forProvider'])
                    : new ServiceRequested(
                        $service->code, $service->title, $service->description, $condoName,
                        $customer->name, $vendor?->name, $service->scheduled_date, $service->scheduled_time_slot,
                        $recipient['forProvider'],
                    );
                if ($recipient['user']) {
                    $recipient['user']->notify($notification);
                } else {
                    Notification::route('mail', $recipient['email'])->notify($notification);
                }
            } catch (Throwable $exception) {
                report($exception);
                $delivered = false;
            }
        }

        return $delivered;
    }
}
