import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CryptoLogo } from "@/components/crypto-logo";
import { SignalBadge } from "@/components/signal-badge";
import { SignalCardSkeleton } from "@/components/loading-skeletons";
import { Brain, RefreshCw, Settings, TrendingUp, Clock, Target, Zap } from "lucide-react";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Signal, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Signals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    data: signals, 
    isLoading, 
    dataUpdatedAt,
    isStale,
    isFetching 
  } = useQuery<Signal[]>({
    queryKey: ['/api/signals'],
  });
  
  // Mutation to update trading style
  const updateTradingStyleMutation = useMutation({
    mutationFn: async (tradingStyle: string) => {
      const response = await apiRequest('PATCH', '/api/user/preferences', { tradingStyle });
      return await response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Preferências atualizadas",
        description: "Seu estilo de trading foi salvo com sucesso. Os próximos sinais serão otimizados para sua estratégia.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar suas preferências. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/signals'] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const filteredSignals = signals?.filter((signal) => {
    if (typeFilter !== "all" && signal.signalType !== typeFilter) return false;
    if (timeframeFilter !== "all" && signal.timeframe !== timeframeFilter) return false;
    return true;
  }) || [];

  const tradingStyles = [
    {
      id: 'scalping',
      name: 'Scalping',
      description: 'Operações rápidas em minutos',
      timeframes: '1m - 15m',
      icon: Zap,
    },
    {
      id: 'day_trade',
      name: 'Day Trade',
      description: 'Operações intraday sem pernoite',
      timeframes: '15m - 4h',
      icon: Clock,
    },
    {
      id: 'swing_trade',
      name: 'Swing Trade',
      description: 'Operações de dias a semanas',
      timeframes: '4h - 3d',
      icon: TrendingUp,
    },
    {
      id: 'position',
      name: 'Position',
      description: 'Investimento de longo prazo',
      timeframes: '1d - 1w',
      icon: Target,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Trading Style Configuration */}
      {user && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Configurar Estilo de Trading</CardTitle>
            </div>
            <CardDescription>
              Escolha sua estratégia para receber sinais otimizados e personalizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tradingStyles.map((style) => {
                const Icon = style.icon;
                const isSelected = user.tradingStyle === style.id;
                return (
                  <Button
                    key={style.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-auto flex-col gap-2 p-4 ${!isSelected && 'hover-elevate'}`}
                    onClick={() => updateTradingStyleMutation.mutate(style.id)}
                    disabled={updateTradingStyleMutation.isPending}
                    data-testid={`button-trading-style-${style.id}`}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">{style.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {style.description}
                      </div>
                      <div className="text-xs font-mono mt-2">
                        {style.timeframes}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Signals</h1>
          <p className="text-muted-foreground">
            AI-powered signals with confidence scores and detailed rationale
          </p>
          {dataUpdatedAt && (
            <div className="flex items-center gap-2 mt-1" data-testid="text-last-updated">
              <div className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
              </div>
              {isStale && !isFetching && (
                <Badge variant="outline" className="text-xs" data-testid="badge-stale-data">
                  Cached
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
            data-testid="button-refresh-signals"
          >
            <RefreshCw className={`h-4 w-4 ${(isRefreshing || isFetching) ? 'animate-spin' : ''}`} />
          </Button>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32" data-testid="select-signal-type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="watch">Watch</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
            <SelectTrigger className="w-32" data-testid="select-timeframe">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Times</SelectItem>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="1d">1d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <SignalCardSkeleton />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSignals.map((signal) => (
            <Card key={signal.id} className="hover-elevate" data-testid={`signal-card-${signal.id}`}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <CryptoLogo symbol={signal.cryptoSymbol} name={signal.cryptoName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-semibold">{signal.cryptoName}</h3>
                        <p className="text-sm text-muted-foreground">{signal.cryptoSymbol.toUpperCase()}</p>
                      </div>
                      <SignalBadge type={signal.signalType as any} confidence={signal.confidence} />
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">AI Analysis</span>
                      </div>
                      <p className="text-muted-foreground">{signal.rationale}</p>
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <span className="ml-2 font-mono font-semibold">${signal.price.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timeframe:</span>
                        <span className="ml-2 font-semibold">{signal.timeframe}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="ml-2 font-mono font-semibold">{signal.confidence}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Generated:</span>
                        <span className="ml-2">
                          {signal.createdAt ? formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true }) : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {signal.indicators && typeof signal.indicators === 'object' && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Technical Indicators</p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          {Object.entries(signal.indicators).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1">
                              <span className="text-muted-foreground uppercase">{key}:</span>
                              <span className="font-mono font-semibold">
                                {typeof value === 'number' ? value.toFixed(2) : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredSignals.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No signals found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later for new signals
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}