// client/src/components/crypto-chart.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
  Time,
} from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Interval = "1h" | "4h" | "1d";

type CryptoChartProps = {
  /** Símbolo exibido no título */
  symbol?: string;
  /** Endpoint opcional que retorna candles no formato CandlestickData[] */
  dataUrl?: string;
  /** Intervalo inicial */
  initialInterval?: Interval;
  /** Tema (claro/escuro). Se você já tiver um ThemeProvider, pode ignorar e deixar "auto" */
  theme?: "auto" | "light" | "dark";
};

/** Gera dados mock para não quebrar o build caso a API falhe/esteja ausente */
function generateMockData(points = 150): CandlestickData[] {
  const data: CandlestickData[] = [];
  let t = Math.floor(Date.now() / 1000) - points * 60 * 60; // horas
  let price = 60000;

  for (let i = 0; i < points; i++) {
    const open = price;
    const delta = (Math.random() - 0.5) * 1000;
    let close = Math.max(500, open + delta);
    const high = Math.max(open, close) + Math.random() * 300;
    const low = Math.min(open, close) - Math.random() * 300;
    data.push({
      time: (t as UTCTimestamp),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
    t += 60 * 60;
    price = close;
  }
  return data;
}

async function fetchCandles(url: string): Promise<CandlestickData[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar candles: ${res.status}`);
  // Espera-se array de objetos { time, open, high, low, close }
  const json = await res.json();
  // Normaliza "time" para UTCTimestamp se vier em ms
  return (json as any[]).map((c) => ({
    time:
      typeof c.time === "number"
        ? ((c.time > 10_000_000_000
            ? Math.floor(c.time / 1000)
            : c.time) as UTCTimestamp)
        : (c.time as Time),
    open: Number(c.open),
    high: Number(c.high),
    low: Number(c.low),
    close: Number(c.close),
  }));
}

export default function CryptoChart({
  symbol = "BTCUSDT",
  dataUrl,
  initialInterval = "1h",
  theme = "auto",
}: CryptoChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [interval, setInterval] = useState<Interval>(initialInterval);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "auto") {
      if (typeof window !== "undefined") {
        return window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "light";
    }
    return theme;
  }, [theme]);

  // Cria / recria o chart quando monta ou quando o tema muda
  useEffect(() => {
    if (!containerRef.current) return;

    // Limpa instâncias anteriores
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: resolvedTheme === "dark" ? "#0B0B0F" : "#ffffff" },
        textColor: resolvedTheme === "dark" ? "#e5e7eb" : "#0b1221",
      },
      grid: {
        vertLines: { color: resolvedTheme === "dark" ? "#1f2937" : "#e5e7eb" },
        horzLines: { color: resolvedTheme === "dark" ? "#1f2937" : "#e5e7eb" },
      },
      crosshair: { mode: 1 },
      timeScale: { borderColor: resolvedTheme === "dark" ? "#374151" : "#cbd5e1" },
      rightPriceScale: { borderColor: resolvedTheme === "dark" ? "#374151" : "#cbd5e1" },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderUpColor: "#16a34a",
      borderDownColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => chart.applyOptions({ autoSize: true }));
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [resolvedTheme]);

  // Carrega dados quando o intervalo ou dataUrl mudam
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        let data: CandlestickData[];
        if (dataUrl) {
          // Se você tiver API própria, forme a URL nela (ex.: `/api/candles?symbol=BTCUSDT&interval=1h`)
          const url = new URL(dataUrl, typeof window !== "undefined" ? window.location.origin : "http://localhost");
          url.searchParams.set("symbol", symbol);
          url.searchParams.set("interval", interval);
          data = await fetchCandles(url.toString());
        } else {
          // Fallback: dados mock para garantir build + render
          data = generateMockData(200);
        }

        if (!cancelled && seriesRef.current) {
          seriesRef.current.setData(data);
          // Ajusta a janela de tempo para mostrar tudo
          chartRef.current?.timeScale().fitContent();
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Erro ao carregar dados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dataUrl, interval, symbol]);

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle className="text-xl font-semibold">
          {symbol} • {interval.toUpperCase()}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={interval === "1h" ? "default" : "outline"}
            onClick={() => setInterval("1h")}
            size="sm"
          >
            1H
          </Button>
          <Button
            variant={interval === "4h" ? "default" : "outline"}
            onClick={() => setInterval("4h")}
            size="sm"
          >
            4H
          </Button>
          <Button
            variant={interval === "1d" ? "default" : "outline"}
            onClick={() => setInterval("1d")}
            size="sm"
          >
            1D
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[420px] w-full relative">
          <div ref={containerRef} className="absolute inset-0" />
          {loading && (
            <div className="absolute inset-0 grid place-items-center text-sm opacity-70">
              Carregando candles…
            </div>
          )}
          {err && (
            <div className="absolute inset-0 grid place-items-center text-sm text-red-500">
              {err}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
