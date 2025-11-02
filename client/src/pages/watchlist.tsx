import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WatchlistItemSkeleton } from "@/components/loading-skeletons";
import { CryptoLogo } from "@/components/crypto-logo";
import { PriceChange } from "@/components/price-change";
import { Search, Plus, Star, Trash2, Wifi, WifiOff } from "lucide-react";
import { Link } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Watchlist() {
  const { toast } = useToast();
  const { prices, isConnected } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState("");

  const { data: watchlistItems, isLoading: watchlistLoading } = useQuery<any[]>({
    queryKey: ['/api/watchlist'],
  });

  const { data: allCryptos } = useQuery<any[]>({
    queryKey: ['/api/cryptos'],
  });

  const addMutation = useMutation({
    mutationFn: async (cryptoId: string) => {
      const crypto = allCryptos?.find(c => c.id === cryptoId);
      return apiRequest('/api/watchlist', {
        method: 'POST',
        body: {
          cryptoId,
          cryptoSymbol: crypto?.symbol || '',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      setIsDialogOpen(false);
      setSelectedCrypto("");
      toast({ title: "Added to watchlist" });
    },
    onError: () => {
      toast({ title: "Failed to add to watchlist", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/watchlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({ title: "Removed from watchlist" });
    },
    onError: () => {
      toast({ title: "Failed to remove from watchlist", variant: "destructive" });
    },
  });

  // Merge real-time prices with watchlist data
  const liveWatchlist = useMemo(() => {
    if (!watchlistItems) return [];
    
    return watchlistItems.map(item => {
      const livePrice = prices[item.cryptoSymbol?.toLowerCase()];
      if (livePrice) {
        return {
          ...item,
          currentPrice: livePrice.price,
          priceChange24h: livePrice.change24h,
        };
      }
      return item;
    });
  }, [watchlistItems, prices]);

  const filteredWatchlist = liveWatchlist.filter((item) =>
    item.cryptoSymbol?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? "Live" : "Disconnected"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Track your favorite cryptocurrencies with real-time updates
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-watchlist"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-to-watchlist">
                <Plus className="mr-2 h-4 w-4" />
                Add Crypto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Watchlist</DialogTitle>
                <DialogDescription>
                  Select a cryptocurrency to add to your watchlist
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger data-testid="select-crypto-watchlist">
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCryptos?.map((crypto) => (
                      <SelectItem key={crypto.id} value={crypto.id}>
                        {crypto.name} ({crypto.symbol.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={() => selectedCrypto && addMutation.mutate(selectedCrypto)}
                  disabled={!selectedCrypto || addMutation.isPending}
                  data-testid="button-confirm-add"
                >
                  {addMutation.isPending ? "Adding..." : "Add to Watchlist"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {watchlistLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <WatchlistItemSkeleton key={i} />
          ))}
        </div>
      ) : filteredWatchlist.length > 0 ? (
        <div className="space-y-3">
          {filteredWatchlist.map((item) => (
            <Card key={item.id} className="hover-elevate active-elevate-2 transition-all" data-testid={`watchlist-item-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Link href={`/crypto/${item.cryptoId}`}>
                    <div className="cursor-pointer">
                      <CryptoLogo symbol={item.cryptoSymbol} size="md" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <h3 className="font-semibold text-lg">{item.cryptoSymbol?.toUpperCase()}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    {item.currentPrice ? (
                      <>
                        <p className="text-xl font-bold font-mono">
                          ${item.currentPrice.toLocaleString()}
                        </p>
                        <PriceChange value={item.priceChange24h || 0} className="text-sm" />
                      </>
                    ) : (
                      <p className="text-muted-foreground">Loading...</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={removeMutation.isPending}
                    data-testid={`button-remove-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Add cryptocurrencies to your watchlist to track their prices in real-time
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Crypto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}