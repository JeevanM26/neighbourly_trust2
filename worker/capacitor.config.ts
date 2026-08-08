import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neighborly.trust.worker',
  appName: 'Neighborly Worker',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    WebRTC: {}
  }
};

export default config;
