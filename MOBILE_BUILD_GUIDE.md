# Chore Buster Mobile App Build Guide

This guide will walk you through building and deploying Chore Buster as iOS and Android mobile apps using Capacitor.

## Prerequisites

### For iOS Development:
- macOS computer
- Xcode 14+ installed
- Apple Developer Account ($99/year for App Store distribution)
- CocoaPods installed: `sudo gem install cocoapods`

### For Android Development:
- Android Studio installed
- JDK 17+ installed
- Android SDK and build tools

## Step 1: Deploy Your Backend

Before building the mobile app, you MUST deploy your backend server to a publicly accessible URL. The mobile app cannot run the Express server locally.

### Option A: Keep Backend on Replit
1. Your backend is already running on Replit
2. Note your Replit URL (e.g., `https://your-project.replit.app`)
3. Ensure the backend stays running (Always On feature on Replit)

### Option B: Deploy Backend Elsewhere
Consider deploying to:
- **Railway** (recommended) - Easy Node.js deployment
- **Render** - Free tier available
- **Fly.io** - Global deployment
- **Heroku** - Familiar platform

Make sure to:
- Set all environment variables (DATABASE_URL, ANTHROPIC_API_KEY, etc.)
- Enable CORS for your mobile app domain
- Test all API endpoints are accessible

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your deployed backend URL:
   ```
   VITE_API_URL=https://your-backend-url.replit.app
   ```

3. **Important**: Remove any trailing slashes from the URL

## Step 3: Update Authentication Flow

The mobile app requires OAuth callback handling. Update `server/replitAuth.ts`:

1. Add mobile app redirect URIs to your OAuth configuration
2. For Capacitor, use custom URL scheme: `com.chorebuster.app://oauth-callback`
3. You may need to implement a token-based auth flow instead of cookie sessions for mobile

**Recommended Approach:**
- Implement OAuth with mobile deep linking
- Store auth tokens securely using Capacitor Preferences plugin
- Consider adding `@capacitor/preferences` for secure token storage

## Step 4: Build the Web App

Build the React app for production:

```bash
npm run build
```

This creates optimized files in `dist/public/`.

## Step 5: Sync with Native Projects

Copy web assets to iOS and Android projects:

```bash
npx cap sync
```

This command:
- Copies built web files to native projects
- Updates native dependencies
- Configures plugins

## Step 6: Build for iOS

### A. Open Xcode Project
```bash
npx cap open ios
```

### B. Configure App Settings in Xcode
1. Select the project root in left sidebar
2. Under "Signing & Capabilities":
   - Select your Apple Developer Team
   - Ensure Bundle Identifier matches: `com.chorebuster.app`
   - Enable automatic signing

### C. Set Deployment Target
- Set minimum iOS version to 13.0 or higher
- Go to Build Settings → iOS Deployment Target

### D. Configure App Icons and Splash Screen
1. Add app icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
2. Sizes needed: 1024x1024 (App Store), 180x180, 120x120, 87x87, etc.
3. Add launch screen in `ios/App/App/Base.lproj/LaunchScreen.storyboard`

### E. Build and Run
1. Select a device or simulator from the top toolbar
2. Click the "Play" button or press Cmd+R
3. App will build and launch on selected device

### F. Archive for App Store
1. Product → Archive
2. Once archived, click "Distribute App"
3. Follow prompts to submit to App Store Connect

## Step 7: Build for Android

### A. Open Android Studio Project
```bash
npx cap open android
```

### B. Configure App Settings
1. Update `android/app/build.gradle` if needed:
   - Minimum SDK version: 22 (Android 5.1)
   - Target SDK version: 34 (Android 14)
   - Version code and version name

### C. Generate Signing Key (for production)
```bash
keytool -genkey -v -keystore chore-buster.keystore -alias chore-buster -keyalg RSA -keysize 2048 -validity 10000
```

Store this keystore file securely! You'll need it for all future updates.

