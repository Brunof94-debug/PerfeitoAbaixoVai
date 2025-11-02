import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Brain, BarChart3, Bell, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Signals",
      description: "Advanced machine learning algorithms analyze market patterns and generate high-confidence trading signals in real-time.",
    },
    {
      icon: BarChart3,
      title: "Technical Analysis",
      description: "Comprehensive indicators including RSI, MACD, EMA, Bollinger Bands, and VWAP to inform your trading decisions.",
    },
    {
      icon: TrendingUp,
      title: "Backtesting Engine",
      description: "Test your strategies against historical data with detailed performance metrics including win rate, profit factor, and Sharpe ratio.",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Configure price alerts, signal notifications, and custom triggers to never miss an opportunity.",
    },
    {
      icon: Zap,
      title: "Real-Time Data",
      description: "Live price updates via WebSocket connections with sub-second latency for active market monitoring.",
    },
    {
      icon: Shield,
      title: "Professional Grade",
      description: "Secure, reliable platform built with enterprise-level infrastructure and best practices.",
    },
  ];

  const tiers = [
    {
      name: "Basic",
      price: "Free",
      features: [
        "5 signals per day",
        "3 watched cryptocurrencies",
        "Basic indicators (RSI, MACD)",
        "24h price alerts",
        "Community support",
      ],
    },
    {
      name: "Pro",
      price: "$29/mo",
      popular: true,
      features: [
        "Unlimited signals",
        "20 watched cryptocurrencies",
        "All technical indicators",
        "Unlimited alerts",
        "Basic backtesting",
        "Priority support",
      ],
    },
    {
      name: "Expert",
      price: "$99/mo",
      features: [
        "Everything in Pro",
        "Unlimited watchlist",
        "Advanced backtesting",
        "Walk-forward analysis",
        "API access",
        "Dedicated support",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">CryptoSignal AI</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>AI-Powered Cryptocurrency Trading Signals</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Trade Smarter with{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              AI-Powered Insights
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:max-w-3xl md:mx-auto">
            Professional-grade trading signals powered by advanced AI and technical analysis.
            Get real-time market insights, backtesting tools, and smart alerts for Bitcoin, Ethereum, and 1000+ cryptocurrencies.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="text-lg" data-testid="button-get-started">
              <a href="/api/login">
                Get Started Free
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg" data-testid="button-view-signals">
              <a href="#features">
                Explore Features
              </a>
            </Button>
          </div>
          
          {/* Disclaimer */}
          <p className="mt-8 text-sm text-muted-foreground max-w-2xl mx-auto">
            ⚠️ <strong>Investment Disclaimer:</strong> Cryptocurrency trading carries significant risk.
            Signals are for informational purposes only and do not constitute financial advice.
            Always conduct your own research before making investment decisions.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Professional Trading Tools
          </h2>
          <p className="mb-12 text-center text-lg text-muted-foreground">
            Everything you need to make informed trading decisions
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover-elevate">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container px-4 py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mb-12 text-center text-lg text-muted-foreground">
            Choose the plan that fits your trading needs
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card 
                key={tier.name} 
                className={tier.popular ? "border-primary shadow-lg relative" : ""}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                      Most Popular
                    </div>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="mb-2 text-2xl font-bold">{tier.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold font-mono">{tier.price}</span>
                  </div>
                  <ul className="mb-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    asChild
                    data-testid={`button-subscribe-${tier.name.toLowerCase()}`}
                  >
                    <a href="/api/login">
                      Get Started
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="font-bold">CryptoSignal AI</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Professional trading signals powered by AI
                </p>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Features</li>
                  <li>Pricing</li>
                  <li>API Access</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Terms of Service</li>
                  <li>Privacy Policy</li>
                  <li>LGPD Compliance</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Documentation</li>
                  <li>Contact</li>
                  <li>Status</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
              <p>© 2025 CryptoSignal AI. All rights reserved.</p>
              <p className="mt-2">Not financial advice. Trade at your own risk.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}