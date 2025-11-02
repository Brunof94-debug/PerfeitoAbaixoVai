import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4" data-testid="offline-banner">
      {!isOnline ? (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <WifiOff className="h-4 w-4" />
          <AlertDescription data-testid="text-offline-message">
            You're currently offline. Showing cached data. Some features may be unavailable.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="max-w-2xl mx-auto bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200" data-testid="text-online-message">
            Back online! All features restored.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
