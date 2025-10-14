# Mobile Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chore Buster Mobile App                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              React Frontend (Unchanged)                    │ │
│  │  - Parent Dashboard    - Child Dashboard                   │ │
│  │  - shadcn/ui          - TanStack Query                     │ │
│  │  - Wouter Router      - React Hook Form                    │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────────────┐ │
│  │           environment.ts (NEW)                            │ │
│  │  Detects: Web vs Mobile                                   │ │
│  │  Provides: API_BASE_URL, WS_URL                          │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │                                     │
│           ┌───────────────┴───────────────┐                    │
│           │                               │                    │
│  ┌────────▼────────┐          ┌──────────▼──────────┐        │
│  │  queryClient.ts │          │ universal-chat-     │         │
│  │  (UPDATED)      │          │ widget.tsx          │         │
│  │                 │          │ (UPDATED)           │         │
│  │ API Requests    │          │ WebSocket           │         │
│  └────────┬────────┘          └──────────┬──────────┘        │
└───────────┼───────────────────────────────┼───────────────────┘
            │                               │
            │ HTTP/HTTPS                    │ WS/WSS
            │                               │
┌───────────▼───────────────────────────────▼───────────────────┐
│                    Deployed Backend                            │
│                (Express + PostgreSQL)                          │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   REST API   │  │  WebSocket   │  │  Database    │        │
│  │   Routes     │  │  Chat        │  │  (Neon)      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
│  Hosted on: Replit / Railway / Render / Fly.io                │
└────────────────────────────────────────────────────────────────┘
```

## Request Flow Comparison

### Web Development Mode

```
┌──────────────┐
│   Browser    │
│ localhost:5000│
└──────┬───────┘
       │
       │ GET /api/user
       ▼
┌──────────────┐
│ Vite Dev     │ ← Proxy to backend
│ Server       │
└──────┬───────┘
       │
       │ Forward request
       ▼
┌──────────────┐
│ Express      │
│ Backend      │ ← Running locally
│ localhost:5000│
└──────────────┘

URL: /api/user (relative)
Result: Works with local backend
```

### Mobile App Mode

```
┌──────────────┐
│  iOS/Android │
│  Native App  │
└──────┬───────┘
       │
       │ API request detected
       ▼
┌──────────────┐
│environment.ts│
│ isCapacitor  │ ← Detects mobile context
│ = true       │
└──────┬───────┘
       │
       │ Returns absolute URL
       ▼
┌──────────────┐
│queryClient.ts│
│getAbsoluteUrl()│
└──────┬───────┘
       │
       │ GET https://backend.replit.app/api/user
       ▼
┌──────────────┐
│   Internet   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Deployed     │
│ Express      │ ← Running on Replit/Railway
│ Backend      │
└──────────────┘

URL: https://backend.replit.app/api/user (absolute)
Result: Works with deployed backend
```

## Environment Detection Logic

```typescript
// client/src/config/environment.ts

const isDevelopment = import.meta.env.DEV;
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

┌─────────────────────────────────────────────────┐
│ Environment Detection Decision Tree             │
└─────────────────────────────────────────────────┘

                    Start
                      │
                      ▼
              ┌───────────────┐
              │ Is Capacitor? │
              └───────┬───────┘
                      │
            ┌─────────┴─────────┐
            │                   │
         YES│                   │NO
            │                   │
            ▼                   ▼
    ┌──────────────┐    ┌──────────────┐
    │ Mobile App   │    │ Web Browser  │
    │              │    │              │
    │ Use:         │    │ Check Mode:  │
    │ VITE_API_URL │    │              │
    │ (Deployed    │    └──────┬───────┘
    │  Backend)    │           │
    └──────────────┘     ┌─────┴─────┐
                         │           │
                      DEV│           │PROD
                         │           │
                         ▼           ▼
                  ┌──────────┐ ┌──────────┐
                  │ Local    │ │ Deployed │
                  │ Server   │ │ Backend  │
                  │          │ │          │
                  │ Use:     │ │ Use:     │
                  │ window   │ │ VITE_    │
                  │.location │ │API_URL   │
                  │.origin   │ │          │
                  └──────────┘ └──────────┘
```

## API Call Transformation

### Before Capacitor Integration

```typescript
// All API calls were relative
fetch('/api/user')
fetch('/api/children')
fetch('/api/chores')

// WebSocket hardcoded
const ws = new WebSocket(`ws://localhost:5000/ws`)
```

### After Capacitor Integration

```typescript
// API calls are environment-aware
import { API_BASE_URL } from '@/config/environment'

// Automatically becomes:
// Web Dev:  http://localhost:5000/api/user
// Mobile:   https://backend.replit.app/api/user
fetch(getAbsoluteUrl('/api/user'))

// WebSocket is environment-aware
import { WS_URL } from '@/config/environment'

// Automatically becomes:
// Web Dev:  ws://localhost:5000/ws
// Mobile:   wss://backend.replit.app/ws
const ws = new WebSocket(WS_URL)
```

## Build Process Flow

```
┌────────────────────────────────────────────────────────────┐
│                    Development                             │
└────────────────────────────────────────────────────────────┘

