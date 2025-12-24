import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.peutic.app',
  appName: 'Peutic',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Configuration for native plugins can go here
  }
};

export default config;