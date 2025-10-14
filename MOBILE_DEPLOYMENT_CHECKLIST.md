# Mobile App Deployment Checklist

Use this checklist to track your progress from development to App Store/Play Store submission.

## Phase 1: Backend Preparation

- [ ] **Deploy Backend to Public URL**
  - [ ] Choose hosting platform (Replit / Railway / Render / Fly.io)
  - [ ] Deploy Express backend
  - [ ] Note public URL: `____________________`
  - [ ] Verify backend is accessible at URL
  - [ ] Enable "Always On" (if using Replit)

- [ ] **Configure Backend Environment**
  - [ ] Set `DATABASE_URL` on hosting platform
  - [ ] Set `ANTHROPIC_API_KEY` on hosting platform
  - [ ] Set `NODE_ENV=production`
  - [ ] Set `REPLIT_DOMAINS` (if applicable)

- [ ] **Update CORS Configuration**
  - [ ] Add `capacitor://localhost` to allowed origins
  - [ ] Add `http://localhost` to allowed origins
  - [ ] Add `ionic://localhost` to allowed origins
  - [ ] Test CORS with Postman/browser

- [ ] **Test Backend Endpoints**
  - [ ] `GET /api/user` returns 401/200
  - [ ] `POST /api/children` works
  - [ ] `GET /api/chore-templates` works
  - [ ] WebSocket `/ws` connects successfully
  - [ ] All critical endpoints responding

## Phase 2: Local Environment Setup

- [ ] **Configure Frontend Environment**
  - [ ] Create `.env` file in root
  - [ ] Set `VITE_API_URL=https://your-backend-url`
  - [ ] Remove any trailing slashes from URL
  - [ ] Verify `.env` is in `.gitignore`

- [ ] **Verify Build Works**
  - [ ] Run `npm run check` (TypeScript)
  - [ ] Run `npm run build:mobile` (Vite build)
  - [ ] Check `dist/public/` exists
  - [ ] No build errors

- [ ] **Install Development Tools**
  - [ ] macOS: Install Xcode 14+ (for iOS)
  - [ ] macOS: Install CocoaPods (`sudo gem install cocoapods`)
  - [ ] Install Android Studio (for Android)
  - [ ] Install JDK 17+
  - [ ] Verify Capacitor: `npx cap doctor`

## Phase 3: iOS Development (Mac Only)

- [ ] **Setup Apple Developer Account**
  - [ ] Sign up for Apple Developer Program ($99/year)
  - [ ] Complete identity verification
  - [ ] Accept agreements
  - [ ] Note Team ID: `____________________`

- [ ] **Configure Xcode Project**
  - [ ] Run `npm run mobile:ios`
  - [ ] Xcode opens successfully
  - [ ] Select project in left sidebar
  - [ ] Go to "Signing & Capabilities"
  - [ ] Select your Team
  - [ ] Verify Bundle ID: `com.chorebuster.app`
  - [ ] Enable "Automatically manage signing"

- [ ] **Add App Icons**
  - [ ] Create 1024x1024 app icon
  - [ ] Add icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
  - [ ] Generate all required sizes (use online tool)
  - [ ] Verify icons appear in Xcode

- [ ] **Configure Launch Screen**
  - [ ] Design launch screen
  - [ ] Update `ios/App/App/Base.lproj/LaunchScreen.storyboard`
  - [ ] Test launch screen appearance

- [ ] **Test on iOS Simulator**
  - [ ] Select simulator (e.g., iPhone 15)
  - [ ] Click Run button (or Cmd+R)
  - [ ] App launches successfully
  - [ ] Test all core features work
  - [ ] API calls connect to backend
  - [ ] WebSocket chat works
  - [ ] No console errors

- [ ] **Test on Physical iPhone**
  - [ ] Connect iPhone via USB
  - [ ] Trust computer on iPhone
  - [ ] Select iPhone in Xcode
  - [ ] Click Run
  - [ ] App installs and launches
  - [ ] Test all features on device

## Phase 4: Android Development

