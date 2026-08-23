package com.neighborly.trust.worker;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public static final String BOOKING_CHANNEL_ID  = "booking_alert";
    public static final String CALL_CHANNEL_ID     = "call_alert";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register the custom Capacitor plugin so JS can control the foreground service
        registerPlugin(WorkerOnlinePlugin.class);
        createNotificationChannels();
    }

    // ─────────────────────────────────────────────────────────────
    //  Notification Channels — created once on app startup.
    //  Android 8+ requires channels; sound/vibration set here is
    //  the ONLY place it can be configured (immutable after creation).
    // ─────────────────────────────────────────────────────────────
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // ── Booking Alert Channel ─────────────────────────────
        // Urgent ascending arpeggio + strong vibration pattern
        if (nm.getNotificationChannel(BOOKING_CHANNEL_ID) == null) {
            NotificationChannel bookingCh = new NotificationChannel(
                BOOKING_CHANNEL_ID,
                "New Booking Alert",
                NotificationManager.IMPORTANCE_HIGH
            );
            bookingCh.setDescription("Plays when a customer sends a new booking request");
            bookingCh.enableVibration(true);
            // Pattern: wait 0ms, vibrate 600ms, pause 200ms, vibrate 600ms, pause 200ms, vibrate 600ms
            bookingCh.setVibrationPattern(new long[]{0, 600, 200, 600, 200, 600});
            bookingCh.enableLights(true);
            bookingCh.setLightColor(0xFF00C853); // green flash

            Uri bookingSound = Uri.parse(
                "android.resource://" + getPackageName() + "/raw/booking_ringtone"
            );
            AudioAttributes bookingAttr = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            bookingCh.setSound(bookingSound, bookingAttr);
            bookingCh.setBypassDnd(false);
            bookingCh.setShowBadge(true);
            nm.createNotificationChannel(bookingCh);
        }

        // ── Call Alert Channel ────────────────────────────────
        // Different ringtone + longer vibration for incoming calls
        if (nm.getNotificationChannel(CALL_CHANNEL_ID) == null) {
            NotificationChannel callCh = new NotificationChannel(
                CALL_CHANNEL_ID,
                "Incoming Call",
                NotificationManager.IMPORTANCE_HIGH
            );
            callCh.setDescription("Plays when a customer is calling the worker");
            callCh.enableVibration(true);
            // Pattern: wait 0ms, then alternating 800ms on / 400ms off × 4 = continuous ring feel
            callCh.setVibrationPattern(new long[]{0, 800, 400, 800, 400, 800, 400, 800});
            callCh.enableLights(true);
            callCh.setLightColor(0xFF2196F3); // blue flash

            Uri callSound = Uri.parse(
                "android.resource://" + getPackageName() + "/raw/call_ringtone"
            );
            AudioAttributes callAttr = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            callCh.setSound(callSound, callAttr);
            callCh.setBypassDnd(false);
            callCh.setShowBadge(true);
            nm.createNotificationChannel(callCh);
        }
    }
}
