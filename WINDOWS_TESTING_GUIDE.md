# Testing Chore Buster on Windows

Since you're on Windows, you can test **Android** apps but not iOS. Here's how!

## 🚀 Quick Start: Android Emulator (10 minutes)

### Step 1: Build and Open Android Studio
```bash
npm run mobile:android
```

Wait for Android Studio to open and Gradle to sync (2-3 minutes first time).

### Step 2: Create an Android Virtual Device (AVD)

1. Look for the **Device Manager** icon on the right toolbar (looks like a phone)
2. Click **Create Device**
3. **Select Hardware:**
   - Choose **Pixel 5** (good middle-ground device)
   - Click **Next**
4. **Select System Image:**
   - Choose **Tiramisu** (Android 13, API Level 33)
   - If not downloaded, click **Download** next to it
   - Click **Next**
5. **Verify Configuration:**
   - Name: Pixel 5 API 33
   - Click **Finish**

### Step 3: Start the Emulator

1. In Device Manager, find your new virtual device
2. Click the ▶️ **Play** button
3. Wait for Android to boot (1-2 minutes first time)
4. You'll see an Android phone on your screen!

### Step 4: Run Your App

1. In Android Studio top toolbar, verify your emulator is selected
2. Click the green **Run** button (▶️) or press **Shift+F10**
3. Wait for build to complete (30 seconds - 2 minutes first time)
4. **Your app launches!** 🎉

### Step 5: Test Your App

Try these features:
- [ ] App launches and shows login screen
- [ ] Can log in with credentials
- [ ] Parent dashboard loads
- [ ] Can view/add children
- [ ] Can assign chores
- [ ] AI chat widget works
- [ ] Navigation between screens works

---

## 📱 Testing on Physical Android Device

This gives you the most realistic testing experience!

### Step 1: Enable Developer Mode on Your Phone

1. Open **Settings** on your Android phone
2. Scroll to **About Phone** (may be under **System**)
3. Find **Build Number**
4. **Tap it 7 times** rapidly
5. You'll see: "You are now a developer!"

### Step 2: Enable USB Debugging

1. Go back to main **Settings**
2. Look for **System** → **Developer Options**
   - (On some phones: **Additional Settings** → **Developer Options**)
3. Toggle on **USB Debugging**
4. Confirm when prompted

### Step 3: Connect Your Phone

1. Connect your Android phone to PC with USB cable
2. On your phone, you'll see: "Allow USB debugging?"
3. Check **Always allow from this computer**
4. Tap **Allow**

### Step 4: Verify Connection

```bash
# In Windows PowerShell or Command Prompt:
cd android
.\gradlew tasks

# Or in Android Studio, check if your device appears in the device dropdown
```

Your phone should appear in the device list!

### Step 5: Run on Your Phone

```bash
npm run mobile:android
```

Or in Android Studio:
1. Select your phone from the device dropdown
2. Click **Run** (▶️)
3. App installs on your phone!

---

## 🌐 Browser Testing (Fastest Option)

Test the full web version locally:

```bash
npm run dev
```

Then open: `http://localhost:5000`

**What you get:**
- ✅ Fastest way to test features
- ✅ Full dev tools for debugging
- ✅ Connects to taskie.org backend
- ✅ Same React code as mobile
- ✅ No emulator needed

**What you don't get:**
- ❌ Native mobile UI/UX
- ❌ Mobile-specific plugins
- ❌ Device-specific bugs

---

## 🔧 Troubleshooting

### "Gradle sync failed"
```bash
# In Android Studio:
File → Invalidate Caches → Invalidate and Restart
```

### "Emulator won't start"
1. Check BIOS virtualization is enabled (VT-x/AMD-V)
2. Try creating a new AVD with a different API level
3. Restart Android Studio

### "Device not detected"
1. Try a different USB cable
2. Install USB drivers for your phone brand:
   - Samsung: Samsung USB Driver
   - Google Pixel: Google USB Driver
   - Others: Search "[phone brand] USB driver"
3. Restart Android Studio
4. On phone: Toggle USB Debugging off and on

### "Build failed"
```bash
# Clean and rebuild:
npm run mobile:sync
```

### "Cannot connect to backend"
1. Check `.env` has `VITE_API_URL=https://taskie.org`
2. Verify taskie.org is accessible in browser
3. Rebuild: `npm run mobile:sync`

---

## 📊 Performance Tips

### Speed Up Emulator:
1. Use x86_64 system images (faster than ARM)
2. Enable hardware acceleration:
   - Tools → AVD Manager → Edit (pencil icon)
   - Advanced Settings → Graphics: Hardware
3. Allocate more RAM (2048 MB minimum)

### Speed Up Builds:
1. In `android/gradle.properties`, add:
   ```
   org.gradle.jvmargs=-Xmx4096m
   org.gradle.parallel=true
   org.gradle.caching=true
   ```

---

## ✅ What You Can Test on Windows

| Feature | Browser | Android Emulator | Physical Android | iOS |
|---------|---------|------------------|------------------|-----|
| UI/UX | ✅ | ✅ | ✅ | ❌ (Need Mac) |
| API Calls | ✅ | ✅ | ✅ | ❌ |
| WebSocket | ✅ | ✅ | ✅ | ❌ |
| Authentication | ✅ | ✅ | ✅ | ❌ |
| Performance | ⚠️ (Fast) | ⚠️ (Slower) | ✅ (Real) | ❌ |
| Native Features | ❌ | ⚠️ (Simulated) | ✅ (Real) | ❌ |

---

## 🎯 Recommended Testing Workflow

**Day-to-day development:**
```bash
npm run dev
# Test in browser - fastest iteration
```

**Before committing changes:**
```bash
npm run mobile:android
# Test in emulator - catch mobile-specific issues
```

**Before deploying:**
```bash
# Test on physical Android device
# Test on different screen sizes
```

**For iOS:**
```bash
# When you have access to a Mac:
npm run mobile:ios
```

---

## 🚫 iOS Testing on Windows: Not Possible

You **cannot** test iOS on Windows because:
- Xcode is macOS-only
- iOS Simulator is macOS-only
- Apple's toolchain doesn't run on Windows

**Alternatives:**
1. **Mac cloud services**: MacStadium, MacinCloud ($20-30/month)
2. **CI/CD services**: Use GitHub Actions with macOS runner
3. **Borrow a Mac**: From a friend/colleague for testing
4. **Focus on Android first**: Most bugs will be the same across platforms

---

## 💡 Pro Tips

1. **Use browser for rapid development** - way faster than emulator
2. **Keep emulator running** - don't close it between tests
3. **Enable live reload** for faster testing:
   ```bash
   npx cap run android --livereload
   ```
4. **Test on real device** before publishing to Play Store
5. **Different screen sizes** - create multiple AVDs (small phone, tablet)

---

## 🎊 You're Ready!

Start with browser testing, then move to Android emulator:

```bash
# Quick test in browser:
npm run dev

# Full Android test:
npm run mobile:android
```

Your Chore Buster app will work great on Android, and iOS testing can happen later when you have Mac access!

---

## 🆘 Need Help?

- Android Studio docs: https://developer.android.com/studio
- Capacitor Android guide: https://capacitorjs.com/docs/android
- Emulator guide: https://developer.android.com/studio/run/emulator
