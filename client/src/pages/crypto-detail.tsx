// client/src/pages/crypto-detail.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceChange } from "@/components/price-change"; // <— AGORA NOMEADO
import { SignalBadge } from "@/components/signal-badge";
import TechnicalIndicators from "@/components/technical-indicators";
import CryptoChart from "@/components/crypto-chart"; // default
import { Star, TrendingUp, BarChart3, Bell, RefreshCw } from "lucide-react";

export default function CryptoDetail() {
  // Ajuste o símbolo conforme sua navegação/rota
  const [symbol] = useState("BTCUSDT");

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-full bg-muted">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{symbol}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SignalBadge signal="strong-buy" />
              <PriceChange value={2.45} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Star className="mr-2 h-4 w-4" />
            Favoritar
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Alertas
          </Button>
          <Button size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl font-semibold">
            Gráfico • {symbol}
          </CardTitle>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {/* Se tiver um endpoint, passe dataUrl="/api/candles" */}
          <CryptoChart symbol={symbol} />
        </CardContent>
      </Card>

      {/* Indicadores Técnicos */}
      <TechnicalIndicators symbol={symbol} />
    </div>
  );
}
