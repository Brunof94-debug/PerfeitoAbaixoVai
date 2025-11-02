// From javascript_log_in_with_replit blueprint
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import passport from "passport";
import { Issuer, Strategy, type UserinfoResponse } from "openid-client";
import type { IStorage } from "./storage";
import type { User as DbUser } from "@shared/schema";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends DbUser {}
  }
}

export async function setupAuth(app: Express, storage: IStorage) {
  // Security: Only allow dev mode with explicit DEV_MODE=true flag
  const isDevelopmentMode = process.env.NODE_ENV === 'development' && process.env.DEV_MODE === 'true';
  const hasAuthCredentials = !!(process.env.CLIENT_ID && process.env.CLIENT_SECRET);
  const shouldSetupAuth = hasAuthCredentials;
  
  if (shouldSetupAuth) {
    try {
      const issuer = await Issuer.discover(
        process.env.ISSUER_URL ?? "https://replit.com/.well-known/openid-configuration"
      );

      const client = new issuer.Client({
        client_id: process.env.CLIENT_ID ?? "REPL_IDENTITY",
        client_secret: process.env.CLIENT_SECRET ?? "BOGUS",
      });

      passport.use(
        "oidc",
        new Strategy({ client }, async (tokenSet: any, userinfo: UserinfoResponse, done: any) => {
          try {
            const email = userinfo.email;
            if (!email) {
              return done(new Error("No email found in userinfo"), undefined);
            }

            let user = await storage.getUserByEmail(email);
            
            if (!user) {
              // Create new user
              user = await storage.upsertUser({
                email,
                firstName: userinfo.given_name,
                lastName: userinfo.family_name,
                profileImageUrl: userinfo.picture,
              });
            } else {
              // Update existing user
              user = await storage.upsertUser({
                id: user.id,
                email: user.email,
                firstName: userinfo.given_name || user.firstName,
                lastName: userinfo.family_name || user.lastName,
                profileImageUrl: userinfo.picture || user.profileImageUrl,
                subscriptionTier: user.subscriptionTier,
                tradingStyle: user.tradingStyle,
                stripeCustomerId: user.stripeCustomerId,
                stripeSubscriptionId: user.stripeSubscriptionId,
                createdAt: user.createdAt,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error, undefined);
          }
        })
      );

      passport.serializeUser((user, done) => {
        done(null, user.id);
      });

      passport.deserializeUser(async (id: string, done) => {
        try {
          const user = await storage.getUser(id);
          done(null, user);
        } catch (error) {
          done(error, undefined);
        }
      });

      app.get("/api/login", passport.authenticate("oidc"));

      app.get(
        "/api/login/callback",
        passport.authenticate("oidc", {
          successReturnToOrRedirect: "/",
          failureRedirect: "/",
        })
      );

      app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
          if (err) return next(err);
          req.session.destroy(() => {
            res.json({ ok: true });
          });
        });
      });
    } catch (error) {
      console.error("Failed to set up authentication:", error);
      
      // SECURITY: Log warnings but allow startup for deployment flexibility
      if (!isDevelopmentMode) {
        console.error("======================================================");
        console.error("WARNING: Authentication setup failed in production mode");
        console.error("The application will run but authentication is disabled");
        console.error("To enable authentication, configure:");
        console.error("  - CLIENT_ID (Replit Auth Client ID)");
        console.error("  - CLIENT_SECRET (Replit Auth Client Secret)");
        console.error("See replit.md for detailed setup instructions");
        console.error("======================================================");
      } else {
        console.warn("WARNING: Running in development mode without authentication");
        console.warn("Set DEV_MODE=true to explicitly enable this mode");
      }
    }
  }
  
  // SECURITY: Log warnings but allow startup for deployment flexibility
  if (!shouldSetupAuth && !isDevelopmentMode) {
    console.warn("======================================================");
    console.warn("NOTICE: No authentication configured");
    console.warn("Running in production mode WITHOUT authentication");
    console.warn("To enable authentication, set:");
    console.warn("  - CLIENT_ID (Replit Auth Client ID)");
    console.warn("  - CLIENT_SECRET (Replit Auth Client Secret)");
    console.warn("See replit.md for detailed setup instructions");
    console.warn("======================================================");
  }

  // Session middleware (needed for both auth and non-auth modes)
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Fallback routes for when auth is not configured (development mode)
  if (!shouldSetupAuth) {
    app.get("/api/login", (req, res) => {
      res.redirect("/");
    });

    app.post("/api/logout", (req, res) => {
      res.json({ ok: true });
    });
  }

  // Middleware to inject demo/guest user when auth is not configured
  if (!shouldSetupAuth) {
    app.use(async (req, _res, next) => {
      if (!req.user) {
        // In development, use demo user with Pro tier for full feature testing
        // In production, use guest user with Basic tier (limited features)
        const userId = isDevelopmentMode ? "demo-user-1" : "guest-user-1";
        const userTier = isDevelopmentMode ? "pro" : "basic";
        const userEmail = isDevelopmentMode ? "demo@cryptosignal.ai" : "guest@cryptosignal.ai";
        const userName = isDevelopmentMode ? "Demo" : "Guest";
        
        try {
          // Fetch user from database (or create if doesn't exist)
          let user = await db.query.users.findFirst({
            where: eq(users.id, userId)
          });
          
          if (!user) {
            console.log(`[${userName} User] Creating ${userName.toLowerCase()} user in database`);
            const userData = {
              id: userId,
              email: userEmail,
              firstName: userName,
              lastName: "User",
              profileImageUrl: null,
              subscriptionTier: userTier as const,
              tradingStyle: "swing_trade" as const,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
            };
            const [created] = await db.insert(users).values(userData).returning();
            user = created;
          }
          
          // @ts-ignore - Adding user from database to request
          req.user = user;
        } catch (error) {
          console.error(`[${userName} User] Error loading ${userName.toLowerCase()} user:`, error);
          // Fallback to static user if database query fails
          // @ts-ignore
          req.user = {
            id: userId,
            email: userEmail,
            firstName: userName,
            lastName: "User",
            profileImageUrl: null,
            subscriptionTier: userTier,
            tradingStyle: "swing_trade",
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }
      next();
    });
  }
  
  // Always provide /api/auth/user endpoint
  app.get("/api/auth/user", async (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.json(req.user);
    }
    
    // When auth is not configured, return demo/guest user
    if (!shouldSetupAuth) {
      const userId = isDevelopmentMode ? "demo-user-1" : "guest-user-1";
      console.log(`Returning ${isDevelopmentMode ? 'demo' : 'guest'} user from database`);
      
      // Fetch the latest user data from database
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId)
        });
        
        if (user) {
          return res.json(user);
        }
        
        // Fallback if user doesn't exist in DB yet
        const fallbackUser = {
          id: userId,
          email: isDevelopmentMode ? "demo@cryptosignal.ai" : "guest@cryptosignal.ai",
          firstName: isDevelopmentMode ? "Demo" : "Guest",
          lastName: "User",
          profileImageUrl: null,
          subscriptionTier: isDevelopmentMode ? "pro" : "basic",
          tradingStyle: "swing_trade",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return res.json(fallbackUser);
      } catch (error) {
        console.error('[User] Error fetching user:', error);
        return res.status(500).json({ error: 'Failed to fetch user data' });
      }
    }
    
    res.status(401).send("401: Unauthorized");
  });
  
  // Authentication status endpoint
  app.get("/api/auth/status", (req, res) => {
    res.json({
      configured: shouldSetupAuth,
      authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      mode: isDevelopmentMode ? "development" : "production",
      guestMode: !shouldSetupAuth,
    });
  });
}