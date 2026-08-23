package com.neighborly.trust.worker;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * WorkerOnlinePlugin — Capacitor Bridge
 *
 * Exposes two JS-callable methods:
 *   - startOnlineService()  → starts WorkerOnlineService as a foreground service
 *   - stopOnlineService()   → stops the foreground service
 *
 * Usage in TypeScript:
 *   import { Plugins } from '@capacitor/core';
 *   const { WorkerOnlinePlugin } = Plugins;
 *   await WorkerOnlinePlugin.startOnlineService();
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
}
