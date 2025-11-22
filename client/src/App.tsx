import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import QueryInterface from "@/pages/query-interface";
import NotFound from "@/pages/not-found";
import { Database } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/query" component={QueryInterface} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="scadea-theme">
        <TooltipProvider>
          <div className="flex min-h-screen flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                <Link href="/">
                  <div className="flex items-center gap-3 cursor-pointer hover-elevate active-elevate-2 rounded-lg px-3 py-2 -ml-3" data-testid="link-home">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Database className="h-5 w-5" />
                    </div>
                    <div className="hidden sm:block">
                      <h1 className="text-sm font-semibold leading-tight">
                        Scadea Oracle AI Agent
                      </h1>
                      <p className="text-xs text-muted-foreground">
                        Accelerator Demo
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
