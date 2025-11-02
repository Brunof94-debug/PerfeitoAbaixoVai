import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RSI, MACD, EMA, BollingerBands } from 'technicalindicators';

interface TechnicalIndicatorsProps {
  symbol: string;
  currentPrice: number;
  cryptoId: string;
  timeframe?: '1' | '7' | '30' | '90';
}

const timeframeToDays: Record<string, string> = {
  '1': '1',
  '7': '7',
  '30': '30',
  '90': '90',
};

export function TechnicalIndicators({ symbol, currentPrice, cryptoId, timeframe = '7' }: TechnicalIndicatorsProps) {
  const days = timeframeToDays[timeframe];
  
  // Fetch historical OHLC data for calculations
  const { data: ohlcData, isLoading, isError, isFetching } = useQuery<any[]>({
    queryKey: [`/api/cryptos/${cryptoId}/ohlc?days=${days}`],
    enabled: !!cryptoId,
    retry: 1,
  });

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground" data-testid="indicators-error">
            <p>Unable to load indicators</p>
            <p className="text-sm mt-2">API rate limit reached</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !ohlcData || ohlcData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Extract close prices for indicator calculations
  const closePrices = ohlcData.map(d => d.close);
  
  // Calculate RSI (14-period)
  const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
  const rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;
  
  // Calculate MACD
  const macdValues = MACD.calculate({
    values: closePrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macd = macdValues.length > 0 ? macdValues[macdValues.length - 1] : { MACD: 0, signal: 0, histogram: 0 };
  
  // Calculate EMAs
  const ema12Values = EMA.calculate({ values: closePrices, period: 12 });
  const ema26Values = EMA.calculate({ values: closePrices, period: 26 });
  const ema50Values = EMA.calculate({ values: closePrices, period: 50 });
  
  const ema = {
    ema12: ema12Values.length > 0 ? ema12Values[ema12Values.length - 1] : currentPrice,
    ema26: ema26Values.length > 0 ? ema26Values[ema26Values.length - 1] : currentPrice,
    ema50: ema50Values.length > 0 ? ema50Values[ema50Values.length - 1] : currentPrice,
  };
  
  // Calculate Bollinger Bands
  const bbValues = BollingerBands.calculate({
    values: closePrices,
    period: 20,
    stdDev: 2,
  });
  const bb = bbValues.length > 0 ? bbValues[bbValues.length - 1] : {
    upper: currentPrice * 1.02,
    middle: currentPrice,
    lower: currentPrice * 0.98,
  };
  
  const bollinger = {
    upper: bb.upper,
    middle: bb.middle,
    lower: bb.lower,
  };
  
  // Simple VWAP approximation (using close prices as proxy)
  const vwap = closePrices.slice(-20).reduce((a, b) => a + b, 0) / 20;

  const getRSISignal = (value: number): { label: string; variant: 'default' | 'destructive' | 'secondary' } => {
    if (value < 30) return { label: 'Oversold', variant: 'default' };
    if (value > 70) return { label: 'Overbought', variant: 'destructive' };
    return { label: 'Neutral', variant: 'secondary' };
  };

  const getMACDSignal = (): 'bullish' | 'bearish' | 'neutral' => {
    if (macd.MACD > macd.signal && macd.histogram > 0) return 'bullish';
    if (macd.MACD < macd.signal && macd.histogram < 0) return 'bearish';
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
        <div className="flex items-center justify-between">
          <CardTitle>Technical Indicators</CardTitle>
          {isFetching && !isLoading && (
            <Badge variant="outline" className="text-xs" data-testid="badge-indicators-refreshing">
              Updating...
            </Badge>
          )}
        </div>
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
              <p className="font-mono font-semibold">{macd.MACD?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Signal</p>
              <p className="font-mono font-semibold">{macd.signal?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Histogram</p>
              <p className={`font-mono font-semibold ${(macd.histogram || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {macd.histogram?.toFixed(2) || '0.00'}
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