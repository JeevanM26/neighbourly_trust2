# ─── HeroHand Worker App — Production ProGuard Rules ─────────────────────────

# Keep stack traces readable in crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Capacitor / WebView Bridge ────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep class com.neighborly.trust.worker.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
    @com.getcapacitor.PluginMethod <methods>;
}

# ── Firebase / FCM ────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── AndroidX / Support libs ───────────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── WebRTC (used by Metered TURN/STUN) ───────────────────────────────────────
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**

# ── OkHttp / Retrofit (used by Supabase client) ──────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ── JavaScript Interface (Capacitor WebView) ──────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Kotlin / Coroutines ───────────────────────────────────────────────────────
-keep class kotlin.** { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ── Serialization (JSON parsing) ──────────────────────────────────────────────
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ── Notification / Foreground Service ────────────────────────────────────────
-keep class com.neighborly.trust.worker.WorkerOnlineService { *; }
-keep class com.neighborly.trust.worker.WorkerOnlinePlugin { *; }
