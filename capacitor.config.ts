import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haulcommand.app',
  appName: 'Haul Command',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    // During active Next.js AI development, tell native wrappers 
    // to render the live URL to maintain real-time SSR and RPC data.
    // Replace with `url: "https://www.haulcommand.com"` on production build.
    url: "https://www.haulcommand.com",
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Geolocation: {
      // Used to actively track operators for Live Ping
    }
  }
};

export default config;
