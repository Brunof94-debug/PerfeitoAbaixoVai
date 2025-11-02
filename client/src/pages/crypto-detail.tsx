import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CryptoLogo } from "@/components/crypto-logo";
import { PriceChange } from "@/components/price-change";
import { SignalBadge } from "@/components/signal-badge";
import { CryptoChart } from "@/components/crypto-chart";
import { TechnicalIndicators } from "@/components/technical-indicators";
import { Star, TrendingUp, BarChart3, Bell } from "lucide-react";
import type { Signal } from "@shared/schema";

export default function CryptoDetail() {
  const params = useParams();
  const cryptoId = params.id;

  const { data: crypto, isLoading: cryptoLoading } = useQuery<any>({
    queryKey: [`/api/cryptos/${cryptoId}`],
    enabled: !!cryptoId,
  });

  const { data: signals, isLoading: signalsLoading } = useQuery<Signal[]>({
    queryKey: [`/api/signals/crypto/${cryptoId}`],
    enabled: !!cryptoId,
  });

  if (cryptoLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!crypto) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cryptocurrency not found</p>
      </div>
    );
  }

  const marketData = crypto.market_data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <CryptoLogo symbol={crypto.symbol} name={crypto.name} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{crypto.name}</h1>
                <span className="text-muted-foreground text-xl">{crypto.symbol.toUpperCase()}</span>
                <Button variant="ghost" size="icon" data-testid="button-add-to-watchlist">
                  <Star className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-baseline gap-4">
                <p className="text-4xl font-bold font-mono" data-testid="current-price">
                  ${marketData.current_price?.usd?.toLocaleString() || 'N/A'}
                </p>
                <PriceChange value={marketData.price_change_percentage_24h || 0} className="text-lg" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-set-alert">
                <Bell className="mr-2 h-4 w-4" />
                Set Alert
              </Button>
              <Button data-testid="button-view-signals">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Signals
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Indicators */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CryptoChart symbol={crypto.symbol} cryptoId={crypto.id} />
        </div>
        <div>
          <TechnicalIndicators 
            symbol={crypto.symbol} 
            currentPrice={marketData.current_price?.usd || 0}
            cryptoId={crypto.id}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Market Cap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              ${((marketData.market_cap?.usd || 0) / 1e9).toFixed(2)}B
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              ${((marketData.total_volume?.usd || 0) / 1e9).toFixed(2)}B
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Circulating Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {((marketData.circulating_supply || 0) / 1e6).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">All-Time High</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              ${marketData.ath?.usd?.toLocaleString() || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Price Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">24 Hours</p>
              <PriceChange value={marketData.price_change_percentage_24h || 0} showIcon={false} className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">7 Days</p>
              <PriceChange value={marketData.price_change_percentage_7d || 0} showIcon={false} className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">30 Days</p>
              <PriceChange value={marketData.price_change_percentage_30d || 0} showIcon={false} className="text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent AI Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {signalsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : signals && signals.length > 0 ? (
            <div className="space-y-4">
              {signals.map((signal) => (
                <div key={signal.id} className="border rounded-lg p-4" data-testid={`signal-${signal.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <SignalBadge type={signal.signalType as any} confidence={signal.confidence} />
                    <p className="text-sm text-muted-foreground">
                      {new Date(signal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm mb-2">{signal.rationale}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Price: ${signal.price.toLocaleString()}</span>
                    <span>Timeframe: {signal.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No signals available for this cryptocurrency yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {crypto.description?.en && (
        <Card>
          <CardHeader>
            <CardTitle>About {crypto.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: crypto.description.en.substring(0, 500) + '...' }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}