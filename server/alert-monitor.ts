import { db } from "./db";
import { alerts } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { fetchSingleCryptoCached } from "./cache";
import type { WebSocket } from "ws";

// Track connected WebSocket clients per user
const clientsByUser = new Map<string, Set<WebSocket>>();

export function registerAlertClient(ws: WebSocket, userId: string) {
  if (!clientsByUser.has(userId)) {
    clientsByUser.set(userId, new Set());
  }
  clientsByUser.get(userId)!.add(ws);
  
  ws.on('close', () => {
    clientsByUser.get(userId)?.delete(ws);
    // Clean up empty sets
    if (clientsByUser.get(userId)?.size === 0) {
      clientsByUser.delete(userId);
    }
  });
}

async function checkAlerts() {
  try {
    // Get all active, non-triggered alerts
    const activeAlerts = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.isActive, true), eq(alerts.triggered, false)));

    if (activeAlerts.length === 0) {
      return;
    }

    console.log(`[Alert Monitor] Checking ${activeAlerts.length} active alerts`);

    for (const alert of activeAlerts) {
      try {
        // Fetch current price using cached function
        const cryptoData = await fetchSingleCryptoCached(alert.cryptoId, true);
        const currentPrice = cryptoData.market_data?.current_price?.usd;

        if (!currentPrice) {
          console.warn(`[Alert Monitor] No price data for ${alert.cryptoId}`);
          continue;
        }

        let isTriggered = false;
        let message = '';

        // Check if alert condition is met
        switch (alert.alertType) {
          case 'price_above':
            if (currentPrice >= alert.targetValue!) {
              isTriggered = true;
              message = `${alert.cryptoName} is now above $${alert.targetValue}! Current price: $${currentPrice.toFixed(2)}`;
            }
            break;

          case 'price_below':
            if (currentPrice <= alert.targetValue!) {
              isTriggered = true;
              message = `${alert.cryptoName} is now below $${alert.targetValue}! Current price: $${currentPrice.toFixed(2)}`;
            }
            break;

          case 'percent_change':
            // Calculate 24h percent change
            const percentChange = cryptoData.market_data?.price_change_percentage_24h || 0;
            if (Math.abs(percentChange) >= alert.targetValue!) {
              isTriggered = true;
              message = `${alert.cryptoName} has changed ${percentChange.toFixed(2)}% in 24h!`;
            }
            break;
        }

        if (isTriggered) {
          // Update alert in database
          await db
            .update(alerts)
            .set({
              triggered: true,
              triggeredAt: new Date(),
            })
            .where(eq(alerts.id, alert.id));

          console.log(`[Alert Monitor] Alert triggered: ${alert.id} - ${message}`);

          // Send notification only to the alert owner's connected clients
          const notification = {
            type: 'alert-triggered',
            alert: {
              ...alert,
              triggered: true,
              triggeredAt: new Date(),
              currentPrice,
              message,
            },
          };

          const userClients = clientsByUser.get(alert.userId);
          if (userClients) {
            userClients.forEach((client) => {
              if (client.readyState === 1) { // OPEN
                client.send(JSON.stringify(notification));
              }
            });
          }
        }
      } catch (error) {
        console.error(`[Alert Monitor] Error checking alert ${alert.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Alert Monitor] Error in checkAlerts:', error);
  }
}

// Start monitoring alerts
let monitorInterval: NodeJS.Timeout | null = null;

export function startAlertMonitor() {
  if (monitorInterval) {
    console.log('[Alert Monitor] Already running');
    return;
  }

  console.log('[Alert Monitor] Starting alert monitoring (30s interval)');
  
  // Check immediately on start
  checkAlerts();
  
  // Then check every 30 seconds
  monitorInterval = setInterval(checkAlerts, 30000);
}

export function stopAlertMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('[Alert Monitor] Stopped');
  }
}
