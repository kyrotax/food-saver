<?php

namespace App\Jobs;

use App\Models\NotificationLog;
use App\Models\User;
use App\Services\FCMService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendPushNotification implements ShouldQueue
{
    use Queueable, InteractsWithQueue;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private int   $userId,
        private array $message,
        private int   $logId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(FCMService $fcm): void
    {
        $logEntry = NotificationLog::find($this->logId);

        if (!$logEntry) {
            Log::error("SendPushNotification Job: Notification log ID {$this->logId} not found.");
            return;
        }

        try {
            $user = User::with('fcmTokens')->find($this->userId);

            if (!$user) {
                $logEntry->update(['status' => 'failed']);
                Log::warning("SendPushNotification Job: User ID {$this->userId} not found.");
                return;
            }

            $tokens = $user->fcmTokens()->whereNotNull('fcm_token')->get();

            if ($tokens->isEmpty()) {
                $logEntry->update(['status' => 'failed']);
                Log::warning("SendPushNotification Job: No FCM tokens registered for user ID {$this->userId}.");
                return;
            }

            $anySuccess = false;
            foreach ($tokens as $tokenModel) {
                $success = $fcm->sendToDevice($tokenModel->fcm_token, $this->message);
                if ($success) {
                    $anySuccess = true;
                    // Update last used timestamp
                    $tokenModel->update(['last_used_at' => now()]);
                }
            }

            if ($anySuccess) {
                $logEntry->update([
                    'status'  => 'sent',
                    'sent_at' => now(),
                ]);
            } else {
                $logEntry->update(['status' => 'failed']);
            }

        } catch (\Exception $e) {
            $logEntry->update(['status' => 'failed']);
            Log::error("SendPushNotification Job failed for user {$this->userId}: " . $e->getMessage());
            $this->fail($e);
        }
    }
}
