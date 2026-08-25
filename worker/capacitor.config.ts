import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neighborly.trust.worker',
  appName: 'HeroHand Partner',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    errorPath: '404.html'
  },
  plugins: {
    WebRTC: {}
  }
};

export default config;
