import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertWatchlistSchema, insertAlertSchema, insertSignalSchema, insertBacktestSchema } from "@shared/schema";
import OpenAI from "openai";
import pRetry from "p-retry";
import { 
  fetchCryptoDataCached, 
  fetchSingleCryptoCached, 
  fetchOHLCDataCached,
  getCacheStats,
  clearAllCaches
} from "./cache";
import { registerAlertClient, startAlertMonitor } from "./alert-monitor";
import { runBacktest } from "./backtesting-engine";
import { stripe, createCheckoutSession, createBillingPortalSession, getCustomerByUserId } from "./stripe";

// Initialize OpenAI client (using Replit AI Integrations)
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Helper: Calculate simple technical indicators (mock for MVP)
function calculateIndicators(prices: number[]) {
  if (!prices || prices.length === 0) return {};
  
  const current = prices[prices.length - 1];
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  // Simple RSI approximation
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
  const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return {
    rsi: Math.round(rsi * 100) / 100,
    sma: Math.round(avg * 100) / 100,
    price: current,
    momentum: changes[changes.length - 1] > 0 ? 'bullish' : 'bearish',
  };
}

// Helper: Generate AI trading signal using OpenAI
async function generateAISignal(crypto: any) {
  try {
    // Get price history (mock data for MVP - in production, fetch real OHLCV data)
    const mockPrices = Array.from({ length: 14 }, (_, i) => {
      const volatility = crypto.price_change_percentage_24h / 100;
      return crypto.current_price * (1 + (Math.random() - 0.5) * volatility);
    });
    
    const indicators = calculateIndicators(mockPrices);
    
    const prompt = `You are a professional cryptocurrency trading analyst. Analyze the following data and provide a trading signal.

Cryptocurrency: ${crypto.name} (${crypto.symbol.toUpperCase()})
Current Price: $${crypto.current_price}
24h Change: ${crypto.price_change_percentage_24h}%
7d Change: ${crypto.price_change_percentage_7d_in_currency}%
Market Cap: $${crypto.market_cap}
Volume (24h): $${crypto.total_volume}

Technical Indicators:
- RSI: ${indicators.rsi}
- SMA: $${indicators.sma}
- Momentum: ${indicators.momentum}

Provide a trading signal in exactly this JSON format (no markdown, just valid JSON):
{
  "signal": "buy" | "sell" | "watch",
  "confidence": <number 0-100>,
  "rationale": "<brief 2-3 sentence analysis explaining the signal>",
  "timeframe": "1h" | "4h" | "1d"
}

Be concise and actionable. Consider price action, momentum, and technical indicators.`;

    const completion = await pRetry(
      async () => {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional cryptocurrency trading analyst. Always respond with valid JSON only, no markdown formatting.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
        });
        return response;
      },
      {
        retries: 3,
        minTimeout: 1000,
      }
    );

    const content = completion.choices[0]?.message?.content || "{}";
    
    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiResponse = JSON.parse(jsonContent);

    return {
      cryptoId: crypto.id,
      cryptoSymbol: crypto.symbol,
      cryptoName: crypto.name,
      signalType: aiResponse.signal || 'watch',
      confidence: Math.min(100, Math.max(0, aiResponse.confidence || 50)),
      price: crypto.current_price,
      rationale: aiResponse.rationale || 'Analysis based on current market conditions.',
      timeframe: aiResponse.timeframe || '1h',
      indicators,
      modelVersion: 'gpt-4o-mini',
    };
  } catch (error) {
    console.error('Error generating AI signal:', error);
    // Fallback signal
    const indicators = calculateIndicators([crypto.current_price]);
    return {
      cryptoId: crypto.id,
      cryptoSymbol: crypto.symbol,
      cryptoName: crypto.name,
      signalType: 'watch' as const,
      confidence: 50,
      price: crypto.current_price,
      rationale: 'Unable to generate AI signal at this time. Please try again later.',
      timeframe: '1h',
      indicators,
      modelVersion: 'fallback',
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (from javascript_log_in_with_replit blueprint)
  setupAuth(app, storage);

  // ==================== CRYPTO DATA ENDPOINTS ====================
  
  // Get top cryptocurrencies
  app.get("/api/cryptos/top", async (req, res) => {
    try {
      const result = await fetchCryptoDataCached(20);
      
      // Check if stale data was returned
      if (result && result.isStale) {
        res.set('X-Data-Stale', 'true');
        res.set('X-Cache-Warning', 'Showing cached data due to rate limiting');
        return res.json(result.data);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching top cryptos:', error);
      
      // If rate limit, return specific error
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to fetch cryptocurrency data' });
    }
  });

  // Get all cryptocurrencies with pagination
  app.get("/api/cryptos", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const result = await fetchCryptoDataCached(limit);
      
      // Check if stale data was returned
      if (result && result.isStale) {
        res.set('X-Data-Stale', 'true');
        res.set('X-Cache-Warning', 'Showing cached data due to rate limiting');
        return res.json(result.data);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching cryptos:', error);
      
      // If rate limit, return specific error
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to fetch cryptocurrency data' });
    }
  });

  // Get single cryptocurrency by ID
  app.get("/api/cryptos/:id", async (req, res) => {
    try {
      const result = await fetchSingleCryptoCached(req.params.id);
      
      // Check if stale data was returned
      if (result && result.isStale) {
        res.set('X-Data-Stale', 'true');
        res.set('X-Cache-Warning', 'Showing cached data due to rate limiting');
        // Remove isStale property before sending
        const { isStale, ...crypto } = result;
        return res.json(crypto);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching crypto:', error);
      
      // If rate limit, return specific error
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        return;
      }
      
      res.status(404).json({ error: 'Cryptocurrency not found' });
    }
  });

  // Get historical OHLC data for charting
  app.get("/api/cryptos/:id/ohlc", async (req, res) => {
    try {
      const { id } = req.params;
      const days = (req.query.days as string) || '1'; // 1, 7, 30, 90, 365
      
      // Fetch OHLC data from CoinGecko (cached)
      const result = await fetchOHLCDataCached(id, days);
      
      // Check if stale data was returned
      let dataToFormat = result;
      if (result && result.isStale) {
        res.set('X-Data-Stale', 'true');
        res.set('X-Cache-Warning', 'Showing cached data due to rate limiting');
        dataToFormat = result.data;
      }
      
      // CoinGecko returns array of [timestamp, open, high, low, close]
      const formatted = dataToFormat.map((candle: number[]) => ({
        time: candle[0] / 1000, // Convert to seconds for lightweight-charts
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
      }));
      
      res.json(formatted);
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      
      // If rate limit, return specific error
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to fetch historical data' });
    }
  });

  // ==================== SIGNALS ENDPOINTS ====================
  
  // Get all signals
  app.get("/api/signals", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const signals = await storage.getAllSignals(limit);
      res.json(signals);
    } catch (error) {
      console.error('Error fetching signals:', error);
      res.status(500).json({ error: 'Failed to fetch signals' });
    }
  });

  // Get recent signals
  app.get("/api/signals/recent", async (req, res) => {
    try {
      const signals = await storage.getRecentSignals(10);
      res.json(signals);
    } catch (error) {
      console.error('Error fetching recent signals:', error);
      res.status(500).json({ error: 'Failed to fetch recent signals' });
    }
  });

  // Get signals for a specific crypto
  app.get("/api/signals/crypto/:cryptoId", async (req, res) => {
    try {
      const signals = await storage.getSignalsByCrypto(req.params.cryptoId);
      res.json(signals);
    } catch (error) {
      console.error('Error fetching crypto signals:', error);
      res.status(500).json({ error: 'Failed to fetch signals for cryptocurrency' });
    }
  });

  // Generate a new AI signal for a cryptocurrency (admin or cron job)
  app.post("/api/signals/generate/:cryptoId", async (req, res) => {
    try {
      const crypto = await fetchSingleCryptoCached(req.params.cryptoId);
      const signalData = await generateAISignal({
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        current_price: crypto.market_data.current_price.usd,
        price_change_percentage_24h: crypto.market_data.price_change_percentage_24h,
        price_change_percentage_7d_in_currency: crypto.market_data.price_change_percentage_7d,
        market_cap: crypto.market_data.market_cap.usd,
        total_volume: crypto.market_data.total_volume.usd,
      });
      
      const signal = await storage.createSignal(signalData);
      res.json(signal);
    } catch (error) {
      console.error('Error generating signal:', error);
      res.status(500).json({ error: 'Failed to generate trading signal' });
    }
  });

  // ==================== WATCHLIST ENDPOINTS ====================
  
  // Get user's watchlist (requires auth)
  app.get("/api/watchlist", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const watchlistItems = await storage.getWatchlistByUser(req.user.id);
      res.json(watchlistItems);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  });

  // Add to watchlist
  app.post("/api/watchlist", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const data = insertWatchlistSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      // Check if already in watchlist
      const exists = await storage.isInWatchlist(req.user.id, data.cryptoId);
      if (exists) {
        return res.status(400).json({ error: 'Already in watchlist' });
      }
      
      const item = await storage.addToWatchlist(data);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error('Error adding to watchlist:', error);
      res.status(500).json({ error: 'Failed to add to watchlist' });
    }
  });

  // Remove from watchlist
  app.delete("/api/watchlist/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      await storage.removeFromWatchlist(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
  });

  // ==================== ALERTS ENDPOINTS ====================
  
  // Get user's alerts
  app.get("/api/alerts", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const userAlerts = await storage.getAlertsByUser(req.user.id);
      res.json(userAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Create alert
  app.post("/api/alerts", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const data = insertAlertSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const alert = await storage.createAlert(data);
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error('Error creating alert:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  // Update alert
  app.patch("/api/alerts/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      await storage.updateAlert(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating alert:', error);
      res.status(500).json({ error: 'Failed to update alert' });
    }
  });

  // Delete alert
  app.delete("/api/alerts/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      await storage.deleteAlert(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting alert:', error);
      res.status(500).json({ error: 'Failed to delete alert' });
    }
  });

  // ==================== BACKTESTS ENDPOINTS ====================
  
  // Get user's backtests
  app.get("/api/backtests", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const backtestResults = await storage.getBacktestsByUser(req.user.id);
      res.json(backtestResults);
    } catch (error) {
      console.error('Error fetching backtests:', error);
      res.status(500).json({ error: 'Failed to fetch backtests' });
    }
  });

  // Create backtest
  app.post("/api/backtests", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const data = insertBacktestSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const backtest = await storage.createBacktest(data);
      
      // Run backtest in background (async processing)
      (async () => {
        try {
          // Run real backtesting engine
          const results = await runBacktest(data);
          
          await storage.updateBacktest(backtest.id, {
            status: 'completed',
            results,
            completedAt: new Date(),
          });
        } catch (error) {
          console.error('Error running backtest:', error);
          await storage.updateBacktest(backtest.id, {
            status: 'failed',
          });
        }
      })();
      
      res.json(backtest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error('Error creating backtest:', error);
      res.status(500).json({ error: 'Failed to create backtest' });
    }
  });

  // ==================== STRIPE ENDPOINTS ====================
  
  // Create Stripe checkout session for subscription upgrade
  app.post("/api/subscription/create-checkout", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const { tier } = req.body;
      
      if (!['pro', 'expert'].includes(tier)) {
        return res.status(400).json({ error: 'Invalid tier' });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const successUrl = `${baseUrl}/subscription?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/subscription`;
      
      const session = await createCheckoutSession(
        req.user.id,
        req.user.email,
        tier as 'pro' | 'expert',
        successUrl,
        cancelUrl
      );
      
      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });
  
  // Create billing portal session for managing subscription
  app.post("/api/subscription/create-portal", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      // Find customer by user ID
      const customer = await getCustomerByUserId(req.user.id);
      
      if (!customer) {
        return res.status(404).json({ error: 'No active subscription found' });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const returnUrl = `${baseUrl}/subscription`;
      
      const session = await createBillingPortalSession(customer.id, returnUrl);
      
      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      res.status(500).json({ error: 'Failed to create billing portal session' });
    }
  });
  
  // Stripe webhook for subscription events
  app.post("/api/subscription/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }
    
    try {
      // Use rawBody for webhook signature verification
      const event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      // Handle subscription events
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;
          
          if (userId && tier) {
            // Retrieve full session to get customer and subscription IDs
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['subscription', 'customer'],
            });
            
            const customerId = typeof fullSession.customer === 'string' 
              ? fullSession.customer 
              : fullSession.customer?.id;
            const subscriptionId = typeof fullSession.subscription === 'string'
              ? fullSession.subscription
              : fullSession.subscription?.id;
            
            // Update customer metadata with userId
            if (customerId) {
              await stripe.customers.update(customerId, {
                metadata: { userId },
              });
            }
            
            // Update user subscription tier and IDs in database
            await storage.updateUserSubscription(userId, tier, customerId, subscriptionId);
            console.log(`[Stripe] Updated user ${userId} to tier: ${tier}, customer: ${customerId}`);
          }
          break;
        }
        
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          const customer = await stripe.customers.retrieve(subscription.customer);
          
          if (customer && !customer.deleted && customer.metadata?.userId) {
            const userId = customer.metadata.userId;
            
            // If subscription is cancelled or incomplete, downgrade to basic
            if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
              await storage.updateUserSubscription(userId, 'basic');
              console.log(`[Stripe] Downgraded user ${userId} to basic`);
            }
          }
          break;
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({ error: 'Webhook error' });
    }
  });

  // WebSocket authentication tokens (temporary nonces)
  const wsTokens = new Map<string, { userId: string; expiresAt: number }>();
  
  // Clean up expired tokens every minute
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of wsTokens.entries()) {
      if (data.expiresAt < now) {
        wsTokens.delete(token);
      }
    }
  }, 60000);

  // Generate WebSocket authentication token
  app.get("/api/auth/ws-token", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Generate random token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    wsTokens.set(token, {
      userId: req.user.id,
      expiresAt,
    });
    
    res.json({ token, expiresAt });
  });

  // ==================== WEBSOCKET SERVER ====================
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections
  const connections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] New connection');
    
    let authenticatedUserId: string | null = null;
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication - validate token
        if (data.type === 'auth' && data.token) {
          const tokenData = wsTokens.get(data.token);
          
          if (!tokenData) {
            ws.send(JSON.stringify({
              type: 'auth-error',
              error: 'Invalid or expired token',
            }));
            ws.close();
            return;
          }
          
          if (tokenData.expiresAt < Date.now()) {
            wsTokens.delete(data.token);
            ws.send(JSON.stringify({
              type: 'auth-error',
              error: 'Token expired',
            }));
            ws.close();
            return;
          }
          
          // Token is valid - extract userId
          authenticatedUserId = tokenData.userId;
          wsTokens.delete(data.token); // One-time use
          
          registerAlertClient(ws, authenticatedUserId);
          console.log(`[WebSocket] Client authenticated for user: ${authenticatedUserId}`);
          ws.send(JSON.stringify({
            type: 'auth-success',
            userId: authenticatedUserId,
          }));
          return;
        }
        
        if (data.type === 'subscribe' && data.cryptoId) {
          // Subscribe to crypto price updates
          if (!connections.has(data.cryptoId)) {
            connections.set(data.cryptoId, new Set());
          }
          connections.get(data.cryptoId)!.add(ws);
          
          ws.send(JSON.stringify({
            type: 'subscribed',
            cryptoId: data.cryptoId,
          }));
        }
        
        if (data.type === 'unsubscribe' && data.cryptoId) {
          // Unsubscribe from crypto price updates
          connections.get(data.cryptoId)?.delete(ws);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection from all subscriptions
      connections.forEach((set) => set.delete(ws));
    });
  });
  
  // Start alert monitoring
  startAlertMonitor();

  // Simulate price updates (in production, this would be real-time data feed)
  setInterval(async () => {
    for (const [cryptoId, clients] of connections.entries()) {
      if (clients.size === 0) continue;
      
      try {
        const crypto = await fetchSingleCryptoCached(cryptoId);
        const update = {
          type: 'price_update',
          cryptoId,
          price: crypto.market_data.current_price.usd,
          change24h: crypto.market_data.price_change_percentage_24h,
          timestamp: Date.now(),
        };
        
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(update));
          }
        });
      } catch (error) {
        console.error(`Error fetching price for ${cryptoId}:`, error);
      }
    }
  }, 30000); // Update every 30 seconds

  // ==================== CACHE MANAGEMENT ====================
  
  // Get cache statistics
  app.get("/api/cache/stats", (req, res) => {
    const stats = getCacheStats();
    res.json({
      ...stats,
      configuration: {
        singleCryptoTTL: '30 seconds',
        cryptoListTTL: '3 minutes',
        ohlcTTL: '3 minutes',
        maxSize: 100,
      },
    });
  });

  // Clear all caches (admin only in production)
  app.post("/api/cache/clear", (req, res) => {
    clearAllCaches();
    res.json({ success: true, message: 'All caches cleared' });
  });

  return httpServer;
}