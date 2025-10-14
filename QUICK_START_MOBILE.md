# Quick Start: Mobile App Development

## TL;DR - Mobile Build Commands

```bash
# 1. Set your backend URL in .env
echo "VITE_API_URL=https://your-backend.replit.app" > .env

# 2. Build and open iOS
npm run mobile:ios

# 3. Build and open Android
npm run mobile:android
```

## What Was Changed for Mobile Support?

### ✅ Configuration Files Created:
- `capacitor.config.ts` - Capacitor configuration
- `client/src/config/environment.ts` - Environment-aware API URL handling
- `.env.example` - Template for environment variables
- `MOBILE_BUILD_GUIDE.md` - Comprehensive mobile build documentation

### ✅ Code Updates:
- `client/src/lib/queryClient.ts` - API client now uses absolute URLs
- `client/src/components/ui/universal-chat-widget.tsx` - WebSocket uses environment config
- `client/index.html` - Added mobile-friendly viewport meta tag
- `.gitignore` - Excluded iOS/Android native folders

### ✅ Native Projects Added:
- `ios/` - Native iOS project (Xcode)
- `android/` - Native Android project (Android Studio)

## How It Works

### Development (Web):
When you run `npm run dev`, the app works as before:
- Uses relative URLs (`/api/...`)
- Connects to local Express server
- Everything works on `localhost`

### Mobile Build:
When you build for mobile:
- `environment.ts` detects it's running in Capacitor
- All API calls use absolute URLs (e.g., `https://your-backend.replit.app/api/...`)
- WebSocket connects to deployed backend
- App runs natively on iOS/Android devices

## Environment Configuration

The app automatically determines the correct API URL:

```typescript
// In web development:
API_URL = window.location.origin  // http://localhost:5000

// In mobile app:
API_URL = process.env.VITE_API_URL  // https://your-backend.replit.app
```

## Available Scripts

### Mobile Development:
```bash
# Build web app only (for mobile)
npm run build:mobile

# Build and sync to native projects
npm run mobile:sync

# Open iOS project in Xcode
npm run mobile:ios

# Open Android project in Android Studio
npm run mobile:android

# Build and run on connected iOS device
npm run mobile:run:ios

# Build and run on connected Android device
npm run mobile:run:android
```

### Web Development (unchanged):
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run check

# Update database schema
npm run db:push
```

## Before Building Mobile App

### 1. Deploy Your Backend

The mobile app **cannot** run the Express server locally. You must deploy your backend first:

**Option A: Keep on Replit**
- Your backend is already on Replit
- Make note of your URL: `https://your-project.replit.app`
- Enable "Always On" to keep it running

**Option B: Deploy to Railway/Render**
- Export your Replit code
- Deploy to Railway.app or Render.com
- Set all environment variables
- Update CORS settings

### 2. Configure Environment

Create `.env` file with your deployed backend URL:
```bash
VITE_API_URL=https://your-backend-url.replit.app
```

### 3. Update Backend CORS

Add mobile app origins to your backend's CORS whitelist:
```typescript
// In server/index.ts or wherever CORS is configured
const allowedOrigins = [
  'capacitor://localhost',
  'http://localhost',
  'ionic://localhost',
  'https://your-frontend-domain.com'
];
```

## Testing Mobile App

### iOS Simulator (Mac only):
```bash
npm run mobile:run:ios
```

### Android Emulator:
```bash
npm run mobile:run:android
```

### Physical Device:
1. Open project: `npm run mobile:ios` or `npm run mobile:android`
2. Connect your device via USB
3. Select device in Xcode/Android Studio
4. Click "Run" button

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Cause**: Backend URL not configured or backend not running
**Fix**:
1. Verify `.env` has correct `VITE_API_URL`
2. Test backend URL in browser
3. Rebuild: `npm run mobile:sync`

### Issue: "WebSocket connection failed"
**Cause**: WebSocket URL is incorrect or using wrong protocol
**Fix**:
1. Ensure backend uses `wss://` for HTTPS
2. Check `environment.ts` WebSocket URL generation
3. Verify backend WebSocket server is accessible

### Issue: "Authentication doesn't work on mobile"
**Cause**: Cookie-based sessions don't work well in mobile apps
**Fix**: You'll need to implement token-based auth (JWT)
- See MOBILE_BUILD_GUIDE.md section on authentication
- Consider using Capacitor Preferences for secure token storage

### Issue: Build fails with module not found
**Cause**: Dependencies not installed in native projects
**Fix**: `npx cap sync` then rebuild in Xcode/Android Studio

## Next Steps

1. ✅ **Read MOBILE_BUILD_GUIDE.md** for complete build instructions
2. 🚀 **Deploy your backend** to a public URL
3. ⚙️ **Configure .env** with backend URL
4. 📱 **Build and test** on iOS/Android
5. 🏪 **Submit to App Store/Play Store** (see full guide)

## Need Help?

- Full documentation: See `MOBILE_BUILD_GUIDE.md`
- Capacitor docs: https://capacitorjs.com/docs
- iOS setup: https://capacitorjs.com/docs/ios
- Android setup: https://capacitorjs.com/docs/android

---

**Important Reminder**: The mobile app is a native wrapper around your React web app. All your React code, components, and logic remain the same - only the API connection layer changed to support both web and mobile contexts.
