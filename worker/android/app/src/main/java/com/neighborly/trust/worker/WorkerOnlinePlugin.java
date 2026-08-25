package com.neighborly.trust.worker;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * WorkerOnlinePlugin — Capacitor Bridge
 *
 * Exposes methods:
 *   - startOnlineService()  → starts WorkerOnlineService as a foreground service
 *   - stopOnlineService()   → stops the foreground service
 *   - triggerBookingAlert() → triggers native high-priority heads-up notification with sound & vibration
 */
@CapacitorPlugin(name = "WorkerOnlinePlugin")
public class WorkerOnlinePlugin extends Plugin {

    @PluginMethod
    public void startOnlineService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), WorkerOnlineService.class);
            intent.setAction(WorkerOnlineService.ACTION_START);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start online service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopOnlineService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), WorkerOnlineService.class);
            intent.setAction(WorkerOnlineService.ACTION_STOP);
            getContext().startService(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop online service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void triggerBookingAlert(PluginCall call) {
        try {
            String title = call.getString("title", "🔔 New Booking Offer!");
            String message = call.getString("message", "A customer is requesting your service nearby. Tap to view details.");
            String bookingId = call.getString("bookingId", "");

            Context ctx = getContext();
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) {
                call.reject("NotificationManager unavailable");
                return;
            }

            Intent tapIntent = new Intent(ctx, MainActivity.class);
            tapIntent.setAction("OPEN_BOOKING_SCREEN");
            tapIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            if (!bookingId.isEmpty()) {
                tapIntent.putExtra("booking_id", bookingId);
            }

            PendingIntent pendingIntent = PendingIntent.getActivity(
                ctx,
                (int) (System.currentTimeMillis() % 100000),
                tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Uri soundUri = Uri.parse("android.resource://" + ctx.getPackageName() + "/raw/booking_ringtone");

            NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, MainActivity.BOOKING_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setSound(soundUri)
                .setVibrate(new long[]{0, 600, 200, 600, 200, 600})
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            int notifId = (int) (System.currentTimeMillis() % 100000);
            nm.notify(notifId, builder.build());

            // Trigger strong native device vibration pattern as extra guarantee
            try {
                Vibrator vibrator = (Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
                if (vibrator != null && vibrator.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 600, 200, 600, 200, 600}, -1));
                    } else {
                        vibrator.vibrate(new long[]{0, 600, 200, 600, 200, 600}, -1);
                    }
                }
            } catch (Exception ex) {
                // Ignore vibration failure
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to trigger booking alert: " + e.getMessage());
        }
    }
}
