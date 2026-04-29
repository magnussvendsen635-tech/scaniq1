import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.051587a6d90b450abc149eadff6020b2',
  appName: 'kally-fit-fuel',
  webDir: 'dist',
  server: {
    url: 'https://051587a6-d90b-450a-bc14-9eadff6020b2.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    HealthKit: {
      // iOS HealthKit usage descriptions are set in Info.plist
    },
  },
};

export default config;