- [ ] **Configure Android Studio**
  - [ ] Run `npm run mobile:android`
  - [ ] Android Studio opens successfully
  - [ ] Wait for Gradle sync
  - [ ] No sync errors

- [ ] **Update App Configuration**
  - [ ] Open `android/app/build.gradle`
  - [ ] Verify `applicationId "com.chorebuster.app"`
  - [ ] Set `minSdkVersion 22`
  - [ ] Set `targetSdkVersion 34`
  - [ ] Update version code/name

- [ ] **Add App Icons**
  - [ ] Create app icons (all sizes)
  - [ ] Add to `android/app/src/main/res/mipmap-*/`
  - [ ] Sizes: mdpi (48), hdpi (72), xhdpi (96), xxhdpi (144), xxxhdpi (192)

- [ ] **Test on Android Emulator**
  - [ ] Create AVD in Android Studio
  - [ ] Start emulator
  - [ ] Click Run button
  - [ ] App launches successfully
  - [ ] Test all core features
  - [ ] API calls work
  - [ ] WebSocket connects

- [ ] **Test on Physical Android Device**
  - [ ] Enable Developer Options on device
  - [ ] Enable USB Debugging
  - [ ] Connect via USB
  - [ ] Select device in Android Studio
  - [ ] Click Run
  - [ ] App installs and launches
  - [ ] Test all features

## Phase 5: Pre-Submission Testing

- [ ] **Feature Testing**
  - [ ] User authentication works
  - [ ] Parent dashboard loads
  - [ ] Child dashboard loads
  - [ ] Create/edit/delete children
  - [ ] Create/assign/complete chores
  - [ ] Rewards system works
  - [ ] AI chat functions
  - [ ] Calendar scheduling works
  - [ ] Settings update properly
  - [ ] All data persists correctly

- [ ] **Performance Testing**
  - [ ] App launches quickly (< 3 seconds)
  - [ ] Navigation is smooth
  - [ ] No memory leaks
  - [ ] No crashes during normal use
  - [ ] Works on slow network
  - [ ] Handles network errors gracefully

- [ ] **Device Testing**
  - [ ] Test on iPhone SE (small screen)
  - [ ] Test on iPhone 15 Pro Max (large screen)
  - [ ] Test on Android phone (various sizes)
  - [ ] Test on tablet (if supported)
  - [ ] Test in portrait orientation
  - [ ] Test in landscape orientation

- [ ] **Edge Cases**
  - [ ] Works without internet (show error)
  - [ ] Handles API timeouts
  - [ ] Handles invalid responses
  - [ ] Works after app backgrounded
  - [ ] Works after device locked/unlocked
  - [ ] Handles auth token expiration

## Phase 6: iOS App Store Submission

- [ ] **App Store Connect Setup**
  - [ ] Log in to App Store Connect
  - [ ] Click "My Apps"
  - [ ] Click "+" to create new app
  - [ ] Fill in app information:
    - [ ] Name: Chore Buster
    - [ ] Bundle ID: com.chorebuster.app
    - [ ] SKU: `____________________`
    - [ ] Primary Language: English

- [ ] **App Information**
  - [ ] Write app description (4000 char max)
  - [ ] Write promotional text (170 char max)
  - [ ] List key features
  - [ ] Add keywords (100 char max)
  - [ ] Add support URL
  - [ ] Add privacy policy URL

- [ ] **Screenshots**
  - [ ] iPhone 6.7" (1290 x 2796) - 3 required
  - [ ] iPhone 6.5" (1242 x 2688) - 3 required
  - [ ] iPhone 5.5" (1242 x 2208) - optional
  - [ ] iPad Pro 12.9" (2048 x 2732) - if supported
  - [ ] Show key features in screenshots

- [ ] **App Privacy**
  - [ ] Complete privacy questionnaire
  - [ ] Describe data collection practices
  - [ ] List third-party SDKs (Anthropic)
  - [ ] Add privacy policy link

- [ ] **Pricing and Availability**
  - [ ] Set price (Free recommended)
  - [ ] Select territories
  - [ ] Choose availability date

