import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Bell, Shield, LogOut, Download, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Redirect to home page after successful logout
        window.location.href = '/';
      } else {
        toast({ 
          title: "Logout failed", 
          description: "Please try again.",
          variant: "destructive" 
        });
        setIsLoggingOut(false);
      }
    } catch (error) {
      toast({ 
        title: "Logout failed", 
        description: "Please try again.",
        variant: "destructive" 
      });
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  const tierBadgeColor = {
    basic: "bg-gray-600/10 text-gray-700 dark:text-gray-400 border-gray-600/20",
    pro: "bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20",
    expert: "bg-purple-600/10 text-purple-700 dark:text-purple-400 border-purple-600/20",
  }[user.subscriptionTier] || "";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal details and subscription status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  }
                </h3>
                <Badge className={tierBadgeColor}>
                  {user.subscriptionTier.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Member Since</p>
              <p className="font-semibold">
                {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Unknown'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Subscription Tier</p>
              <p className="font-semibold capitalize">{user.subscriptionTier}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Current Plan: {user.subscriptionTier.toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">
                {user.subscriptionTier === 'basic' && 'Free forever - upgrade for more features'}
                {user.subscriptionTier === 'pro' && '$29/month - Billed monthly'}
                {user.subscriptionTier === 'expert' && '$99/month - Billed monthly'}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/subscription')}
              data-testid="button-manage-subscription"
            >
              Manage Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure your alert preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive signal alerts via email</p>
              </div>
              <Button 
                variant={emailNotificationsEnabled ? "default" : "outline"} 
                size="sm" 
                onClick={() => {
                  setEmailNotificationsEnabled(!emailNotificationsEnabled);
                  toast({ title: `Email notifications ${emailNotificationsEnabled ? 'disabled' : 'enabled'}` });
                }}
                data-testid="button-toggle-email"
              >
                {emailNotificationsEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when price targets are hit</p>
              </div>
              <Button 
                variant={priceAlertsEnabled ? "default" : "outline"} 
                size="sm" 
                onClick={() => {
                  setPriceAlertsEnabled(!priceAlertsEnabled);
                  toast({ title: `Price alerts ${priceAlertsEnabled ? 'disabled' : 'enabled'}` });
                }}
                data-testid="button-toggle-price-alerts"
              >
                {priceAlertsEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>Manage your data and account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => toast({ 
              title: "Export requested", 
              description: "Your data will be sent to your email within 24 hours." 
            })}
            data-testid="button-export-data"
          >
            <Download className="mr-2 h-4 w-4" />
            Export My Data (LGPD)
          </Button>
          <Button 
            variant="destructive" 
            className="w-full justify-start" 
            onClick={() => toast({ 
              title: "Account deletion", 
              description: "Please contact support to delete your account.",
              variant: "destructive"
            })}
            data-testid="button-delete-account"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete My Account
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}