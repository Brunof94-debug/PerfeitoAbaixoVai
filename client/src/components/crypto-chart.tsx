import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';

interface CryptoChartProps {
  symbol: string;
  cryptoId: string;
}

type Timeframe = '1' | '5' | '15' | '60' | '240' | 'D';

const timeframeLabels: Record<Timeframe, string> = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
  'D': '1d',
};

export function CryptoChart({ symbol, cryptoId }: CryptoChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('60');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const { prices } = useWebSocket();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const series = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    seriesRef.current = series;

    // Generate mock historical data for demonstration
    // In production, this would come from CoinGecko API
    const generateMockData = (): CandlestickData[] => {
      const data: CandlestickData[] = [];
      const now = Date.now();
      const basePrice = 50000;
      let currentPrice = basePrice;

      const intervals = timeframe === 'D' ? 90 : timeframe === '240' ? 100 : 100;
      const msPerCandle = 
        timeframe === '1' ? 60000 :
        timeframe === '5' ? 300000 :
        timeframe === '15' ? 900000 :
        timeframe === '60' ? 3600000 :
        timeframe === '240' ? 14400000 :
        86400000;

      for (let i = intervals; i >= 0; i--) {
        const timestamp = (now - (i * msPerCandle)) / 1000;
        const volatility = currentPrice * 0.02;
        const change = (Math.random() - 0.5) * volatility;
        
        const open = currentPrice;
        const close = currentPrice + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        data.push({
          time: timestamp as UTCTimestamp,
          open,
          high,
          low,
          close,
        });

        currentPrice = close;
      }

      return data;
    };

    series.setData(generateMockData());

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [timeframe]);

  // Update chart with real-time price
  useEffect(() => {
    const livePrice = prices[symbol.toLowerCase()];
    if (livePrice && seriesRef.current) {
      const lastCandle = {
        time: (Date.now() / 1000) as UTCTimestamp,
        open: livePrice.price,
        high: livePrice.price * 1.001,
        low: livePrice.price * 0.999,
        close: livePrice.price,
      };
      seriesRef.current.update(lastCandle);
    }
  }, [prices, symbol]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Price Chart</CardTitle>
          <div className="flex gap-2">
            {/* Timeframe selector */}
            <div className="flex gap-1">
              {(Object.keys(timeframeLabels) as Timeframe[]).map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  data-testid={`button-timeframe-${tf}`}
                  className="px-3"
                >
                  {timeframeLabels[tf]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full" data-testid="crypto-chart" />
      </CardContent>
    </Card>
  );
}