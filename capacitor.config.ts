import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.scaniq.app',
  appName: 'ScanIQ',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
