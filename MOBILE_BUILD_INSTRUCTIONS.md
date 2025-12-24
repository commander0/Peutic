# Mobile Build Instructions

Since this is a React web application, we use **Capacitor** to wrap it in a native Android container. Follow these steps to generate your signed APK.

## Prerequisites
1. **Node.js** installed.
2. **Android Studio** installed on your computer.

## Step 1: Install Dependencies & Build
Run the following commands in your project terminal:

```bash
# 1. Install the new Capacitor dependencies
npm install

# 2. Build the React web application (creates the 'dist' folder)
npm run build
```

## Step 2: Initialize Android Project
```bash
# 1. Add the Android platform
npx cap add android

# 2. Sync your web build to the Android project
npx cap sync
```

## Step 3: Permissions (One-time setup)
To ensure the video chat works, you must declare camera and microphone permissions.
1. Open the file: `android/app/src/main/AndroidManifest.xml` (this file is created after running step 2).
2. Add these lines inside the `<manifest>` tag, before `<application>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

## Step 4: Build Signed APK in Android Studio
1. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
2. Wait for Gradle to sync (bottom right status bar).
3. Go to the menu bar: **Build** > **Generate Signed Bundle / APK**.
4. Select **APK**.
5. Click **Next**.
6. Under **Key store path**, click **Create new...** (if you don't have one).
   - Choose a location to save your key file (e.g., `release-key.jks`).
   - Enter a password (remember this!).
   - Fill in the "Certificate" details (Name, Org, etc.).
7. Click **Next**.
8. Select **release** as the build variant.
9. Click **Create** (or Finish).

## Step 5: Locate your APK
Android Studio will notify you when the build is complete.
- Click **locate** in the notification.
- Or navigate to: `android/app/release/app-release.apk`

Transfer this `.apk` file to your Android phone and install it!
