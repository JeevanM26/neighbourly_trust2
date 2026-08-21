import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neighborly.trust.worker',
  appName: 'Hero Hand Partner',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    WebRTC: {}
  }
};

export default config;
