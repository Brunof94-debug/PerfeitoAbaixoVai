// From javascript_log_in_with_replit blueprint
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import passport from "passport";
import { Issuer, Strategy, type UserinfoResponse } from "openid-client";
import type { IStorage } from "./storage";
import type { User } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends User {}
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
        new Strategy({ client }, async (tokenSet, userinfo: UserinfoResponse, done) => {
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
      
      // SECURITY: Only allow fallback in explicit development mode
      if (!isDevelopmentMode) {
        console.error("CRITICAL: Authentication setup failed in production mode. Application will not start.");
        console.error("Ensure CLIENT_ID and CLIENT_SECRET are properly configured.");
        process.exit(1); // Exit to prevent running without auth in production
      }
      
      console.warn("WARNING: Running in development mode without authentication");
      console.warn("Set DEV_MODE=true to explicitly enable this mode");
    }
  }
  
  // SECURITY: If no auth and not in dev mode, block startup
  if (!shouldSetupAuth && !isDevelopmentMode) {
    console.error("CRITICAL: No authentication configured and not in development mode.");
    console.error("Set CLIENT_ID and CLIENT_SECRET environment variables, or set DEV_MODE=true for local development.");
    process.exit(1);
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

  // Always provide /api/auth/user endpoint
  app.get("/api/auth/user", async (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.json(req.user);
    }
    
    // SECURITY: Only allow demo user in explicit development mode
    if (isDevelopmentMode && !shouldSetupAuth) {
      console.log("DEV MODE: Returning demo user");
      const demoUser = {
        id: "demo-user-1",
        email: "demo@cryptosignal.ai",
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null,
        subscriptionTier: "pro",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return res.json(demoUser);
    }
    
    res.status(401).send("401: Unauthorized");
  });
}