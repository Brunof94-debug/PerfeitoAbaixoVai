import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceChangeProps {
  value: number;
  className?: string;
  showIcon?: boolean;
}

export function PriceChange({ value, className, showIcon = true }: PriceChangeProps) {
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 font-mono font-semibold tabular-nums",
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
        className
      )}
      data-testid={`price-change-${isPositive ? 'positive' : 'negative'}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}