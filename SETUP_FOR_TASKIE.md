# Quick Setup Guide for Taskie.org Deployment

Since your backend is already deployed at **taskie.org**, you're ready to build mobile apps right away!

## ✅ What's Already Done

1. ✅ Backend deployed at `https://taskie.org`
2. ✅ `.env` configured with `VITE_API_URL=https://taskie.org`
3. ✅ CORS middleware added to `server/index.ts`
4. ✅ Mobile-specific origins allowed (capacitor://, ionic://)

## 🚀 Next Steps to Build Mobile Apps

### Step 1: Push CORS Changes to Replit/GitHub

The CORS configuration needs to be deployed to taskie.org:

```bash
# Commit the changes
git add server/index.ts package.json package-lock.json
git commit -m "Add CORS support for mobile apps"
git push
```

Your Replit should auto-deploy the changes. Wait a few minutes for the deployment.

### Step 2: Test Backend API

Verify the backend is accessible:

```bash
# Test from command line
curl https://taskie.org/api/user

# Should return 401 (unauthorized) - that's expected!
# It means the API is working, just needs authentication
```

### Step 3: Build for iOS (Mac Only)

```bash
# This will:
# 1. Build your React app with Vite
# 2. Copy files to iOS project
# 3. Open Xcode
npm run mobile:ios
```

**In Xcode:**
1. Select your Apple Developer Team (Signing & Capabilities)
2. Select a device/simulator from top toolbar
3. Click the "Play" button (▶️) to build and run
4. Your app launches and connects to taskie.org! 🎉

### Step 4: Build for Android

```bash
# This will:
# 1. Build your React app with Vite
# 2. Copy files to Android project
# 3. Open Android Studio
npm run mobile:android
```

**In Android Studio:**
1. Wait for Gradle sync to complete
2. Select a device/emulator from top toolbar
3. Click the "Run" button (▶️) to build and run
4. Your app launches and connects to taskie.org! 🎉

## 🧪 Testing the Mobile App

### What to Test:
- [ ] App launches successfully
- [ ] Can log in (authentication works)
- [ ] Parent dashboard loads with data
- [ ] Child dashboard loads with data
- [ ] Can create/edit children
- [ ] Can assign/complete chores
- [ ] AI chat widget connects and responds
- [ ] All features work as expected

### If Something Doesn't Work:

**Issue: "Cannot connect to backend"**
- Verify taskie.org is accessible in a browser
- Check `.env` has `VITE_API_URL=https://taskie.org`
- Rebuild: `npm run mobile:sync`

**Issue: "CORS error" in logs**
- Make sure you pushed the CORS changes to GitHub
- Wait for Replit to redeploy
- Check Replit logs for CORS errors

**Issue: "Authentication fails"**
- Mobile apps may need token-based auth instead of cookies
- See `MOBILE_BUILD_GUIDE.md` section on authentication
- Consider implementing JWT tokens

## 📱 Current Setup

```
Your Mobile App Architecture:

┌─────────────────────────┐
│   iOS/Android Device    │
│                         │
│   Chore Buster App      │
│   (React + Capacitor)   │
└──────────┬──────────────┘
           │
           │ HTTPS
           │
           ▼
┌─────────────────────────┐
│    https://taskie.org   │
│                         │
│   Express Backend       │
│   + PostgreSQL          │
│   + AI Service          │
└─────────────────────────┘
```

## 🔄 Development Workflow

### Making Changes to Your App:

1. **Edit your React code** (client/src/...)
2. **Test in web browser** first:
   ```bash
   npm run dev
   ```
3. **Build for mobile**:
   ```bash
   npm run mobile:sync
   ```
4. **Test in Xcode/Android Studio**

### Making Backend Changes:

1. **Edit server code** (server/...)
2. **Test locally**:
   ```bash
   npm run dev
   ```
3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
4. **Wait for Replit auto-deploy**
5. **Test mobile app** with updated backend

## 🎯 Your Environment Configuration

### `.env` (Local - For Mobile Builds)
```
VITE_API_URL=https://taskie.org
```
This tells your mobile app where the backend is.

### Replit Environment Variables (Backend)
These should already be set on Replit:
- `DATABASE_URL` - Your Neon PostgreSQL connection
- `ANTHROPIC_API_KEY` - Claude API key
- `NODE_ENV=production`
- `REPLIT_DOMAINS` - Your domain settings

## 🔐 Authentication Considerations

### Current Setup (Cookie-Based):
Your app currently uses cookie-based sessions via Replit Auth. This works for web but may have issues on mobile.

### Recommended for Production Mobile:
Consider implementing JWT (JSON Web Tokens):
1. User logs in → Backend returns JWT token
2. Mobile app stores token using `@capacitor/preferences`
3. App sends token in Authorization header
4. Backend verifies token

**Why?**
- Cookies can be unreliable in mobile apps
- Tokens give you more control
- Better for native apps

See `MOBILE_BUILD_GUIDE.md` Step 3 for implementation details.

## 📊 Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Backend API | ✅ Deployed | https://taskie.org |
| Database | ✅ Running | Neon PostgreSQL |
| AI Service | ✅ Configured | Anthropic Claude |
| Web App | ✅ Works | https://taskie.org |
| iOS App | 🔄 Ready to build | Run `npm run mobile:ios` |
| Android App | 🔄 Ready to build | Run `npm run mobile:android` |

## 🎊 You're Ready!

Everything is configured and ready to go. Just run:

```bash
# For iOS (Mac only):
npm run mobile:ios

# For Android:
npm run mobile:android
```

Your Chore Buster app will build and connect to your already-deployed backend at taskie.org!

---

**Need help?** Check these docs:
- Quick start: `QUICK_START_MOBILE.md`
- Complete guide: `MOBILE_BUILD_GUIDE.md`
- Architecture: `MOBILE_ARCHITECTURE.md`
- Deployment checklist: `MOBILE_DEPLOYMENT_CHECKLIST.md`