- [ ] **Archive and Upload**
  - [ ] In Xcode: Product → Archive
  - [ ] Wait for archive to complete
  - [ ] Click "Distribute App"
  - [ ] Select "App Store Connect"
  - [ ] Follow upload wizard
  - [ ] Wait for processing (10-60 minutes)

- [ ] **Submit for Review**
  - [ ] Add App Store version info
  - [ ] Add what's new text
  - [ ] Add contact information
  - [ ] Answer review questions
  - [ ] Submit for review
  - [ ] Wait 1-3 days for review

## Phase 7: Google Play Store Submission

- [ ] **Generate Signing Key**
  - [ ] Run keytool command to generate keystore
  - [ ] Save keystore file securely
  - [ ] Note keystore password: (store securely, not here!)
  - [ ] Note key alias
  - [ ] **BACKUP THIS FILE** - you need it for all updates!

- [ ] **Google Play Console Setup**
  - [ ] Sign in to Google Play Console
  - [ ] Create new application
  - [ ] Fill in app details:
    - [ ] App name: Chore Buster
    - [ ] Default language: English
    - [ ] App type: App
    - [ ] Free or paid: Free

- [ ] **Store Listing**
  - [ ] Short description (80 chars)
  - [ ] Full description (4000 chars)
  - [ ] Add screenshots:
    - [ ] Phone (min 2, max 8)
    - [ ] 7-inch tablet (optional)
    - [ ] 10-inch tablet (optional)
  - [ ] Add feature graphic (1024 x 500)
  - [ ] Add app icon (512 x 512)
  - [ ] Add promo video (optional)
  - [ ] Category: Productivity
  - [ ] Tags: family, chores, tasks

- [ ] **Content Rating**
  - [ ] Complete questionnaire
  - [ ] Describe content
  - [ ] Submit for rating

- [ ] **Pricing & Distribution**
  - [ ] Set price (Free recommended)
  - [ ] Select countries
  - [ ] Confirm content guidelines
  - [ ] Confirm US export laws

- [ ] **Build App Bundle**
  - [ ] In Android Studio: Build → Generate Signed Bundle
  - [ ] Select Android App Bundle (AAB)
  - [ ] Select your keystore file
  - [ ] Enter keystore password
  - [ ] Choose "release" variant
  - [ ] Wait for build
  - [ ] Note AAB location

- [ ] **Upload and Release**
  - [ ] Go to "Release" → "Production"
  - [ ] Create new release
  - [ ] Upload AAB file
  - [ ] Add release notes
  - [ ] Review and rollout
  - [ ] Submit for review
  - [ ] Wait 1-3 days for review

## Phase 8: Post-Launch

- [ ] **Monitor Performance**
  - [ ] Check App Store Connect analytics
  - [ ] Check Google Play Console statistics
  - [ ] Monitor crash reports
  - [ ] Read user reviews
  - [ ] Track download numbers

- [ ] **User Support**
  - [ ] Set up support email
  - [ ] Respond to user reviews
  - [ ] Create FAQ page
  - [ ] Monitor feedback channels

- [ ] **Plan Updates**
  - [ ] Fix reported bugs
  - [ ] Implement feature requests
  - [ ] Keep dependencies updated
  - [ ] Regular security updates

## Notes

### Important URLs to Save
- Backend URL: `____________________`
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- Support Email: `____________________`
- Privacy Policy URL: `____________________`

### Credentials (Store Securely, Not Here!)
- Apple Developer Account
- Google Play Console Account
- Keystore file location
- App Store Connect API Key (optional)

### Timeline Estimate
- Backend deployment: 2-4 hours
- iOS setup and testing: 4-8 hours
- Android setup and testing: 4-8 hours
- App Store submission: 2-3 hours + 1-3 days review
- Play Store submission: 2-3 hours + 1-3 days review
- **Total: 1-2 weeks from start to launch**

---

## ✅ Ready to Launch?

Once all boxes are checked:
- 🎉 Your app is live on iOS and Android!
- 📱 Users can download from App Store and Play Store
- 🚀 Start marketing your app
- 📊 Monitor analytics and iterate

**Good luck with your mobile app launch! 🎊**
