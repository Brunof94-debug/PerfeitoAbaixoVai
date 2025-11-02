import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CryptoLogo } from "@/components/crypto-logo";
import { PriceChange } from "@/components/price-change";
import { Search, Star, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { Link } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Markets() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { prices, isConnected } = useWebSocket();
  
  const { data: cryptos, isLoading } = useQuery<any[]>({
    queryKey: ['/api/cryptos'],
  });

  const { data: watchlistItems } = useQuery<any[]>({
    queryKey: ['/api/watchlist'],
  });

  const addMutation = useMutation({
    mutationFn: async (cryptoId: string) => {
      const crypto = cryptos?.find(c => c.id === cryptoId);
      return apiRequest("POST", "/api/watchlist", {
        cryptoId,
        cryptoSymbol: crypto?.symbol || '',
        cryptoName: crypto?.name || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({ title: "Added to watchlist" });
    },
    onError: () => {
      toast({ title: "Failed to add to watchlist", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/watchlist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({ title: "Removed from watchlist" });
    },
    onError: () => {
      toast({ title: "Failed to remove from watchlist", variant: "destructive" });
    },
  });

  const isToggling = addMutation.isPending || removeMutation.isPending;

  const handleStarClick = (e: React.MouseEvent, crypto: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isToggling) return;
    
    const watchlistItem = watchlistItems?.find(item => item.cryptoId === crypto.id);
    if (watchlistItem) {
      removeMutation.mutate(watchlistItem.id);
    } else {
      addMutation.mutate(crypto.id);
    }
  };

  // Merge real-time prices with static crypto data
  const cryptosWithLivePrices = useMemo(() => {
    if (!cryptos) return [];
    
    return cryptos.map(crypto => {
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
  }, [cryptos, prices]);

  const filteredCryptos = cryptosWithLivePrices.filter((crypto) =>
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? "Live" : "Disconnected"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Explore 1000+ cryptocurrencies with real-time pricing
          </p>
        </div>
        <div className="relative md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cryptocurrencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-crypto"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCryptos.map((crypto) => (
            <Link key={crypto.id} href={`/crypto/${crypto.id}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid={`crypto-card-${crypto.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <CryptoLogo symbol={crypto.symbol} name={crypto.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{crypto.name}</h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={(e) => handleStarClick(e, crypto)}
                          disabled={isToggling}
                          data-testid={`button-star-${crypto.id}`}
                        >
                          <Star className={`h-4 w-4 ${watchlistItems?.find(item => item.cryptoId === crypto.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{crypto.symbol.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold font-mono" data-testid={`price-${crypto.id}`}>
                        ${crypto.current_price?.toLocaleString() || '0'}
                      </p>
                      <PriceChange 
                        value={crypto.price_change_percentage_24h || 0}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  {/* Additional stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Market Cap</p>
                      <p className="font-semibold text-sm">${((crypto.market_cap || 0) / 1e9).toFixed(2)}B</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Volume (24h)</p>
                      <p className="font-semibold text-sm">${((crypto.total_volume || 0) / 1e9).toFixed(2)}B</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">7d Change</p>
                      <PriceChange value={crypto.price_change_percentage_7d_in_currency || 0} className="text-sm" showIcon={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filteredCryptos.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No cryptocurrencies found</h3>
                <p className="text-muted-foreground">Try adjusting your search query</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}