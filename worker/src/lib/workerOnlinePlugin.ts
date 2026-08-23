/**
 * workerOnlinePlugin.ts
 *
 * TypeScript wrapper around the native Android WorkerOnlinePlugin.
 * Provides type-safe access to the foreground service controls.
 *
 * On non-Android platforms (web, iOS) these calls are no-ops.
 */
import { registerPlugin } from '@capacitor/core';

export interface WorkerOnlinePluginInterface {
  /** Start the foreground service — call when worker goes Online */
  startOnlineService(): Promise<void>;
  /** Stop the foreground service — call when worker goes Offline or logs out */
  stopOnlineService(): Promise<void>;
}

const WorkerOnlinePlugin = registerPlugin<WorkerOnlinePluginInterface>(
  'WorkerOnlinePlugin',
  {
    // Web stub — no-op so the app doesn't crash in browser dev mode
    web: {
      startOnlineService: async () => { console.log('[WorkerOnlinePlugin] web stub: startOnlineService'); },
      stopOnlineService:  async () => { console.log('[WorkerOnlinePlugin] web stub: stopOnlineService'); },
    },
  }
);

export { WorkerOnlinePlugin };