npm run dev
    │
    ├─► Start Express server (port 5000)
    ├─► Start Vite dev server (proxy to Express)
    └─► Open browser → React app loads

    API calls use relative URLs (/api/...)
    WebSocket uses local connection (ws://localhost/ws)


┌────────────────────────────────────────────────────────────┐
│                  Mobile Build: iOS                         │
└────────────────────────────────────────────────────────────┘

npm run mobile:ios
    │
    ├─► npm run build:mobile
    │   │
    │   └─► vite build
    │       │
    │       └─► Creates dist/public/
    │           ├─ index.html
    │           ├─ assets/
    │           └─ ...
    │
    ├─► npx cap sync
    │   │
    │   ├─► Copies dist/public/ to ios/App/public/
    │   └─► Updates native dependencies
    │
    └─► npx cap open ios
        │
        └─► Opens Xcode project
            │
            ├─► Configure signing
            ├─► Select device/simulator
            └─► Click Run
                │
                └─► App launches on iOS device
                    │
                    ├─► Loads React app from local files
                    ├─► API calls use VITE_API_URL
                    └─► WebSocket connects to deployed backend


┌────────────────────────────────────────────────────────────┐
│                Mobile Build: Android                       │
└────────────────────────────────────────────────────────────┘

npm run mobile:android
    │
    ├─► npm run build:mobile
    │   │
    │   └─► vite build → dist/public/
    │
    ├─► npx cap sync
    │   │
    │   ├─► Copies dist/public/ to android/app/src/main/assets/
    │   └─► Updates native dependencies
    │
    └─► npx cap open android
        │
        └─► Opens Android Studio project
            │
            ├─► Select device/emulator
            └─► Click Run
                │
                └─► App launches on Android device
```

## Key Files and Their Roles

```
┌─────────────────────────────────────────────────────────┐
│ File                              Purpose               │
├─────────────────────────────────────────────────────────┤
│ capacitor.config.ts               App configuration     │
│                                   - App ID              │
│                                   - App name            │
│                                   - Web directory       │
├─────────────────────────────────────────────────────────┤
│ client/src/config/environment.ts  Smart URL routing     │
│                                   - Detects context     │
│                                   - Provides API URL    │
│                                   - Provides WS URL     │
├─────────────────────────────────────────────────────────┤
│ client/src/lib/queryClient.ts    API client layer      │
│                                   - Absolute URLs       │
│                                   - Credentials         │
├─────────────────────────────────────────────────────────┤
│ .env                              Configuration         │
│                                   - Backend URL         │
│                                   (Gitignored)          │
├─────────────────────────────────────────────────────────┤
│ ios/                              Native iOS project    │
│                                   (Generated)           │
├─────────────────────────────────────────────────────────┤
│ android/                          Native Android        │
│                                   project               │
│                                   (Generated)           │
└─────────────────────────────────────────────────────────┘
```

## Data Flow: Complete Example

### Example: Fetching User Profile

```
1. User opens mobile app
   │
   ▼
2. React component mounts
   │
   └─► useQuery(['/api/user'])
       │
       ▼
3. TanStack Query calls queryClient
   │
   └─► getQueryFn({ queryKey: ['/api/user'] })
       │
       ▼
4. queryClient constructs absolute URL
   │
   ├─► path = '/api/user'
   ├─► getAbsoluteUrl(path)
   │   │
   │   ├─► Import API_BASE_URL from environment.ts
   │   │   │
   │   │   └─► isCapacitor = true
   │   │       │
   │   │       └─► return process.env.VITE_API_URL
   │   │           = 'https://backend.replit.app'
   │   │
   │   └─► return 'https://backend.replit.app/api/user'
   │
   └─► fetch('https://backend.replit.app/api/user', {
         credentials: 'include'
       })
       │
       ▼
5. HTTP request over internet
   │
   └─► Reaches deployed Express backend
       │
       └─► isAuthenticated middleware
           │
           ├─► Checks session
           └─► Returns user data
               │
               ▼
6. Response travels back
   │
   └─► Mobile app receives JSON
       │
       └─► TanStack Query updates cache
           │
           └─► Component re-renders with data
               │
               └─► User sees their profile! 🎉
```

## Security Considerations

```
┌─────────────────────────────────────────────────────────┐
│               Mobile Security Architecture              │
└─────────────────────────────────────────────────────────┘

Client App (Mobile Device)
    │
    ├─► HTTPS Only (enforced by capacitor.config.ts)
    │   │
    │   └─► androidScheme: 'https'
    │
    ├─► Credentials Management
    │   │
    │   ├─► Current: Cookie-based (may not work reliably)
    │   └─► Recommended: JWT tokens
    │       │
    │       └─► Store in Capacitor Preferences (encrypted)
    │
    └─► Secure WebSocket (wss://)

Backend Server
    │
    ├─► CORS Configuration
    │   │
    │   ├─► Allow: capacitor://localhost
    │   ├─► Allow: http://localhost
    │   └─► Allow: ionic://localhost
    │
    ├─► Session Security
    │   │
    │   ├─► Secure cookies
    │   ├─► HttpOnly flag
    │   └─► SameSite policy
    │
    └─► Rate Limiting
        │
        └─► Prevent abuse
```

## Summary

**What You Built:**
- A hybrid mobile app using Capacitor
- 95% of your React code unchanged
- Smart environment detection
- Automatic URL routing
- Native iOS and Android wrappers

**How It Works:**
- Web mode: Uses local backend (relative URLs)
- Mobile mode: Uses deployed backend (absolute URLs)
- One codebase, three platforms (Web, iOS, Android)

**Next Steps:**
1. Deploy your Express backend
2. Configure `.env` with backend URL
3. Run `npm run mobile:ios` or `npm run mobile:android`
4. Test on device
5. Submit to App Store/Play Store

---

**Need Help?**
- 📖 Full guide: `MOBILE_BUILD_GUIDE.md`
- 🚀 Quick start: `QUICK_START_MOBILE.md`
- 📋 Summary: `CAPACITOR_IMPLEMENTATION_SUMMARY.md`
