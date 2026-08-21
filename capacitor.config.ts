import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neighborly.trust',
  appName: 'Hero Hand',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    WebRTC: {}
  }
};

export default config;
