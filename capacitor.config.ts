import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neighborly.trust',
  appName: 'Neighborly Trust',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    WebRTC: {}
  }
};

export default config;
