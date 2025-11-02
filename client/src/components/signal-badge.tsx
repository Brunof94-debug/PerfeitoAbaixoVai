import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignalType = "buy" | "sell" | "watch";

interface SignalBadgeProps {
  type: SignalType;
  confidence?: number;
  className?: string;
}

export function SignalBadge({ type, confidence, className }: SignalBadgeProps) {
  const config = {
    buy: {
      icon: TrendingUp,
      label: "BUY",
      className: "bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20 hover:bg-green-600/20",
    },
    sell: {
      icon: TrendingDown,
      label: "SELL",
      className: "bg-red-600/10 text-red-700 dark:text-red-400 border-red-600/20 hover:bg-red-600/20",
    },
    watch: {
      icon: Eye,
      label: "WATCH",
      className: "bg-yellow-600/10 text-yellow-700 dark:text-yellow-400 border-yellow-600/20 hover:bg-yellow-600/20",
    },
  };

  const { icon: Icon, label, className: badgeClassName } = config[type];

  return (
    <Badge 
      className={cn("gap-1 px-3 py-1 font-semibold", badgeClassName, className)}
      data-testid={`signal-badge-${type}`}
    >
      <Icon className="h-3 w-3" />
      {label}
      {confidence !== undefined && (
        <span className="ml-1 font-mono text-xs">({confidence}%)</span>
      )}
    </Badge>
  );
}