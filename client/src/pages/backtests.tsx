import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Plus, TrendingUp } from "lucide-react";
import { CryptoLogo } from "@/components/crypto-logo";
import type { Backtest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function Backtests() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    cryptoId: "",
    cryptoSymbol: "",
    strategyName: "MA Crossover",
    timeframe: "1h",
    startDate: "",
    endDate: "",
  });

  const { data: backtests, isLoading } = useQuery<Backtest[]>({
    queryKey: ['/api/backtests'],
  });

  const { data: cryptos } = useQuery<any[]>({
    queryKey: ['/api/cryptos/top'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/backtests', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backtests'] });
      setIsDialogOpen(false);
      setFormData({ cryptoId: "", cryptoSymbol: "", strategyName: "MA Crossover", timeframe: "1h", startDate: "", endDate: "" });
      toast({ title: "Backtest started", description: "Results will be ready in a few moments" });
    },
    onError: () => {
      toast({ title: "Failed to start backtest", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCrypto = cryptos?.find(c => c.id === formData.cryptoId);
    if (!selectedCrypto) return;

    createMutation.mutate({
      cryptoId: formData.cryptoId,
      cryptoSymbol: selectedCrypto.symbol,
      strategyName: formData.strategyName,
      timeframe: formData.timeframe,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      parameters: {
        shortPeriod: 12,
        longPeriod: 26,
        stopLoss: 0.02,
        takeProfit: 0.05,
      },
      results: {},
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backtesting</h1>
          <p className="text-muted-foreground">
            Test trading strategies against historical market data
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-backtest">
              <Plus className="mr-2 h-4 w-4" />
              New Backtest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Backtest</DialogTitle>
              <DialogDescription>
                Configure your trading strategy and test period
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="crypto">Cryptocurrency</Label>
                  <Select
                    value={formData.cryptoId}
                    onValueChange={(value) => setFormData({ ...formData, cryptoId: value })}
                  >
                    <SelectTrigger id="crypto" data-testid="select-backtest-crypto">
                      <SelectValue placeholder="Select cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptos?.map((crypto) => (
                        <SelectItem key={crypto.id} value={crypto.id}>
                          {crypto.name} ({crypto.symbol.toUpperCase()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategy">Strategy</Label>
                  <Select
                    value={formData.strategyName}
                    onValueChange={(value) => setFormData({ ...formData, strategyName: value })}
                  >
                    <SelectTrigger id="strategy" data-testid="select-strategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MA Crossover">MA Crossover</SelectItem>
                      <SelectItem value="RSI Strategy">RSI Strategy</SelectItem>
                      <SelectItem value="MACD Strategy">MACD Strategy</SelectItem>
                      <SelectItem value="Bollinger Bands">Bollinger Bands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select
                    value={formData.timeframe}
                    onValueChange={(value) => setFormData({ ...formData, timeframe: value })}
                  >
                    <SelectTrigger id="timeframe" data-testid="select-timeframe">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">15 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="4h">4 hours</SelectItem>
                      <SelectItem value="1d">1 day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-backtest">
                {createMutation.isPending ? "Starting Backtest..." : "Run Backtest"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : backtests && backtests.length > 0 ? (
        <div className="space-y-3">
          {backtests.map((backtest) => (
            <Card key={backtest.id} data-testid={`backtest-card-${backtest.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CryptoLogo symbol={backtest.cryptoSymbol} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{backtest.strategyName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {backtest.cryptoSymbol.toUpperCase()} • {backtest.timeframe}
                        </p>
                      </div>
                      <Badge variant={backtest.status === 'completed' ? 'default' : backtest.status === 'failed' ? 'destructive' : 'secondary'}>
                        {backtest.status}
                      </Badge>
                    </div>

                    {backtest.status === 'completed' && backtest.results && (
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                          <p className="text-lg font-bold font-mono text-green-600 dark:text-green-400">
                            {((backtest.results as any).winRate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Profit Factor</p>
                          <p className="text-lg font-bold font-mono">
                            {(backtest.results as any).profitFactor?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Max Drawdown</p>
                          <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
                            {((backtest.results as any).maxDrawdown * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                          <p className="text-lg font-bold font-mono">
                            {(backtest.results as any).sharpe?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Started {formatDistanceToNow(new Date(backtest.createdAt), { addSuffix: true })}
                      {backtest.completedAt && (
                        <> • Completed {formatDistanceToNow(new Date(backtest.completedAt), { addSuffix: true })}</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No backtests yet</h3>
            <p className="text-muted-foreground mb-6">
              Test your trading strategies against historical data to see how they would have performed
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-backtest">
              <Plus className="mr-2 h-4 w-4" />
              Run Your First Backtest
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}