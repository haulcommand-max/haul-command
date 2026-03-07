# ═══════════════════════════════════════════════════════════════
# Haul Command — ProGuard / R8 Rules
# ═══════════════════════════════════════════════════════════════

# ──── Capacitor Core ──────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.PluginMethod class * { *; }

# Capacitor plugins use reflection to register
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public <methods>;
}

# Bridge <-> WebView JS interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# ──── Capacitor Plugins (used in this project) ───────────────
-keep class com.capacitorjs.plugins.** { *; }
-dontwarn com.capacitorjs.plugins.**

# Background Runner
-keep class com.capacitorjs.plugins.backgroundrunner.** { *; }

# SQLite
-keep class com.getcapacitor.community.database.sqlite.** { *; }
-dontwarn com.getcapacitor.community.database.sqlite.**

# ──── Firebase / Google Services ─────────────────────────────
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Firebase Messaging (FCM)
-keepclassmembers class * extends com.google.firebase.messaging.FirebaseMessagingService {
    public void onMessageReceived(com.google.firebase.messaging.RemoteMessage);
    public void onNewToken(java.lang.String);
}

# ──── Cordova Compatibility Layer ────────────────────────────
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# ──── AndroidX / Jetpack ─────────────────────────────────────
-keep class androidx.core.app.** { *; }
-keep class androidx.core.content.FileProvider { *; }

# ──── WebView ─────────────────────────────────────────────────
-keepclassmembers class * extends android.webkit.WebView {
    public *;
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public *;
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public *;
}

# ──── General ─────────────────────────────────────────────────
# Keep source file names and line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep Parcelables
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep enums (used by Capacitor plugin configs)
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
