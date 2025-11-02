import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  real,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== AUTHENTICATION TABLES ====================
// Session storage table (IMPORTANT - mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (IMPORTANT - mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionTier: varchar("subscription_tier").notNull().default('basic'), // 'basic', 'pro', 'expert'
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ==================== CRYPTO & MARKET DATA ====================
export const watchlist = pgTable("watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  cryptoId: varchar("crypto_id").notNull(), // CoinGecko ID (e.g., 'bitcoin', 'ethereum')
  cryptoSymbol: varchar("crypto_symbol").notNull(), // e.g., 'BTC', 'ETH'
  cryptoName: varchar("crypto_name").notNull(), // e.g., 'Bitcoin', 'Ethereum'
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("idx_watchlist_user").on(table.userId),
]);

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({ id: true, addedAt: true });
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlist.$inferSelect;

// ==================== SIGNALS & ANALYSIS ====================
export const signals = pgTable("signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cryptoId: varchar("crypto_id").notNull(),
  cryptoSymbol: varchar("crypto_symbol").notNull(),
  cryptoName: varchar("crypto_name").notNull(),
  timeframe: varchar("timeframe").notNull(), // '1m', '5m', '15m', '1h', '4h', '1d'
  signalType: varchar("signal_type").notNull(), // 'buy', 'sell', 'watch'
  confidence: integer("confidence").notNull(), // 0-100
  price: real("price").notNull(),
  rationale: text("rationale").notNull(), // AI-generated explanation
  indicators: jsonb("indicators"), // { rsi: 65, macd: {...}, ema: {...} }
  modelVersion: varchar("model_version").notNull().default('v1.0'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_signals_crypto").on(table.cryptoId),
  index("idx_signals_created").on(table.createdAt),
]);

export const insertSignalSchema = createInsertSchema(signals).omit({ id: true, createdAt: true });
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signals.$inferSelect;

// ==================== ALERTS ====================
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  cryptoId: varchar("crypto_id").notNull(),
  cryptoSymbol: varchar("crypto_symbol").notNull(),
  cryptoName: varchar("crypto_name").notNull(),
  alertType: varchar("alert_type").notNull(), // 'price_above', 'price_below', 'percent_change', 'new_signal'
  targetValue: real("target_value"), // target price or percentage
  isActive: boolean("is_active").notNull().default(true),
  triggered: boolean("triggered").notNull().default(false),
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_alerts_user").on(table.userId),
  index("idx_alerts_active").on(table.isActive),
]);

export const insertAlertSchema = createInsertSchema(alerts).omit({ 
  id: true, 
  triggered: true, 
  triggeredAt: true,
  createdAt: true 
});
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// ==================== BACKTESTING ====================
export const backtests = pgTable("backtests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  cryptoId: varchar("crypto_id").notNull(),
  cryptoSymbol: varchar("crypto_symbol").notNull(),
  strategyName: varchar("strategy_name").notNull(),
  timeframe: varchar("timeframe").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  parameters: jsonb("parameters").notNull(), // Strategy-specific parameters
  results: jsonb("results").notNull(), // { winRate, profitFactor, maxDrawdown, sharpe, trades: [...] }
  status: varchar("status").notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_backtests_user").on(table.userId),
  index("idx_backtests_created").on(table.createdAt),
]);

export const insertBacktestSchema = createInsertSchema(backtests).omit({ 
  id: true, 
  status: true,
  createdAt: true,
  completedAt: true 
});
export type InsertBacktest = z.infer<typeof insertBacktestSchema>;
export type Backtest = typeof backtests.$inferSelect;

// ==================== RELATIONS ====================
export const usersRelations = relations(users, ({ many }) => ({
  watchlist: many(watchlist),
  alerts: many(alerts),
  backtests: many(backtests),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
}));

export const backtestsRelations = relations(backtests, ({ one }) => ({
  user: one(users, {
    fields: [backtests.userId],
    references: [users.id],
  }),
}));