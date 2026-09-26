import type { CapacitorConfig } from '@capacitor/cli';

const appUrl =
  process.env.VENTADS_APP_URL ||
  'https://advibe-ai-six.vercel.app';

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
