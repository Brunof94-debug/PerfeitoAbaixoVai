# CryptoSignal AI - Cryptocurrency Trading Platform

## Overview

CryptoSignal AI is a professional-grade cryptocurrency trading platform that provides AI-powered trading signals, real-time market analysis, and comprehensive trading tools. The platform combines machine learning algorithms with technical analysis to deliver actionable trading insights for Bitcoin, Ethereum, and 1000+ cryptocurrencies.

**Core Capabilities:**
- AI-generated trading signals with confidence scores
- Real-time price tracking via WebSocket connections
- Technical indicator analysis (RSI, MACD, EMA, Bollinger Bands, VWAP)
- Strategy backtesting with performance metrics
- Custom price alerts and notifications
- Personal cryptocurrency watchlists
- Tiered subscription system (Basic, Pro, Expert)

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
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API endpoint
- `CLIENT_ID` - Replit Auth client ID
- `CLIENT_SECRET` - Replit Auth client secret
- `NODE_ENV` - Environment mode (development/production)
- `DEV_MODE` - Enable development features (true/false)