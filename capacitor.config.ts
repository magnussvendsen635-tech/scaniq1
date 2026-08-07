import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kinetex.scaniq',
  appName: 'ScanIQ',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
