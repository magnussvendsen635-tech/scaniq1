import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.scaniq.app',
  appName: 'ScanIQ',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    HealthKit: {
      // iOS HealthKit usage descriptions are set in Info.plist
    },
  },
};

export default config;
