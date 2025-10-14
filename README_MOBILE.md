# 📱 Chore Buster - Now Available as a Mobile App!

Chore Buster has been enhanced with **Capacitor** to run as native iOS and Android mobile applications, while maintaining full web compatibility.

## 🎉 What's New

- ✅ Native iOS app support
- ✅ Native Android app support
- ✅ Works on Web, iOS, and Android with one codebase
- ✅ Smart environment detection
- ✅ Automatic API URL routing
- ✅ Seamless WebSocket connections

## 🚀 Quick Start

### For Web Development (Unchanged)
```bash
npm run dev
```
Your app runs at `http://localhost:5000` as before.

### For Mobile Development

**1. Deploy your backend** (required for mobile):
```bash
# Your backend must be publicly accessible
# Options: Replit (current), Railway, Render, Fly.io
```

**2. Configure environment**:
```bash
cp .env.example .env
# Edit .env and set:
VITE_API_URL=https://your-backend.replit.app
```

**3. Build for iOS** (Mac only):
```bash
npm run mobile:ios
```
This opens Xcode. Configure signing and click Run.

**4. Build for Android**:
```bash
npm run mobile:android
```
This opens Android Studio. Click Run to build.

## 📚 Documentation

We've created comprehensive documentation to help you build and deploy mobile apps:

### 1. **QUICK_START_MOBILE.md**
Quick reference for common tasks and troubleshooting.

### 2. **MOBILE_BUILD_GUIDE.md**
Complete step-by-step guide covering:
- Prerequisites for iOS and Android
- Backend deployment requirements
- Building for devices
- App Store submission
- Troubleshooting

### 3. **MOBILE_ARCHITECTURE.md**
Visual diagrams and explanations of:
- System architecture
- Request flow comparison
- Environment detection logic
- Security considerations

### 4. **CAPACITOR_IMPLEMENTATION_SUMMARY.md**
Technical summary of all changes made:
- Files created/modified
- How environment detection works
- What stayed the same

## 🛠️ New NPM Scripts

```bash
# Build web assets for mobile
npm run build:mobile

# Build and sync to native projects
npm run mobile:sync

# Open Xcode project
npm run mobile:ios

# Open Android Studio project
npm run mobile:android

# Build and run on iOS device
npm run mobile:run:ios

# Build and run on Android device
npm run mobile:run:android
```

## 📂 Project Structure

```
ChoreTracker/
├── capacitor.config.ts              # Capacitor config
├── ios/                             # Native iOS (gitignored)
├── android/                         # Native Android (gitignored)
├── client/
│   └── src/
│       ├── config/
│       │   └── environment.ts       # NEW: Smart URL routing
│       ├── lib/
│       │   └── queryClient.ts       # UPDATED: Absolute URLs
│       └── components/
│           └── ui/
│               └── universal-chat-widget.tsx  # UPDATED: WS config
├── .env.example                     # Environment template
├── QUICK_START_MOBILE.md           # Quick reference
├── MOBILE_BUILD_GUIDE.md           # Complete guide
├── MOBILE_ARCHITECTURE.md          # Architecture diagrams
└── CAPACITOR_IMPLEMENTATION_SUMMARY.md  # Technical summary
```

## 🔧 How It Works

### Smart Environment Detection

The app automatically detects whether it's running in a web browser or mobile app:

```typescript
// Web development → Uses local backend
if (!isCapacitor && isDevelopment) {
  API_URL = 'http://localhost:5000'
}

// Mobile app → Uses deployed backend
if (isCapacitor) {
  API_URL = process.env.VITE_API_URL
}
```

### API Request Flow

**Web Development:**
```
React App → /api/user → Local Express Server
```

**Mobile App:**
```
React App → https://backend.replit.app/api/user → Deployed Express Server
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Backend API URL (required for mobile builds)
VITE_API_URL=https://your-backend.replit.app

# Backend-only variables (not needed for mobile builds)
DATABASE_URL=your_postgres_url
ANTHROPIC_API_KEY=your_api_key
```

### Backend CORS Setup

Add mobile app origins to your CORS configuration:

```typescript
const allowedOrigins = [
  'capacitor://localhost',
  'http://localhost',
  'ionic://localhost'
];
```

## 🔐 Security Notes

1. **Backend Deployment Required**: Mobile apps cannot run the Express server locally
2. **HTTPS Required**: Use HTTPS for production backends (wss:// for WebSocket)
3. **Authentication**: Cookie-based sessions may need updating to JWT tokens for mobile
4. **Token Storage**: Use `@capacitor/preferences` for secure token storage
5. **CORS Configuration**: Add mobile origins to backend whitelist

## 📱 What You Get

### One Codebase, Three Platforms

- **Web**: Full-featured web application
- **iOS**: Native iOS app (publish to App Store)
- **Android**: Native Android app (publish to Play Store)

### Native Features

With Capacitor plugins, you can add:
- Push notifications
- Camera access
- Biometric authentication
- Local storage
- Share functionality
- And much more...

## 🎯 Next Steps

1. **Deploy Backend**: Get your Express server on a public URL
2. **Configure .env**: Set `VITE_API_URL` to your backend URL
3. **Build iOS**: Run `npm run mobile:ios` (requires Mac + Xcode)
4. **Build Android**: Run `npm run mobile:android` (requires Android Studio)
5. **Test**: Run on physical devices or simulators
6. **Submit**: Follow app store submission guidelines

## 📖 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [Android Developer Guide](https://developer.android.com/docs)
- [App Store Submission](https://developer.apple.com/app-store/submissions/)
- [Google Play Submission](https://support.google.com/googleplay/android-developer/answer/9859152)

## 💡 Tips

1. **Start with iOS Simulator** (easiest to test)
2. **Use Android Emulator** for Android testing
3. **Test on real devices** before submission
4. **Enable live reload** for faster development:
   ```bash
   npx cap run ios --livereload
   npx cap run android --livereload
   ```

## ❓ Need Help?

- Check `QUICK_START_MOBILE.md` for common issues
- Review `MOBILE_BUILD_GUIDE.md` for detailed instructions
- Study `MOBILE_ARCHITECTURE.md` to understand how it works
- Read `CAPACITOR_IMPLEMENTATION_SUMMARY.md` for technical details

## 🎊 What Wasn't Changed

Good news! 95% of your codebase remains unchanged:

- ✅ All React components
- ✅ shadcn/ui components
- ✅ TanStack Query setup
- ✅ Wouter routing
- ✅ Business logic
- ✅ UI/UX
- ✅ Database queries

**Only the API connection layer was updated** to support mobile contexts!

---

**Built with:** React + TypeScript + Capacitor + Express + PostgreSQL

**Ready to go mobile?** Start with `QUICK_START_MOBILE.md` 🚀
