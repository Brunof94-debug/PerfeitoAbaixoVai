import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrendingUp, Home, BarChart, Zap, Bell, BarChart3, CreditCard, Star, User } from "lucide-react";
import { Link, useLocation } from "wouter";

// Pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Markets from "@/pages/markets";
import Signals from "@/pages/signals";
import Alerts from "@/pages/alerts";
import Backtests from "@/pages/backtests";
import Subscription from "@/pages/subscription";
import Watchlist from "@/pages/watchlist";
import CryptoDetail from "@/pages/crypto-detail";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

const menuItems = [
  { title: "Dashboard", icon: Home, href: "/" },
  { title: "Markets", icon: BarChart, href: "/markets" },
  { title: "Watchlist", icon: Star, href: "/watchlist" },
  { title: "Signals", icon: Zap, href: "/signals" },
  { title: "Alerts", icon: Bell, href: "/alerts" },
  { title: "Backtests", icon: BarChart3, href: "/backtests" },
  { title: "Subscription", icon: CreditCard, href: "/subscription" },
  { title: "Profile", icon: User, href: "/profile" },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-lg">CryptoSignal</span>
            <p className="text-xs text-muted-foreground">AI Trading Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AuthenticatedRouter() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/markets" component={Markets} />
              <Route path="/watchlist" component={Watchlist} />
              <Route path="/crypto/:id" component={CryptoDetail} />
              <Route path="/signals" component={Signals} />
              <Route path="/alerts" component={Alerts} />
              <Route path="/backtests" component={Backtests} />
              <Route path="/subscription" component={Subscription} />
              <Route path="/profile" component={Profile} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/*" component={AuthenticatedRouter} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}