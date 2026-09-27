import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * App Store / Play launch config layered on app.json (app.json is locked — do not edit it).
 * Icon & splash live in ./assets and are wired here.
 *
 * USER-OWNED before store submit:
 * - extra.eas.projectId
 * - production support / privacy inboxes (see src/lib/launch.ts)
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Rennova',
  slug: 'rennova',
  scheme: 'rennova',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F7F4EC',
  },
  ios: {
    ...(config.ios ?? {}),
    supportsTablet: true,
    bundleIdentifier: 'app.rennova.mobile',
    icon: './assets/icon.png',
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'Rennova uses your photo library so you can attach project and portfolio images to briefs and storefronts.',
      NSCameraUsageDescription:
        'Rennova uses the camera so you can photograph the work area for your project brief. Never climb or take unsafe photos.',
      CFBundleDisplayName: 'Rennova',
      // Standard HTTPS-only app — declare no non-exempt encryption for App Store export compliance.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...(config.android ?? {}),
    edgeToEdgeEnabled: true,
    package: 'app.rennova.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFD21C',
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F7F4EC',
        image: './assets/splash-icon.png',
        imageWidth: 200,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow Rennova to access your photos for project briefs and portfolio storefronts.',
        cameraPermission:
          'Allow Rennova to use the camera for project photos. Stay safe — no climbing or risk.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      // USER-OWNED: replace with your EAS project ID before `eas submit`
      projectId: 'replace-before-eas-submit',
    },
  },
});
