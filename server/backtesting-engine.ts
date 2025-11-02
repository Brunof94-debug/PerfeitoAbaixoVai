import type { InsertBacktest } from "@shared/schema";
import pRetry from "p-retry";

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Trade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  type: 'buy' | 'sell';
  profit: number;
  profitPercent: number;
}

interface BacktestResults {
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpe: number;
  totalTrades: number;
  trades: Trade[];
}

// Simple Moving Average calculator
function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

// RSI calculator
function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const changes: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  for (let i = 0; i < changes.length; i++) {
    if (i < period) {
      rsi.push(NaN);
    } else {
      const gains = changes.slice(i - period, i).filter(c => c > 0);
      const losses = changes.slice(i - period, i).filter(c => c < 0).map(Math.abs);
      
      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
  }
  
  return rsi;
}

// Fetch historical OHLC data from CoinGecko
async function fetchHistoricalData(cryptoId: string, startDate: Date, endDate: Date): Promise<OHLCData[]> {
  const fromTimestamp = Math.floor(startDate.getTime() / 1000);
  const toTimestamp = Math.floor(endDate.getTime() / 1000);
  
  const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart/range?vs_currency=usd&from=${fromTimestamp}&to=${toTimestamp}`;
  
  const response = await pRetry(
    async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
      return res.json();
    },
    {
      retries: 3,
      minTimeout: 1000,
      factor: 2,
    }
  );
  
  // Convert price data to OHLC (simplified - using prices as close)
  const ohlc: OHLCData[] = [];
  const prices = response.prices || [];
  
  // Group by day
  const dayMap = new Map<string, number[]>();
  for (const [timestamp, price] of prices) {
    const date = new Date(timestamp).toISOString().split('T')[0];
    if (!dayMap.has(date)) {
      dayMap.set(date, []);
    }
    dayMap.get(date)!.push(price);
  }
  
  // Convert to OHLC
  for (const [date, dayPrices] of dayMap) {
    if (dayPrices.length === 0) continue;
    
    ohlc.push({
      timestamp: new Date(date).getTime(),
      open: dayPrices[0],
      high: Math.max(...dayPrices),
      low: Math.min(...dayPrices),
      close: dayPrices[dayPrices.length - 1],
      volume: 0,
    });
  }
  
  return ohlc.sort((a, b) => a.timestamp - b.timestamp);
}

// Execute backtest strategy
function executeStrategy(ohlc: OHLCData[], strategy: string): Trade[] {
  const trades: Trade[] = [];
  const closes = ohlc.map(d => d.close);
  
  let position: 'long' | 'short' | null = null;
  let entryPrice = 0;
  let entryTime = 0;
  
  if (strategy === 'SMA Crossover') {
    // Simple Moving Average crossover strategy
    const smaShort = calculateSMA(closes, 10);
    const smaLong = calculateSMA(closes, 30);
    
    for (let i = 30; i < ohlc.length; i++) {
      const prevShort = smaShort[i - 1];
      const prevLong = smaLong[i - 1];
      const currShort = smaShort[i];
      const currLong = smaLong[i];
      
      if (isNaN(prevShort) || isNaN(prevLong)) continue;
      
      // Buy signal: short MA crosses above long MA
      if (prevShort <= prevLong && currShort > currLong && !position) {
        position = 'long';
        entryPrice = ohlc[i].close;
        entryTime = ohlc[i].timestamp;
      }
      // Sell signal: short MA crosses below long MA
      else if (prevShort >= prevLong && currShort < currLong && position === 'long') {
        const exitPrice = ohlc[i].close;
        const profit = exitPrice - entryPrice;
        const profitPercent = (profit / entryPrice) * 100;
        
        trades.push({
          entryTime,
          exitTime: ohlc[i].timestamp,
          entryPrice,
          exitPrice,
          type: 'buy',
          profit,
          profitPercent,
        });
        
        position = null;
      }
    }
    
    // Close any open position at the end
    if (position === 'long') {
      const lastCandle = ohlc[ohlc.length - 1];
      const exitPrice = lastCandle.close;
      const profit = exitPrice - entryPrice;
      const profitPercent = (profit / entryPrice) * 100;
      
      trades.push({
        entryTime,
        exitTime: lastCandle.timestamp,
        entryPrice,
        exitPrice,
        type: 'buy',
        profit,
        profitPercent,
      });
      
      position = null;
    }
  } else if (strategy === 'RSI Oversold/Overbought') {
    const rsi = calculateRSI(closes);
    
    for (let i = 14; i < ohlc.length; i++) {
      const currRSI = rsi[i];
      
      if (isNaN(currRSI)) continue;
      
      // Buy signal: RSI < 30 (oversold)
      if (currRSI < 30 && !position) {
        position = 'long';
        entryPrice = ohlc[i].close;
        entryTime = ohlc[i].timestamp;
      }
      // Sell signal: RSI > 70 (overbought)
      else if (currRSI > 70 && position === 'long') {
        const exitPrice = ohlc[i].close;
        const profit = exitPrice - entryPrice;
        const profitPercent = (profit / entryPrice) * 100;
        
        trades.push({
          entryTime,
          exitTime: ohlc[i].timestamp,
          entryPrice,
          exitPrice,
          type: 'buy',
          profit,
          profitPercent,
        });
        
        position = null;
      }
    }
    
    // Close any open position at the end
    if (position === 'long') {
      const lastCandle = ohlc[ohlc.length - 1];
      const exitPrice = lastCandle.close;
      const profit = exitPrice - entryPrice;
      const profitPercent = (profit / entryPrice) * 100;
      
      trades.push({
        entryTime,
        exitTime: lastCandle.timestamp,
        entryPrice,
        exitPrice,
        type: 'buy',
        profit,
        profitPercent,
      });
      
      position = null;
    }
  }
  
  return trades;
}

// Calculate performance metrics
function calculateMetrics(trades: Trade[], initialCapital: number = 10000): BacktestResults {
  if (trades.length === 0) {
    return {
      winRate: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      sharpe: 0,
      totalTrades: 0,
      trades: [],
    };
  }
  
  const wins = trades.filter(t => t.profit > 0);
  const losses = trades.filter(t => t.profit < 0);
  
  const winRate = wins.length / trades.length;
  
  const grossProfit = wins.reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
  
  // Calculate max drawdown
  let capital = initialCapital;
  let peak = initialCapital;
  let maxDrawdown = 0;
  
  for (const trade of trades) {
    capital += trade.profit;
    if (capital > peak) {
      peak = capital;
    }
    const drawdown = (peak - capital) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Calculate Sharpe ratio (simplified)
  const returns = trades.map(t => t.profitPercent);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  
  return {
    winRate,
    profitFactor,
    maxDrawdown,
    sharpe,
    totalTrades: trades.length,
    trades: trades.slice(0, 20), // Return only first 20 trades to save space
  };
}

// Main backtest function
export async function runBacktest(params: InsertBacktest): Promise<BacktestResults> {
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);
  
  // Fetch historical data
  const ohlc = await fetchHistoricalData(params.cryptoId, startDate, endDate);
  
  if (ohlc.length < 30) {
    throw new Error('Not enough historical data for backtesting');
  }
  
  // Execute strategy
  const trades = executeStrategy(ohlc, params.strategyName);
  
  // Calculate metrics
  const results = calculateMetrics(trades, params.initialCapital);
  
  return results;
}
