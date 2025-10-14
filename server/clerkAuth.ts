import { createClerkClient } from "@clerk/clerk-sdk-node";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.CLERK_SECRET_KEY || 'fallback-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Middleware to sync Clerk users with our database
  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const verifiedToken = await clerkClient.verifyToken(token);

        if (verifiedToken && verifiedToken.sub) {
          // Get full user details from Clerk
          const clerkUser = await clerkClient.users.getUser(verifiedToken.sub);

          // Sync user to our database
          await storage.upsertUser({
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            profileImageUrl: clerkUser.imageUrl || '',
          });

          // Attach user info to request
          req.user = {
            claims: { sub: clerkUser.id },
            id: clerkUser.id,
          };
        }
      } catch (error) {
        console.error('Clerk token verification failed:', error);
      }
    }
    next();
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.user || !req.user.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
