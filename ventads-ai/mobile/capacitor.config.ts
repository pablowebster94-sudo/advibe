import type { CapacitorConfig } from '@capacitor/cli';

const appUrl =
  process.env.VENTADS_APP_URL ||
  'https://id-preview--d77c7bc9-c09c-4000-a642-467b377d8d6e.lovable.app';

const config: CapacitorConfig = {
  appId: 'com.advibe.ventads',
  appName: 'VentAds',
  webDir: 'www',
  server: {
    url: appUrl,
    cleartext: false
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
