import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, PieChart } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface WatchlistItem {
  id: string;
  cryptoId: string;
  cryptoName: string;
  cryptoSymbol: string;
  currentPrice: number;
}

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analytics() {
  const { data: watchlist = [], isLoading: loadingWatchlist } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
  });

  const { data: cryptos = [], isLoading: loadingCryptos } = useQuery<CryptoData[]>({
    queryKey: ["/api/cryptos"],
  });

  const { data: signals = [], isLoading: loadingSignals } = useQuery<any[]>({
    queryKey: ["/api/signals"],
  });

  const isLoading = loadingWatchlist || loadingCryptos || loadingSignals;

  // Calculate market metrics for watchlisted assets
  const watchlistIds = new Set(watchlist.map(w => w.cryptoId));
  const watchedCryptos = cryptos.filter(c => watchlistIds.has(c.id));

  const totalMarketCap = watchedCryptos.reduce((sum, crypto) => sum + (crypto.market_cap ?? 0), 0);
  const avgChange24h = watchedCryptos.length > 0
    ? watchedCryptos.reduce((sum, crypto) => sum + (crypto.price_change_percentage_24h ?? 0), 0) / watchedCryptos.length
    : 0;

  const positiveAssets = watchedCryptos.filter(c => (c.price_change_percentage_24h ?? 0) > 0).length;
  const negativeAssets = watchedCryptos.filter(c => (c.price_change_percentage_24h ?? 0) < 0).length;

  // Prepare data for charts
  const marketCapDistribution = watchedCryptos
    .sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0))
    .slice(0, 5)
    .map(crypto => ({
      name: crypto.symbol.toUpperCase(),
      value: crypto.market_cap ?? 0,
      price: crypto.current_price ?? 0,
    }));

  const performanceData = watchedCryptos
    .sort((a, b) => Math.abs(b.price_change_percentage_24h ?? 0) - Math.abs(a.price_change_percentage_24h ?? 0))
    .slice(0, 10)
    .map(crypto => ({
      name: crypto.symbol.toUpperCase(),
      change: crypto.price_change_percentage_24h ?? 0,
      price: crypto.current_price ?? 0,
    }));

  // Signal analysis
  const buySignals = signals.filter(s => s.type === 'buy').length;
  const sellSignals = signals.filter(s => s.type === 'sell').length;
  const watchSignals = signals.filter(s => s.type === 'watch').length;

  const signalData = [
    { name: 'Buy', value: buySignals, color: 'hsl(var(--chart-1))' },
    { name: 'Sell', value: sellSignals, color: 'hsl(var(--chart-3))' },
    { name: 'Watch', value: watchSignals, color: 'hsl(var(--chart-5))' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Market Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Market insights and performance metrics for your watchlist
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-market-cap">
              ${(totalMarketCap / 1e9).toFixed(2)}B
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Watchlist combined market cap
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg 24h Change</CardTitle>
            {avgChange24h >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div 
              className={`text-2xl font-bold font-mono ${avgChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}
              data-testid="text-market-change"
            >
              {avgChange24h >= 0 ? '+' : ''}{avgChange24h.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across watchlist
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watchlist Size</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-tracked-assets">
              {watchedCryptos.length}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                {positiveAssets} up
              </Badge>
              <Badge variant="outline" className="text-xs">
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                {negativeAssets} down
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Signals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-signals">
              {signals.length}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                {buySignals} Buy
              </Badge>
              <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                {sellSignals} Sell
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Market Cap Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Market Cap Distribution
            </CardTitle>
            <CardDescription>Top 5 watchlist assets by market cap</CardDescription>
          </CardHeader>
          <CardContent>
            {marketCapDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={marketCapDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {marketCapDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${(value / 1e9).toFixed(2)}B`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Add assets to your watchlist to see distribution
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Signal Distribution
            </CardTitle>
            <CardDescription>AI-generated signal breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {signalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={signalData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {signalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No signals generated yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            24h Performance Leaders
          </CardTitle>
          <CardDescription>Top movers in your watchlist by 24h change</CardDescription>
        </CardHeader>
        <CardContent>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'change') return [`${value.toFixed(2)}%`, '24h Change'];
                    return [value, name];
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="change" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Add assets to your watchlist to see performance
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
