# Crypto Analysis Platform - Design Guidelines

## Design Approach

**Hybrid Strategy**: Combining TradingView's data-rich interfaces + Robinhood's clean fintech aesthetic + Stripe's professional restraint. Focus on information density with clarity, building trust through visual consistency and professional polish.

## Core Design Principles

1. **Data Clarity Over Decoration**: Every element serves the user's analysis needs
2. **Hierarchical Confidence**: Visual weight correlates with signal importance/confidence
3. **Instant Comprehension**: Critical information (price changes, signals) understood at a glance
4. **Mobile-First Density**: Pack information efficiently without sacrificing usability on small screens

---

## Typography System

### Font Families
- **Primary**: Inter (system-ui fallback) - body text, labels, data
- **Monospace**: JetBrains Mono - prices, percentages, numerical data
- **Display**: Inter SemiBold - headlines, section titles

### Type Scale
- **Hero/Landing**: text-5xl (mobile) → text-7xl (desktop), font-bold
- **Section Headers**: text-3xl, font-semibold
- **Card Titles**: text-xl, font-semibold
- **Data Labels**: text-sm, font-medium, uppercase tracking-wide
- **Primary Content**: text-base
- **Metadata/Timestamps**: text-xs, opacity-70
- **Prices/Numbers**: text-lg to text-2xl, font-mono, font-semibold
- **Signal Confidence**: text-4xl, font-mono (percentage display)

---

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 3, 4, 6, 8, 12, 16, 24** for consistent rhythm

- **Component padding**: p-4 (mobile), p-6 (tablet), p-8 (desktop)
- **Section gaps**: gap-6 (mobile), gap-8 (desktop)
- **Card spacing**: p-4 to p-6
- **Tight groupings**: gap-2
- **Related items**: gap-4
- **Section margins**: my-12 (mobile), my-16 to my-24 (desktop)

### Grid Structures
```
Mobile (base): Single column, max-w-full
Tablet (md:): 2-column grids for cards/signals
Desktop (lg:): 3-4 column grids for dashboards
Wide (xl:): Side navigation + main content (sidebar: 280px)
```

### Container Strategy
- **Full-width sections**: w-full with inner max-w-7xl mx-auto px-4
- **Content sections**: max-w-6xl
- **Reading content**: max-w-3xl
- **Dashboard panels**: Full bleed with internal padding

---

## Component Library

### Navigation
**Top Bar** (sticky, backdrop-blur)
- Logo + App name (left)
- Search bar (center, expandable on mobile)
- User avatar + subscription badge + notifications (right)
- Mobile: Hamburger menu revealing slide-out navigation

**Bottom Navigation** (mobile only, fixed)
- 4-5 primary actions: Home, Markets, Signals, Portfolio, Profile
- Active state with icon fill + label

### Cards & Containers

**Signal Card** (most important component)
- Header: Crypto icon + name + timeframe badge
- Body: Large signal type (BUY/SELL/WATCH) with confidence percentage
- Rationale: 2-3 line explanation
- Footer: Timestamp + indicator badges
- Padding: p-4, rounded-xl, shadow-lg
- Border: 2px on left indicating signal type strength

**Market Overview Card**
- Crypto logo + name (left)
- Price (large, monospace) + 24h change percentage (right)
- Mini sparkline chart (full width)
- Padding: p-3, compact for list views

**Performance Metrics Card**
- Large number display (center-aligned)
- Label below (small, muted)
- Icon/trend indicator
- Grid layout: 2-col (mobile), 4-col (desktop)

### Charts & Data Visualization

**Price Chart Component**
- Full-width container with aspect ratio 16:9 (mobile), 21:9 (desktop)
- Timeframe selector tabs above (1m, 5m, 15m, 1h, 4h, 1d)
- Indicator toggles below (RSI, MACD, Volume)
- Candlestick primary, line chart option
- Crosshair with tooltip showing OHLCV data
- Zoom controls (mobile: pinch, desktop: scroll)

**Indicator Dashboard**
- Split layout: Chart 70% height, indicators 30%
- Indicators in separate panels with labels
- Color-coded zones (overbought/oversold)
- Grid: gap-2 between indicator panels

### Forms & Inputs

**Search Bar**
- Pill-shaped, rounded-full
- Icon left, clear button right
- Autocomplete dropdown with crypto suggestions
- Focus state: expand width on desktop

**Filter Controls**
- Segmented control for quick filters (All, Favorites, Top Gainers)
- Dropdown for advanced filters (market cap, volume)
- Applied filters shown as dismissible pills

**Subscription Tier Cards**
- Vertical cards: 3-column grid (desktop), stacked (mobile)
- Badge for "Most Popular"
- Price: Large, monospace
- Feature list: Checkmarks, strikethroughs for unavailable
- CTA button: Full width, prominent
- Border highlight on selected/current plan

### Buttons & Actions

**Primary CTA**: px-8 py-3, rounded-lg, font-semibold, text-base
**Secondary**: Same size, outlined variant
**Icon buttons**: p-2, rounded-lg, 40x40px touch target
**Pill buttons**: rounded-full for tags/filters
**Signal action buttons**: Larger tap targets (min 48px) with icons

