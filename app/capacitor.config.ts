import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Replace "paperstack" in the middle with your GitHub username if you like.
  // Changing it later means Android treats it as a different app (see DECISIONS.md).
  appId: 'com.paperstack.reader',
  appName: 'PaperStack',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#FFFFFF',
    // We opt out of Android 15 edge-to-edge in styles.xml so the status bar can be tinted per theme.
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: '#FFFFFF',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_paperstack',
      iconColor: '#FF6719',
    },
  },
};

export default config;