### D. Configure App Icons
1. Place app icons in `android/app/src/main/res/` directories:
   - `mipmap-mdpi/` (48x48)
   - `mipmap-hdpi/` (72x72)
   - `mipmap-xhdpi/` (96x96)
   - `mipmap-xxhdpi/` (144x144)
   - `mipmap-xxxhdpi/` (192x192)

### E. Build APK for Testing
1. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Or via command line:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
3. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### F. Build for Google Play Store
1. Build → Generate Signed Bundle / APK
2. Select "Android App Bundle"
3. Select your keystore file and credentials
4. Choose "release" build variant
5. Upload the AAB file to Google Play Console

## Step 8: Testing the Mobile App

### Test Checklist:
- [ ] All API calls work with deployed backend
- [ ] Authentication flow completes successfully
- [ ] WebSocket chat connects properly
- [ ] All features function as expected
- [ ] App works offline where appropriate
- [ ] Push notifications work (if implemented)
- [ ] App icons and splash screens display correctly
- [ ] Deep linking works (for OAuth callbacks)

### Common Issues:

**Issue: API calls fail with CORS errors**
- Solution: Add mobile app origins to CORS whitelist on backend
- Add `capacitor://localhost` and `http://localhost` to allowed origins

**Issue: WebSocket connection fails**
- Solution: Ensure WS_URL in environment.ts points to deployed backend
- Use `wss://` (secure WebSocket) for production HTTPS backends

**Issue: Authentication doesn't work**
- Solution: Mobile apps can't use cookie-based session auth reliably
- Implement token-based auth (JWT) with Capacitor Preferences for storage

**Issue: App crashes on launch**
- Solution: Check Xcode/Android Studio console for errors
- Common cause: Missing native plugins or incorrect configuration

## Step 9: App Store Submission

### iOS App Store:
1. Create app listing in App Store Connect
2. Upload screenshots (required sizes vary by device)
3. Write app description and keywords
4. Set pricing and availability
5. Submit for review (typically 1-3 days)

### Google Play Store:
1. Create app listing in Google Play Console
2. Upload screenshots and feature graphic
3. Write app description
4. Complete content rating questionnaire
5. Set pricing and distribution countries
6. Submit for review (typically 1-3 days)

## Step 10: Updating the Mobile App

When you make changes to your React code:

1. Build the web app:
   ```bash
   npm run build
   ```

2. Sync changes to native projects:
   ```bash
   npx cap sync
   ```

3. Rebuild in Xcode or Android Studio

4. Submit updated version to stores

**Note**: For JavaScript/CSS-only changes, consider using Capacitor Live Updates for over-the-air updates without store approval.

## Additional Capacitor Plugins to Consider

Enhance your mobile app with these plugins:

```bash
# Push notifications
npm install @capacitor/push-notifications

# Camera access (for chore completion photos)
npm install @capacitor/camera

# Local storage for offline support
npm install @capacitor/preferences

# Share content
npm install @capacitor/share

# Haptic feedback
npm install @capacitor/haptics

# App badge for notifications
npm install @capacitor/badge
```

## Troubleshooting Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [Android Developer Guide](https://developer.android.com/docs)
- [Capacitor Community Plugins](https://github.com/capacitor-community)

## Support

For issues with the mobile build:
1. Check Capacitor documentation
2. Review iOS/Android build logs
3. Test API endpoints with Postman
4. Verify environment configuration

## Security Considerations for Mobile

1. **Never commit sensitive data**:
   - Keep `.env` out of version control
   - Use different API keys for dev/production

2. **Secure token storage**:
   - Use Capacitor Preferences (encrypted on device)
   - Never store tokens in localStorage

3. **Network security**:
   - Always use HTTPS for API calls
   - Implement certificate pinning for production

4. **Code obfuscation**:
   - Enable ProGuard for Android release builds
   - Use code obfuscation tools for sensitive logic

---

**Next Steps After Mobile Build:**
- Monitor app analytics and crash reports
- Implement deep linking for better UX
- Add push notifications for task reminders
- Consider adding biometric authentication
- Set up CI/CD for automated builds
