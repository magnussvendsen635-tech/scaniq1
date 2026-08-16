import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kinetex.scaniq',
  appName: 'ScanIQ',
  webDir: 'dist',
  // The WKWebView must never pinch/double-tap zoom — the UI is a fixed-scale app shell.
  zoomEnabled: false,
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
  },
};

export default config;
