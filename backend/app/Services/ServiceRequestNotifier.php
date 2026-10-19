<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\ServiceRequested;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Throwable;

final class ServiceRequestNotifier
{
    /** Send each recipient independently, after the caller has persisted the request. */
    public function send(int $requestId): bool
    {
        $service = DB::table('service_requests')->find($requestId);
        $customer = User::findOrFail($service->customer_id);
        $vendor = $service->vendor_id ? DB::table('vendors')->find($service->vendor_id) : null;
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
                $notification = new ServiceRequested(
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
