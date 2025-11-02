import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CryptoLogo } from "@/components/crypto-logo";
import { PriceChange } from "@/components/price-change";
import { SignalBadge } from "@/components/signal-badge";
import { TrendingUp, Activity, Bell, BarChart, RefreshCw } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";

export default function Dashboard() {
  const { prices } = useWebSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    data: signals, 
    isLoading: signalsLoading, 
    dataUpdatedAt: signalsUpdatedAt,
    isStale: signalsStale,
    isFetching: signalsFetching 
  } = useQuery<Signal[]>({
    queryKey: ['/api/signals/recent'],
  });

  const { 
    data: marketOverview, 
    isLoading: marketLoading, 
    dataUpdatedAt: marketUpdatedAt,
    isStale: marketStale,
    isFetching: marketFetching 
  } = useQuery<any>({
    queryKey: ['/api/cryptos/top'],
  });

  // Use the most recent dataUpdatedAt from both queries
  const lastUpdated = Math.max(signalsUpdatedAt || 0, marketUpdatedAt || 0);
  const isStale = signalsStale || marketStale;
  const isFetching = signalsFetching || marketFetching;

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/signals/recent'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/cryptos/top'] }),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Minimum visual feedback
    }
  };

  // Merge real-time prices with market data
  const liveMarketData = useMemo(() => {
    if (!marketOverview) return [];
    
    return marketOverview.map((crypto: any) => {
      const livePrice = prices[crypto.symbol.toLowerCase()];
      if (livePrice) {
        return {
          ...crypto,
          current_price: livePrice.price,
          price_change_percentage_24h: livePrice.change24h,
        };
      }
      return crypto;
    });
  }, [marketOverview, prices]);

  if (signalsLoading || marketLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Active Signals",
      value: signals?.length || 0,
      icon: TrendingUp,
      change: "+12% from yesterday",
    },
    {
      title: "Avg Confidence",
      value: signals?.length 
        ? `${Math.round(signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length)}%`
        : "0%",
      icon: Activity,
      change: "+4% this week",
    },
    {
      title: "Active Alerts",
      value: "0",
      icon: Bell,
      change: "No active alerts",
    },
    {
      title: "Win Rate",
      value: "68%",
      icon: BarChart,
      change: "Last 30 days",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your trading signals and market performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated > 0 && (
            <div className="flex items-center gap-2" data-testid="text-last-updated">
              <div className="text-right text-sm text-muted-foreground">
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </div>
              {isStale && !isFetching && (
                <Badge variant="outline" className="text-xs" data-testid="badge-stale-data">
                  Cached
                </Badge>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
            data-testid="button-refresh-dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${(isRefreshing || isFetching) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Market Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Movers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveMarketData.slice(0, 5).map((crypto: any) => (
              <div key={crypto.id} className="flex items-center gap-4">
                <CryptoLogo symbol={crypto.symbol} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{crypto.name}</p>
                    <p className="font-mono font-semibold">${crypto.current_price?.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{crypto.symbol.toUpperCase()}</p>
                    <PriceChange value={crypto.price_change_percentage_24h || 0} showIcon={false} />
                  </div>
                </div>
              </div>
            )) || <p className="text-sm text-muted-foreground">Loading market data...</p>}
          </CardContent>
        </Card>

        {/* Recent Signals */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {signals?.slice(0, 5).map((signal) => (
              <div key={signal.id} className="flex items-start gap-4">
                <CryptoLogo symbol={signal.cryptoSymbol} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{signal.cryptoName}</p>
                    <SignalBadge type={signal.signalType as any} confidence={signal.confidence} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{signal.rationale}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{signal.timeframe}</span>
                    <span>•</span>
                    <span>${signal.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )) || <p className="text-sm text-muted-foreground">No recent signals</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}