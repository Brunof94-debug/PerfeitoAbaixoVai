import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const tiers = [
    {
      id: "basic",
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started with crypto trading",
      features: [
        "5 AI signals per day",
        "3 cryptocurrencies in watchlist",
        "Basic indicators (RSI, MACD)",
        "Price alerts (24h delay)",
        "Community support",
      ],
      limitations: [
        "Limited backtesting",
        "No API access",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For serious traders who need more insights",
      popular: true,
      features: [
        "Unlimited AI signals",
        "20 cryptocurrencies in watchlist",
        "All technical indicators",
        "Real-time price alerts",
        "Basic backtesting (100 tests/month)",
        "Priority support",
        "Signal confidence scores",
      ],
      limitations: [
        "Limited API calls",
      ],
    },
    {
      id: "expert",
      name: "Expert",
      price: "$99",
      period: "/month",
      description: "Advanced features for professional traders",
      features: [
        "Everything in Pro",
        "Unlimited watchlist",
        "Advanced backtesting",
        "Walk-forward analysis",
        "Full API access (10,000 calls/day)",
        "Dedicated support",
        "Early access to new features",
        "Custom signal strategies",
      ],
    },
  ];

  const currentTier = user?.subscriptionTier || 'basic';

  const handleUpgrade = async (tier: string) => {
    setIsUpgrading(true);
    try {
      const res = await apiRequest("POST", "/api/subscription/create-checkout", { tier });
      const data = await res.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsUpgrading(true);
    try {
      const res = await apiRequest("POST", "/api/subscription/create-portal");
      const data = await res.json();
      
      if (data.url) {
        // Redirect to Stripe Billing Portal
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose the plan that best fits your trading needs
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the {currentTier} plan</CardDescription>
            </div>
            <Badge className="capitalize" variant={currentTier === 'basic' ? 'secondary' : 'default'}>
              {currentTier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold font-mono">
                {tiers.find(t => t.id === currentTier)?.price}
                {currentTier !== 'basic' && <span className="text-base font-normal text-muted-foreground">/month</span>}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentTier === 'basic' ? 'No credit card required' : 'Billed monthly'}
              </p>
            </div>
            {currentTier !== 'basic' && (
              <Button 
                variant="outline" 
                onClick={handleManageBilling}
                disabled={isUpgrading}
                data-testid="button-manage-billing"
              >
                {isUpgrading ? "Opening..." : "Manage Billing"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const isCurrent = tier.id === currentTier;
          const isUpgrade = tier.id === 'pro' && currentTier === 'basic' || tier.id === 'expert' && currentTier !== 'expert';
          
          return (
            <Card 
              key={tier.id} 
              className={tier.popular ? "border-primary relative shadow-lg" : isCurrent ? "border-primary/50" : ""}
              data-testid={`plan-card-${tier.id}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}
              <CardHeader className={tier.popular ? "pt-8" : ""}>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-mono">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {isCurrent ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isUpgrading}
                    data-testid={`button-upgrade-${tier.id}`}
                  >
                    {isUpgrading ? "Loading..." : `Upgrade to ${tier.name}`}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                    data-testid={`button-downgrade-${tier.id}`}
                  >
                    Contact Support to Downgrade
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ / Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Can I change my plan anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the charges.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor Stripe.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Is there a free trial?</h4>
            <p className="text-sm text-muted-foreground">
              The Basic plan is completely free forever! You can try out the platform with no credit card required.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}