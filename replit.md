# CryptoSignal AI - Cryptocurrency Trading Platform

## Overview

CryptoSignal AI is a professional-grade cryptocurrency trading platform that provides AI-powered trading signals, real-time market analysis, and comprehensive trading tools. The platform combines machine learning algorithms with technical analysis to deliver actionable trading insights for Bitcoin, Ethereum, and 1000+ cryptocurrencies.

**Core Capabilities:**
- AI-generated trading signals with confidence scores
- **Customizable trading strategies** (Scalping: 1m-15m, Day Trade: 15m-4h, Swing Trade: 4h-3d, Position: 1d-1w)
- Real-time price tracking via WebSocket connections
- Technical indicator analysis (RSI, MACD, EMA, Bollinger Bands, VWAP)
- Strategy backtesting with performance metrics
- Custom price alerts and notifications
- Personal cryptocurrency watchlists
- Tiered subscription system (Basic, Pro, Expert)
- Market analytics dashboard
- Error boundaries for graceful error handling
- Stripe payment integration for subscriptions
- Offline mode detection
- Comprehensive loading states and skeleton screens

**Recent Improvements (November 2025):**
- ✅ **ALL 12 IMPROVEMENTS COMPLETED SUCCESSFULLY**
- ✅ Demo user middleware with automatic database creation
- ✅ E2E testing framework fully functional with Playwright
- ✅ Backtest creation flow working end-to-end
- ✅ Fixed multiple issues: API signatures, date handling, schema validation, database constraints
- ✅ **Trading Style Preferences System (Completed November 2, 2025)**
  - Users can select trading strategy: Scalping, Day Trade, Swing Trade, or Position
  - Preferences persist in database across sessions
  - AI signals adapt based on selected trading style (timeframes and analysis)
  - Real-time UI updates with proper cache invalidation
  - Fixed demo user middleware to load from database instead of hardcoded values
- ✅ **Deployment & Authentication Improvements (November 2, 2025)**
  - Fixed blocking process.exit() calls that prevented deployment
  - Added guest user mode for production deployments without authentication
  - Application now deploys successfully with or without authentication configured
  - Added /api/auth/status endpoint to check authentication configuration
  - Clear console warnings when authentication is not configured

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React with TypeScript (Vite build system)
- Wouter for client-side routing
- TanStack Query for server state management and caching
- shadcn/ui component library (Radix UI primitives)
- Tailwind CSS for styling with custom design system

**Design Philosophy:**
The application follows a "data-rich fintech aesthetic" inspired by TradingView, Robinhood, and Stripe. Key principles include:
- Information density with clarity over decoration
- Hierarchical visual weight correlating with signal confidence
- Mobile-first responsive design
- Typography: Inter for UI, JetBrains Mono for numerical data
- Dark mode support with theme provider

**State Management Strategy:**
- Server state: TanStack Query with aggressive caching (staleTime: Infinity)
- Real-time updates: WebSocket connection for live price feeds
- Authentication state: Query-based user session management
- Form state: React Hook Form with Zod validation

**Key Frontend Patterns:**
- Component composition with shadcn/ui primitives
- Custom hooks for cross-cutting concerns (useAuth, useWebSocket, useToast)
- Path aliases (@/ for client, @shared/ for shared types)
- Optimistic updates for watchlist/alert mutations

### Backend Architecture

**Runtime & Framework:**
- Node.js with Express server
- TypeScript throughout (ESM modules)
- Session-based authentication with Passport.js

**API Design:**
RESTful endpoints organized by domain:
- `/api/auth/*` - Authentication (Replit OIDC)
- `/api/cryptos/*` - Cryptocurrency data and OHLC charts
- `/api/signals/*` - AI-generated trading signals
- `/api/watchlist/*` - User watchlist management
- `/api/alerts/*` - Price alert configuration
- `/api/backtests/*` - Strategy backtesting

**WebSocket Implementation:**
Real-time price updates broadcast to connected clients with automatic reconnection logic. Clients subscribe to specific symbols and receive periodic price/change updates.

**AI Signal Generation:**
Uses OpenAI API (via Replit AI Integrations) to analyze market data and generate trading signals. The system:
1. Fetches historical price data from CoinGecko
2. Calculates technical indicators (RSI, MACD, moving averages)
3. Sends structured prompts to GPT-4 for signal generation
4. Returns signals with type (buy/sell/watch), confidence %, and rationale
5. Implements retry logic with exponential backoff for reliability

### Data Storage

**Database:**
- PostgreSQL via Neon serverless driver
- Drizzle ORM for type-safe database access
- Connection pooling for performance

**Schema Design:**

*Authentication Tables:*
- `sessions` - Express session storage (required for Replit Auth)
- `users` - User profiles with subscription tier tracking