### Alerts & Notifications

**Alert Banner** (top of screen)
- Icon + message + dismiss
- Types: Info, Success, Warning, Critical
- Padding: p-4, rounded-lg (within safe area)

**Signal Notification Card**
- Compact version of signal card
- Swipe to dismiss (mobile)
- Tap to view details

### Tables & Lists

**Watchlist Table**
- Mobile: Card-based, stacked
- Desktop: Traditional table with sortable columns
- Columns: Name, Price, 24h%, 7d%, Market Cap, Sparkline
- Row hover: Subtle background change, quick actions appear
- Sticky header on scroll

### Modals & Overlays

**Full-screen modal** (mobile)
- Slide up animation
- Header with title + close button
- Scrollable content
- Fixed footer for actions

**Sheet/Drawer** (mobile bottom sheet)
- Drag handle at top
- Partial height, can expand to full
- Use for filters, signal details

---

## Screen Layouts

### Landing/Marketing Page
- **Hero**: Full viewport height with gradient background
  - Headline: "AI-Powered Crypto Signals" (text-6xl)
  - Subheadline: Value prop (text-xl, max-w-2xl)
  - CTA buttons: "Start Free Trial" + "View Demo"
  - Hero image: Dashboard preview (mockup on device frames)
- **Features Grid**: 3 columns (desktop), stacked (mobile), icons + titles + descriptions
- **Signal Preview**: Live signal feed embedded (5 latest signals)
- **Pricing Table**: 3-tier comparison
- **Social Proof**: Logos, testimonials in 2-column layout
- **FAQ**: Accordion, max-w-3xl centered

### Dashboard (Authenticated Home)
- **Market Overview**: Scrollable horizontal cards (mobile), 4-column grid (desktop)
- **Recent Signals**: Feed layout, 2-column (tablet+), single (mobile)
- **Portfolio Summary**: 2-3 key metrics in large cards
- **Trending**: Compact list, 5-7 items

### Crypto Detail Page
- **Header**: Coin info + price + watchlist star
- **Chart**: Full-width, 60% viewport height
- **Indicators Panel**: Below chart, expandable sections
- **Signals History**: Timeline view (left line + cards)
- **Stats Grid**: Market cap, volume, supply in 2x2 grid

### Signals Feed
- **Filters**: Sticky below navigation
- **Feed**: Infinite scroll, signal cards with gap-4
- **Fab**: Floating action button for "Create Alert" (bottom-right)

### Backtesting Interface
- **Configuration Panel**: Left sidebar (desktop), top sheet (mobile)
- **Results Display**: Chart + metrics split layout
- **Performance Table**: Win rate, profit factor, drawdown in highlight cards above table

### Profile/Settings
- **Section groups**: Account, Subscription, Preferences, Security
- **List items**: Icon + label + value + chevron
- **Subscription card**: Highlighted, shows current plan + manage button

---

## Interaction Patterns

### Microinteractions
- Signal card: Pulse animation on new signal
- Price changes: Flash on update
- Button press: Scale 0.98 on active
- Chart: Smooth zoom/pan, no lag
- Tabs: Sliding indicator, smooth transition

### Loading States
- Skeleton screens for cards/charts
- Shimmer effect on loading
- Price placeholders: Monospace dashes "---"
- Never block entire screen unless critical

### Empty States
- Illustration + message + CTA
- Watchlist empty: "Add your first crypto to track"
- No signals: "Signals will appear here when criteria match"

---

## Accessibility & Responsive Behavior

- Minimum touch target: 44x44px (iOS), 48x48px (Android)
- Chart controls: Larger on mobile
- Font scaling: Respect user preferences
- Focus indicators: Visible keyboard navigation
- Screen reader labels on icon-only buttons
- Reduced motion: Disable animations when preferred

### Breakpoints Strategy
```
Mobile-first base styles
sm: 640px (large phones)
md: 768px (tablets) - Enable 2-column layouts
lg: 1024px (desktop) - Show sidebar, 3-4 columns
xl: 1280px (wide) - Optimize chart aspect ratios
```

---

## Images

### Hero Section Image
- **Type**: Dashboard mockup on device frames (iPhone + MacBook)
- **Placement**: Right side of hero on desktop, below headline on mobile
- **Treatment**: Floating with subtle shadow, slight tilt (2-3 degrees)
- **Size**: 50% width (desktop), full width (mobile)

### Signal Illustrations
- **Type**: Icon-style illustrations for empty states and feature explanations
- **Style**: Line art, minimal, professional
- **Usage**: Empty watchlist, no signals yet, error states

### Crypto Logos
- **Source**: CoinGecko API or public CDN
- **Format**: SVG or high-res PNG, circular containers
- **Size**: 32px (lists), 48px (cards), 64px (detail pages)

---

This design system prioritizes information density, professional trust, and mobile-first usability while maintaining the visual polish expected in modern fintech applications.