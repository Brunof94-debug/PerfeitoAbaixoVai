import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type UpsertUser,
  users,
  type Watchlist,
  type InsertWatchlist,
  watchlist,
  type Signal,
  type InsertSignal,
  signals,
  type Alert,
  type InsertAlert,
  alerts,
  type Backtest,
  type InsertBacktest,
  backtests,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(userId: string, tier: string, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<void>;
  updateUserTradingStyle(userId: string, tradingStyle: string): Promise<void>;

  // Watchlist
  getWatchlistByUser(userId: string): Promise<Watchlist[]>;
  addToWatchlist(watchlistItem: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(id: string): Promise<void>;
  isInWatchlist(userId: string, cryptoId: string): Promise<boolean>;

  // Signals
  getAllSignals(limit?: number): Promise<Signal[]>;
  getSignalsByCrypto(cryptoId: string, limit?: number): Promise<Signal[]>;
  createSignal(signal: InsertSignal): Promise<Signal>;
  getRecentSignals(limit?: number): Promise<Signal[]>;

  // Alerts
  getAlertsByUser(userId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<void>;
  deleteAlert(id: string): Promise<void>;
  getActiveAlerts(): Promise<Alert[]>;

  // Backtests
  getBacktestsByUser(userId: string): Promise<Backtest[]>;
  getBacktest(id: string): Promise<Backtest | undefined>;
  createBacktest(backtest: InsertBacktest): Promise<Backtest>;
  updateBacktest(id: string, updates: Partial<Backtest>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USERS ====================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(upsertData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(upsertData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: upsertData.firstName,
          lastName: upsertData.lastName,
          profileImageUrl: upsertData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(
    userId: string,
    tier: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<void> {
    await db
      .update(users)
      .set({
        subscriptionTier: tier,
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
  
  async updateUserTradingStyle(userId: string, tradingStyle: string): Promise<void> {
    console.log(`[Storage] Updating trading style for user ${userId} to ${tradingStyle}`);
    const result = await db
      .update(users)
      .set({
        tradingStyle,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    console.log(`[Storage] Updated ${result.length} rows, new trading style: ${result[0]?.tradingStyle}`);
  }

  // ==================== WATCHLIST ====================
  async getWatchlistByUser(userId: string): Promise<Watchlist[]> {
    return await db.select().from(watchlist).where(eq(watchlist.userId, userId));
  }

  async addToWatchlist(watchlistItem: InsertWatchlist): Promise<Watchlist> {
    const [item] = await db.insert(watchlist).values(watchlistItem).returning();
    return item;
  }

  async removeFromWatchlist(id: string): Promise<void> {
    await db.delete(watchlist).where(eq(watchlist.id, id));
  }

  async isInWatchlist(userId: string, cryptoId: string): Promise<boolean> {
    const [item] = await db
      .select()
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.cryptoId, cryptoId)));
    return !!item;
  }

  // ==================== SIGNALS ====================
  async getAllSignals(limit: number = 50): Promise<Signal[]> {
    return await db
      .select()
      .from(signals)
      .orderBy(desc(signals.createdAt))
      .limit(limit);
  }

  async getSignalsByCrypto(cryptoId: string, limit: number = 20): Promise<Signal[]> {
    return await db
      .select()
      .from(signals)
      .where(eq(signals.cryptoId, cryptoId))
      .orderBy(desc(signals.createdAt))
      .limit(limit);
  }

  async createSignal(signal: InsertSignal): Promise<Signal> {
    const [newSignal] = await db.insert(signals).values(signal).returning();
    return newSignal;
  }

  async getRecentSignals(limit: number = 10): Promise<Signal[]> {
    return await db
      .select()
      .from(signals)
      .orderBy(desc(signals.createdAt))
      .limit(limit);
  }

  // ==================== ALERTS ====================
  async getAlertsByUser(userId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<void> {
    await db.update(alerts).set(updates).where(eq(alerts.id, id));
  }

  async deleteAlert(id: string): Promise<void> {
    await db.delete(alerts).where(eq(alerts.id, id));
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.isActive, true), eq(alerts.triggered, false)));
  }

  // ==================== BACKTESTS ====================
  async getBacktestsByUser(userId: string): Promise<Backtest[]> {
    return await db
      .select()
      .from(backtests)
      .where(eq(backtests.userId, userId))
      .orderBy(desc(backtests.createdAt));
  }

  async getBacktest(id: string): Promise<Backtest | undefined> {
    const [backtest] = await db.select().from(backtests).where(eq(backtests.id, id));
    return backtest;
  }

  async createBacktest(backtest: InsertBacktest): Promise<Backtest> {
    const [newBacktest] = await db.insert(backtests).values(backtest).returning();
    return newBacktest;
  }

  async updateBacktest(id: string, updates: Partial<Backtest>): Promise<void> {
    await db.update(backtests).set(updates).where(eq(backtests.id, id));
  }
}

export const storage = new DatabaseStorage();