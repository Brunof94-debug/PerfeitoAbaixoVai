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
import { Alert as AlertComponent, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, BellRing, Info } from "lucide-react";
import { CryptoLogo } from "@/components/crypto-logo";
import type { Alert } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";

export default function Alerts() {
  const { toast } = useToast();
  const { notificationPermission, requestPermission } = useAlertNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    cryptoId: "",
    cryptoSymbol: "",
    cryptoName: "",
    alertType: "price_above",
    targetValue: "",
  });

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
  });

  const { data: cryptos } = useQuery<any[]>({
    queryKey: ['/api/cryptos/top'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/alerts', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      setIsDialogOpen(false);
      setFormData({ cryptoId: "", cryptoSymbol: "", cryptoName: "", alertType: "price_above", targetValue: "" });
      toast({ title: "Alert created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create alert", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/alerts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({ title: "Alert deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest(`/api/alerts/${id}`, { method: 'PATCH', body: { isActive } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCrypto = cryptos?.find(c => c.id === formData.cryptoId);
    if (!selectedCrypto) return;

    createMutation.mutate({
      ...formData,
      cryptoSymbol: selectedCrypto.symbol,
      cryptoName: selectedCrypto.name,
      targetValue: parseFloat(formData.targetValue),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Price Alerts</h1>
          <p className="text-muted-foreground">
            Get notified when cryptocurrencies hit your target prices
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-alert">
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price Alert</DialogTitle>
              <DialogDescription>
                Set up a notification when a cryptocurrency reaches your target price
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crypto">Cryptocurrency</Label>
                <Select
                  value={formData.cryptoId}
                  onValueChange={(value) => setFormData({ ...formData, cryptoId: value })}
                >
                  <SelectTrigger id="crypto" data-testid="select-alert-crypto">
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
                <Label htmlFor="alertType">Alert Type</Label>
                <Select
                  value={formData.alertType}
                  onValueChange={(value) => setFormData({ ...formData, alertType: value })}
                >
                  <SelectTrigger id="alertType" data-testid="select-alert-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_above">Price Goes Above</SelectItem>
                    <SelectItem value="price_below">Price Goes Below</SelectItem>
                    <SelectItem value="percent_change">Percent Change (24h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetValue">
                  {formData.alertType === 'percent_change' ? 'Target % Change' : 'Target Price (USD)'}
                </Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="any"
                  placeholder={formData.alertType === 'percent_change' ? '10' : '50000'}
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  required
                  data-testid="input-alert-target"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-alert">
                {createMutation.isPending ? "Creating..." : "Create Alert"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {notificationPermission !== 'granted' && (
        <AlertComponent data-testid="alert-notification-permission">
          <BellRing className="h-5 w-5" />
          <AlertTitle>Enable Browser Notifications</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Allow notifications to receive instant alerts when price targets are hit.</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={requestPermission}
              data-testid="button-enable-notifications"
            >
              Enable Notifications
            </Button>
          </AlertDescription>
        </AlertComponent>
      )}

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
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} data-testid={`alert-card-${alert.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CryptoLogo symbol={alert.cryptoSymbol} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{alert.cryptoName}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.isActive ? "default" : "secondary"}>
                          {alert.triggered ? "Triggered" : alert.isActive ? "Active" : "Paused"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleMutation.mutate({ id: alert.id, isActive: !alert.isActive })}
                          data-testid={`button-toggle-${alert.id}`}
                        >
                          {alert.isActive ? (
                            <ToggleRight className="h-5 w-5 text-primary" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(alert.id)}
                          data-testid={`button-delete-${alert.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Type:</span>{" "}
                        {alert.alertType === 'price_above' && `Price goes above $${alert.targetValue?.toLocaleString()}`}
                        {alert.alertType === 'price_below' && `Price goes below $${alert.targetValue?.toLocaleString()}`}
                        {alert.alertType === 'percent_change' && `24h change exceeds ${alert.targetValue}%`}
                      </p>
                      <p>
                        <span className="font-medium">Created:</span>{" "}
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </p>
                      {alert.triggered && alert.triggeredAt && (
                        <p>
                          <span className="font-medium">Triggered:</span>{" "}
                          {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first price alert to get notified when cryptocurrencies reach your target
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-alert">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}