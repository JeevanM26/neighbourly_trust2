package com.neighborly.trust.worker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * WorkerOnlineService — Foreground Service
 *
 * Keeps the app process alive when the worker is "Online" and has the app
 * in the background (phone in pocket). This ensures:
 *   1. Supabase Realtime subscriptions stay active
 *   2. FCM messages are received and handled immediately
 *   3. Android OS does not kill the app to reclaim memory
 *
 * Started from JS via WorkerOnlinePlugin when worker toggles online.
 * Stopped when worker goes offline or logs out.
 */
public class WorkerOnlineService extends Service {

    private static final String TAG              = "WorkerOnlineService";
    private static final String CHANNEL_ID       = "worker_online_status";
    private static final int    NOTIFICATION_ID  = 1001;

    public static final String ACTION_START = "START_WORKER_ONLINE";
    public static final String ACTION_STOP  = "STOP_WORKER_ONLINE";

    @Override
    public void onCreate() {
        super.onCreate();
        createStatusChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            Log.d(TAG, "Stopping foreground service — worker went offline");
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        Log.d(TAG, "Starting foreground service — worker is now Online");
        startForeground(NOTIFICATION_ID, buildNotification());
        // Re-deliver intent on crash so the service restarts automatically
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    // ─── Build persistent "You are Online" notification ───────────
    private Notification buildNotification() {
        // Tapping the notification brings the worker back to the app
        Intent tapIntent = new Intent(this, MainActivity.class);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tapPending = PendingIntent.getActivity(
            this, 0, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("You are Online 🟢")
            .setContentText("Accepting booking requests nearby")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(tapPending)
            .setPriority(NotificationCompat.PRIORITY_LOW)   // low = no sound/vibration for THIS notification
            .setOngoing(true)       // cannot be swiped away while online
            .setSilent(true)
            .build();
    }

    // ─── Silent channel for the persistent status notification ───
    private void createStatusChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID,
            "Worker Online Status",
            NotificationManager.IMPORTANCE_LOW   // silent, no sound
        );
        ch.setDescription("Shows while you are online and accepting bookings");
        ch.setShowBadge(false);
        nm.createNotificationChannel(ch);
    }
}
