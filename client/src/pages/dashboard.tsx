import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Database, 
  FileText, 
  Package, 
  TrendingUp, 
  Search,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardMetrics, QueryTemplate, Query } from "@shared/schema";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<QueryTemplate[]>({
    queryKey: ["/api/query-templates"],
  });

  const { data: recentQueries, isLoading: queriesLoading } = useQuery<Query[]>({
    queryKey: ["/api/queries/recent"],
  });

  const metricCards = [
    {
      title: "Total Sales",
      value: metrics?.totalSales ? `$${metrics.totalSales.toLocaleString()}` : "$0",
      icon: TrendingUp,
      color: "text-chart-1",
    },
    {
      title: "Pending Orders",
      value: metrics?.pendingOrders?.toString() || "0",
      icon: FileText,
      color: "text-chart-4",
    },
    {
      title: "Active Work Orders",
      value: metrics?.activeWorkOrders?.toString() || "0",
      icon: Database,
      color: "text-chart-3",
    },
    {
      title: "Overdue Invoices",
      value: metrics?.overdueInvoices?.toString() || "0",
      icon: Package,
      color: "text-chart-5",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="flex flex-col items-center text-center">
            <img 
              src="https://scadea.com/wp-content/uploads/2025/10/scadea-logo.png" 
              alt="Scadea Logo"
              className="mb-6 h-auto w-96 object-contain"
              data-testid="img-scadea-logo"
            />
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Powered by OCI Generative AI</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Oracle EBS AI Assistant
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
              Query your Oracle E-Business Suite data using natural language. 
              Ask questions in plain English and get instant SQL-powered insights.
            </p>
            <Link href="/query">
              <Button size="lg" className="gap-2" data-testid="button-start-querying">
                <Search className="h-5 w-5" />
                Start Querying
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Metrics Grid */}
        <section className="py-8">
          <h2 className="mb-6 text-2xl font-semibold md:text-3xl">
            Key Metrics Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-5 rounded" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-20" />
                    </CardContent>
                  </Card>
                ))
              : metricCards.map((metric, i) => (
                  <Card key={i} data-testid={`card-metric-${i}`}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {metric.title}
                      </CardTitle>
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid={`text-metric-value-${i}`}>
                        {metric.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </section>

        {/* Quick Query Templates */}
        <section className="py-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold md:text-3xl">
              Quick Query Templates
            </h2>
            <Link href="/query">
              <Button variant="ghost" className="gap-2" data-testid="button-view-all-templates">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templatesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="mb-2 h-5 w-5 rounded" />
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))
              : templates?.slice(0, 6).map((template) => (
                  <Link key={template.id} href={`/query?template=${template.id}`}>
                    <Card 
                      className="h-full transition-all hover-elevate active-elevate-2 cursor-pointer"
                      data-testid={`card-template-${template.id}`}
                    >
                      <CardHeader>
                        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Search className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-mono text-muted-foreground">
                          "{template.exampleQuery}"
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="py-8 pb-16">
          <h2 className="mb-6 text-2xl font-semibold md:text-3xl">
            Recent Queries
          </h2>
          {queriesLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : recentQueries && recentQueries.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentQueries.slice(0, 5).map((query) => (
                    <Link key={query.id} href={`/query?id=${query.id}`}>
                      <div 
                        className="flex items-start gap-4 rounded-lg p-3 transition-all hover-elevate active-elevate-2"
                        data-testid={`item-recent-query-${query.id}`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          query.status === 'success' 
                            ? 'bg-chart-2/10 text-chart-2' 
                            : query.status === 'error'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-chart-4/10 text-chart-4'
                        }`}>
                          <Search className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium leading-tight">
                            {query.userQuestion}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(query.createdAt).toLocaleString()} • {query.status}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">No queries yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Start exploring your EBS data with natural language queries
                </p>
                <Link href="/query">
                  <Button data-testid="button-create-first-query">
                    Create Your First Query
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
