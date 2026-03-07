import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.haulcommand.app',
    appName: 'Haul Command',
    // webDir must exist for cap sync — holds a minimal fallback shell.
    // The actual app loads from the live server (Next.js uses output: "standalone",
    // which requires a server and can't produce a static export).
    webDir: 'dist-capacitor',
    server: {
        androidScheme: 'http', // Must be http for local IP testing
        hostname: '192.168.1.129',
        // Hardcoded to your laptop's Wi-Fi IP so the phone can reach the dev server
        url: 'http://192.168.1.129:3000',
        cleartext: true,
        errorPath: '/offline',
        allowNavigation: [
            '*.haulcommand.com',
            '*.supabase.co',
            '192.168.1.129',
        ],
    },
    plugins: {
        PushNotifications: {
            // FCM configured via google-services.json (Android) and GoogleService-Info.plist (iOS)
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        LocalNotifications: {
            smallIcon: 'ic_stat_hc_logo',
            iconColor: '#F59E0B', // amber-500
        },
        SplashScreen: {
            launchShowDuration: 1500,
            backgroundColor: '#030712', // gray-950
            androidSplashResourceName: 'splash',
            showSpinner: false,
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#030712',
        },
        Geolocation: {
            // Fine location for escort heartbeat + nearby loads
        },
        Camera: {
            // Evidence Vault: high poles, bridge strikes, insurance cards
        },
        BackgroundRunner: {
            label: 'com.haulcommand.background',
            src: 'background.js',
            event: 'heartbeat',
            repeat: true,
            interval: 60, // seconds (overridden per entitlement tier)
            autoStart: false,
        },
        CapacitorSQLite: {
            iosDatabaseLocation: 'Library/CapacitorDatabase',
            iosIsEncryption: false,
            androidIsEncryption: false,
            electronIsEncryption: false,
        },
    },
    android: {
        // Overlay WebView scrollbar with content (cleaner UI)
        overScrollMode: 'never',
        backgroundColor: '#030712',
        allowMixedContent: false,
        appendUserAgent: 'HaulCommand/1.0',
    },
    ios: {
        contentInset: 'automatic',
        allowsLinkPreview: true,
        backgroundColor: '#030712',
        appendUserAgent: 'HaulCommand/1.0',
    },
    loggingBehavior: process.env.NODE_ENV === 'development' ? 'debug' : 'production',
    // Deep links: haulcommand://offers/{offerId}
    // iOS: defined in Info.plist URL types (haulcommand)
    // Android: defined in AndroidManifest.xml intent filters
};

export default config;
