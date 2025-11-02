import { cn } from "@/lib/utils";

interface CryptoLogoProps {
  symbol: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CryptoLogo({ symbol, name, size = "md", className }: CryptoLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };
  
  // Use CoinGecko's image API
  const imageUrl = `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
  
  return (
    <div className={cn("relative flex items-center justify-center rounded-full overflow-hidden bg-muted", sizeClasses[size], className)}>
      <img
        src={imageUrl}
        alt={name || symbol}
        className="h-full w-full object-cover"
        onError={(e) => {
          // Fallback to first letter if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextSibling) {
            (target.nextSibling as HTMLElement).style.display = 'flex';
          }
        }}
        data-testid={`crypto-logo-${symbol.toLowerCase()}`}
      />
      <div className="absolute inset-0 hidden items-center justify-center bg-primary text-primary-foreground font-bold">
        {symbol.charAt(0)}
      </div>
    </div>
  );
}