*Application Tables:*
- `watchlist` - User's tracked cryptocurrencies
- `signals` - AI-generated trading signals with metadata
- `alerts` - User-configured price alerts with trigger conditions
- `backtests` - Historical strategy test results

**Key Schema Decisions:**
- UUID primary keys for security and distribution
- Cascade deletes for user-owned resources
- JSONB fields for flexible metadata storage (indicators, results)
- Timestamp tracking (createdAt, updatedAt) for audit trails
- Subscription tier stored on user record (basic/pro/expert)

### Authentication & Authorization

**Authentication Flow:**
- OpenID Connect (OIDC) via Replit Auth integration
- Passport.js strategy for OAuth2 flow
- Session-based state management (not JWT)
- In-memory session store (production should use PostgreSQL store via connect-pg-simple)

**User Management:**
- Automatic user creation on first login
- Profile syncing from OIDC provider (email, name, avatar)
- Email-based user identification

**Authorization:**
Feature access controlled by subscription tier:
- Basic: Limited signals, watchlist, basic indicators
- Pro: Unlimited signals, advanced indicators, backtesting
- Expert: Full platform access, API access, priority support

### External Dependencies

**Third-Party APIs:**

*CoinGecko API (Free Tier):*
- Market data for 1000+ cryptocurrencies
- Real-time prices and 24h/7d price changes
- Historical OHLC data for charting
- Market cap, volume, supply data
- Rate limiting considerations (2-second delays in seed script)

*OpenAI API (via Replit AI Integrations):*
- GPT-4 for signal generation and market analysis
- Structured prompts with technical indicator data
- Retry logic for reliability (p-retry library)
- Environment variables: AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL

*Replit Authentication:*
- OIDC provider for user authentication
- Environment variables: CLIENT_ID, CLIENT_SECRET, ISSUER_URL
- Automatic user profile synchronization

**Key Libraries:**

*Frontend:*
- lightweight-charts - TradingView-quality candlestick charts
- technicalindicators - RSI, MACD, EMA, Bollinger Bands calculations
- date-fns - Date formatting and manipulation
- zod - Runtime schema validation
- react-hook-form - Form state management

*Backend:*
- ws - WebSocket server implementation
- express-session - Session middleware
- drizzle-orm - Type-safe database queries
- openid-client - OIDC authentication
- p-retry - Resilient API calls

**Payment Integration (Stripe):**
Dependencies present (@stripe/stripe-js, @stripe/react-stripe-js) but implementation incomplete. Subscription management currently stored in database only.

**Development Tools:**
- Vite with HMR for development
- esbuild for production server bundling
- Drizzle Kit for database migrations
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)

**Environment Configuration:**

*Required Environment Variables:*
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key (auto-configured via AI integration)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API endpoint (auto-configured via AI integration)
- `SESSION_SECRET` - Secret for session encryption (auto-generated by Replit)
- `STRIPE_SECRET_KEY` - Stripe API secret key (required for payments)

*Optional Environment Variables (Authentication):*
- `CLIENT_ID` - Replit Auth client ID (optional, enables user authentication)
- `CLIENT_SECRET` - Replit Auth client secret (optional, enables user authentication)
- `ISSUER_URL` - OIDC issuer URL (defaults to Replit's OIDC endpoint)

*Development Environment Variables:*
- `NODE_ENV` - Environment mode (development/production)
- `DEV_MODE` - Enable development features with demo user (set to "true" for local testing)

## Deployment Guide

### Production Deployment (Publishing)

The application can be deployed with or without authentication configured:

**Option 1: Deploy with Guest Mode (No Authentication)**
1. Click "Publish" in Replit
2. Application will run with a guest user (Basic tier features only)
3. Check `/api/auth/status` to verify authentication status
4. Console will show warnings about missing authentication

**Option 2: Deploy with Full Authentication**
1. Configure Replit Auth credentials:
   - Set `CLIENT_ID` secret in Replit Secrets pane
   - Set `CLIENT_SECRET` secret in Replit Secrets pane
2. Click "Publish" in Replit
3. Application will require users to log in with Replit Auth
4. Full feature access based on user subscription tier

**Authentication Status Endpoint:**
Check `/api/auth/status` to see current authentication configuration:
```json
{
  "configured": true|false,
  "authenticated": true|false,
  "mode": "development"|"production",
  "guestMode": true|false
}
```

### Development vs Production Modes

**Development Mode (DEV_MODE=true):**
- Demo user with Pro tier access (full features for testing)
- No authentication required
- Email: demo@cryptosignal.ai
- User ID: demo-user-1

**Production Mode (without authentication):**
- Guest user with Basic tier access (limited features)
- No authentication required
- Email: guest@cryptosignal.ai
- User ID: guest-user-1

**Production Mode (with authentication):**
- Users must log in with Replit Auth
- Access based on subscription tier (Basic/Pro/Expert)
- Full user profile management