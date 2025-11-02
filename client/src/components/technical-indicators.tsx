import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TechnicalIndicatorsProps {
  symbol: string;
  currentPrice: number;
}

export function TechnicalIndicators({ symbol, currentPrice }: TechnicalIndicatorsProps) {
  // In production, these would be calculated using the technicalindicators package
  // with real historical price data. For now, generating realistic mock values.
  
  const rsi = 45 + Math.random() * 30; // RSI typically 0-100
  const macd = {
    value: (Math.random() - 0.5) * 100,
    signal: (Math.random() - 0.5) * 80,
    histogram: (Math.random() - 0.5) * 20,
  };
  
  const ema = {
    ema12: currentPrice * (0.98 + Math.random() * 0.04),
    ema26: currentPrice * (0.96 + Math.random() * 0.08),
    ema50: currentPrice * (0.94 + Math.random() * 0.12),
  };
  
  const bollinger = {
    upper: currentPrice * 1.05,
    middle: currentPrice,
    lower: currentPrice * 0.95,
  };
  
  const vwap = currentPrice * (0.99 + Math.random() * 0.02);

  const getRSISignal = (value: number): { label: string; variant: 'default' | 'destructive' | 'secondary' } => {
    if (value < 30) return { label: 'Oversold', variant: 'default' };
    if (value > 70) return { label: 'Overbought', variant: 'destructive' };
    return { label: 'Neutral', variant: 'secondary' };
  };

  const getMACDSignal = (): 'bullish' | 'bearish' | 'neutral' => {
    if (macd.value > macd.signal && macd.histogram > 0) return 'bullish';
    if (macd.value < macd.signal && macd.histogram < 0) return 'bearish';
    return 'neutral';
  };

  const getEMATrend = (): 'bullish' | 'bearish' | 'neutral' => {
    if (ema.ema12 > ema.ema26 && currentPrice > ema.ema50) return 'bullish';
    if (ema.ema12 < ema.ema26 && currentPrice < ema.ema50) return 'bearish';
    return 'neutral';
  };

  const rsiSignal = getRSISignal(rsi);
  const macdSignal = getMACDSignal();
  const emaTrend = getEMATrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Indicators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* RSI */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">RSI (14)</h4>
              <Badge variant={rsiSignal.variant}>{rsiSignal.label}</Badge>
            </div>
            <span className="text-2xl font-bold font-mono">{rsi.toFixed(2)}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                rsi < 30 ? 'bg-green-500' : rsi > 70 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${rsi}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0</span>
            <span className="text-green-600 dark:text-green-400">30</span>
            <span className="text-red-600 dark:text-red-400">70</span>
            <span>100</span>
          </div>
        </div>

        {/* MACD */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">MACD</h4>
              {macdSignal === 'bullish' && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
              {macdSignal === 'bearish' && <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
              {macdSignal === 'neutral' && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">MACD Line</p>
              <p className="font-mono font-semibold">{macd.value.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Signal</p>
              <p className="font-mono font-semibold">{macd.signal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Histogram</p>
              <p className={`font-mono font-semibold ${macd.histogram > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {macd.histogram.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* EMA */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Exponential Moving Averages</h4>
              {emaTrend === 'bullish' && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
              {emaTrend === 'bearish' && <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
              {emaTrend === 'neutral' && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">EMA 12</span>
              <span className="font-mono font-semibold">${ema.ema12.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">EMA 26</span>
              <span className="font-mono font-semibold">${ema.ema26.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">EMA 50</span>
              <span className="font-mono font-semibold">${ema.ema50.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div>
          <h4 className="font-semibold mb-2">Bollinger Bands (20, 2)</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Upper Band</span>
              <span className="font-mono font-semibold">${bollinger.upper.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Middle Band</span>
              <span className="font-mono font-semibold">${bollinger.middle.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lower Band</span>
              <span className="font-mono font-semibold">${bollinger.lower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* VWAP */}
        <div>
          <div className="flex justify-between mb-2">
            <h4 className="font-semibold">VWAP</h4>
            <span className="text-2xl font-bold font-mono">${vwap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Price is {currentPrice > vwap ? 'above' : 'below'} VWAP by{' '}
            <span className={currentPrice > vwap ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {(((currentPrice - vwap) / vwap) * 100).toFixed(2)}%
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}