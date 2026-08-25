package com.neighborly.trust.worker;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    public static final String BOOKING_CHANNEL_ID  = "booking_alert";
    public static final String CALL_CHANNEL_ID     = "call_alert";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register the custom Capacitor plugin so JS can control the foreground service
        registerPlugin(WorkerOnlinePlugin.class);
        // Create notification channels on a background thread to avoid blocking the WebView
        new Thread(this::createNotificationChannels).start();
    }

    // ─────────────────────────────────────────────────────────────
    //  Notification Channels — created once on app startup.
    //  Android 8+ requires channels; sound/vibration set here is
    //  the ONLY place it can be configured (immutable after creation).
    //  Runs on a background thread — never on the main thread.
    // ─────────────────────────────────────────────────────────────
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // ── Booking Alert Channel ─────────────────────────────
            if (nm.getNotificationChannel(BOOKING_CHANNEL_ID) == null) {
                try {
                    NotificationChannel bookingCh = new NotificationChannel(
                        BOOKING_CHANNEL_ID,
                        "New Booking Alert",
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    bookingCh.setDescription("Plays when a customer sends a new booking request");
                    bookingCh.enableVibration(true);
                    bookingCh.setVibrationPattern(new long[]{0, 600, 200, 600, 200, 600});
                    bookingCh.enableLights(true);
                    bookingCh.setLightColor(0xFF00C853);

                    // Safely build the sound URI — fallback to no custom sound on failure
                    try {
                        Uri bookingSound = Uri.parse(
                            "android.resource://" + getPackageName() + "/raw/booking_ringtone"
                        );
                        AudioAttributes bookingAttr = new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build();
                        bookingCh.setSound(bookingSound, bookingAttr);
                    } catch (Exception soundEx) {
                        Log.w(TAG, "Failed to set booking channel sound, using default: " + soundEx.getMessage());
                    }

                    bookingCh.setBypassDnd(false);
                    bookingCh.setShowBadge(true);
                    nm.createNotificationChannel(bookingCh);
                    Log.d(TAG, "Booking notification channel created");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to create booking notification channel: " + e.getMessage());
                }
            }

            // ── Call Alert Channel ────────────────────────────────
            if (nm.getNotificationChannel(CALL_CHANNEL_ID) == null) {
                try {
                    NotificationChannel callCh = new NotificationChannel(
                        CALL_CHANNEL_ID,
                        "Incoming Call",
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    callCh.setDescription("Plays when a customer is calling the worker");
                    callCh.enableVibration(true);
                    callCh.setVibrationPattern(new long[]{0, 800, 400, 800, 400, 800, 400, 800});
                    callCh.enableLights(true);
                    callCh.setLightColor(0xFF2196F3);

                    // Safely build the sound URI — fallback to no custom sound on failure
                    try {
                        Uri callSound = Uri.parse(
                            "android.resource://" + getPackageName() + "/raw/call_ringtone"
                        );
                        AudioAttributes callAttr = new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build();
                        callCh.setSound(callSound, callAttr);
                    } catch (Exception soundEx) {
                        Log.w(TAG, "Failed to set call channel sound, using default: " + soundEx.getMessage());
                    }

                    callCh.setBypassDnd(false);
                    callCh.setShowBadge(true);
                    nm.createNotificationChannel(callCh);
                    Log.d(TAG, "Call notification channel created");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to create call notification channel: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            // Never let notification setup crash the app
            Log.e(TAG, "createNotificationChannels failed entirely: " + e.getMessage());
        }
    }
}
