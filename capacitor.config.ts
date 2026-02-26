import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.haulcommand.app',
    appName: 'Haul Command',
    webDir: 'out',
    server: {
        androidScheme: 'https',
        allowNavigation: [
            '*.haulcommand.com',
            '*.supabase.co',
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
    },
    // Deep links: haulcommand://offers/{offerId}
    // iOS: defined in Info.plist URL types (haulcommand)
    // Android: defined in AndroidManifest.xml intent filters
};

export default config;
