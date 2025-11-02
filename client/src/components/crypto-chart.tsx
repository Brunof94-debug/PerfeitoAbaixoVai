import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createChart, IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';

interface CryptoChartProps {
  symbol: string;
  cryptoId: string;
}

type Timeframe = '1' | '7' | '30' | '90';

const timeframeLabels: Record<Timeframe, string> = {
  '1': '24h',
  '7': '7d',
  '30': '30d',
  '90': '90d',
};

const timeframeToDays: Record<Timeframe, string> = {
  '1': '1',
  '7': '7',
  '30': '30',
  '90': '90',
};

export function CryptoChart({ symbol, cryptoId }: CryptoChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('7');
  const { prices } = useWebSocket();

  // Fetch historical OHLC data
  const { data: ohlcData, isLoading, isError, error } = useQuery<CandlestickData[]>({
    queryKey: [`/api/cryptos/${cryptoId}/ohlc?days=${timeframeToDays[timeframe]}`],
    enabled: !!cryptoId,
    retry: 1,
  });

  // Create chart once on mount
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
  }, []); // Only create once

  // Update data when OHLC data changes
  useEffect(() => {
    if (seriesRef.current && ohlcData && ohlcData.length > 0) {
      seriesRef.current.setData(ohlcData);
    }
  }, [ohlcData]);

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
        {isError ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground" data-testid="chart-error">
            <div className="text-center">
              <p className="mb-2">Unable to load chart data</p>
              <p className="text-sm">API rate limit reached. Please try again in a few moments.</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full" data-testid="crypto-chart" />
        )}
      </CardContent>
    </Card>
  );
}