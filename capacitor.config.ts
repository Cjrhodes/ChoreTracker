import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chorebuster.app',
  appName: 'Chore Buster',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // For live reload: uncomment and set to your computer's IP
    url: 'http://10.255.255.254:5000',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
