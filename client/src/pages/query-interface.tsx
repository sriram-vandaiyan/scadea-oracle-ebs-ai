import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { 
  Send, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  ChevronDown,
  ChevronUp,
  Download,
  Sparkles,
  History,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Query, QueryTemplate } from "@shared/schema";

export default function QueryInterface() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [showSql, setShowSql] = useState(true);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);

  // Parse URL params
  const params = new URLSearchParams(search);
  const templateId = params.get("template");
  const queryId = params.get("id");

  // Fetch templates
  const { data: templates } = useQuery<QueryTemplate[]>({
    queryKey: ["/api/query-templates"],
  });

  // Fetch query history
  const { data: queryHistory } = useQuery<Query[]>({
    queryKey: ["/api/queries/history"],
    refetchInterval: 2000, // Refresh every 2 seconds to get updates
  });

  // Fetch specific query if ID is provided
  const { data: currentQuery } = useQuery<Query>({
    queryKey: ["/api/queries", queryId],
    enabled: !!queryId,
  });

  // Poll active query for real-time updates
  const { data: polledQuery } = useQuery<Query>({
    queryKey: ["/api/queries", activeQueryId],
    enabled: !!activeQueryId,
    refetchInterval: (data) => {
      // Stop polling if query is no longer processing
      if (data?.status === 'success' || data?.status === 'error') {
        return false;
      }
      // Poll every 1 second while processing
      return 1000;
    },
  });

  // Load template or query from URL
  useEffect(() => {
    if (templateId && templates) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setQuestion(template.exampleQuery);
      }
    }
  }, [templateId, templates]);

  useEffect(() => {
    if (currentQuery) {
      setActiveQueryId(currentQuery.id);
    }
  }, [currentQuery]);

  // Submit query mutation
  const submitMutation = useMutation({
    mutationFn: async (userQuestion: string) => {
      return await apiRequest("POST", "/api/queries", { userQuestion });
    },
    onSuccess: (data: Query) => {
      queryClient.invalidateQueries({ queryKey: ["/api/queries/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queries/recent"] });
      setActiveQueryId(data.id);
      toast({
        title: "Query submitted",
        description: "Processing your natural language query...",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit query. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!question.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a question to query your EBS data.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(question.trim());
  };

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    toast({
      title: "Copied",
      description: "SQL query copied to clipboard",
    });
  };

  const handleExportResults = (query: Query) => {
    if (!query.resultData) return;
    
    const data = JSON.parse(query.resultData);
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  // Use polled query if available (most up-to-date), otherwise fall back to history or current
  const activeQuery = polledQuery || queryHistory?.find(q => q.id === activeQueryId) || currentQuery;

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      {/* Main Query Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Query Input Section */}
        <div className="border-b bg-background p-4 md:p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold">Natural Language Query</h1>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Ask questions about your Oracle EBS data in plain English
            </p>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Ask anything about your EBS data... e.g., 'Show delayed work orders' or 'What are sales figures for last quarter?'"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-32 resize-none text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSubmit();
                  }
                }}
                data-testid="input-query-question"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {question.length} characters • Press Ctrl+Enter to submit
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !question.trim()}
                  className="gap-2"
                  data-testid="button-submit-query"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Query
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {activeQuery ? (
                <>
                  {/* Query Status */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {activeQuery.userQuestion}
                            </CardTitle>
                            {activeQuery.status === 'success' && (
                              <Badge variant="outline" className="gap-1 bg-chart-2/10 text-chart-2">
                                <CheckCircle2 className="h-3 w-3" />
                                Success
                              </Badge>
                            )}
                            {activeQuery.status === 'error' && (
                              <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive">
                                <XCircle className="h-3 w-3" />
                                Error
                              </Badge>
                            )}
                            {activeQuery.status === 'processing' && (
                              <Badge variant="outline" className="gap-1 bg-chart-4/10 text-chart-4">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Processing
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {new Date(activeQuery.createdAt).toLocaleString()}
                            {activeQuery.executionTimeMs && ` • Executed in ${activeQuery.executionTimeMs}ms`}
                          </CardDescription>
                        </div>
                        {activeQuery.status === 'success' && activeQuery.resultData && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportResults(activeQuery)}
                            className="gap-2"
                            data-testid="button-export-results"
                          >
                            <Download className="h-4 w-4" />
                            Export CSV
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                  </Card>

                  {/* AI Interpretation */}
                  {activeQuery.aiInterpretation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Interpretation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{activeQuery.aiInterpretation}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Generated SQL */}
                  {activeQuery.generatedSql && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Generated SQL Query</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopySql(activeQuery.generatedSql!)}
                              className="gap-2"
                              data-testid="button-copy-sql"
                            >
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowSql(!showSql)}
                              className="gap-2"
                              data-testid="button-toggle-sql"
                            >
                              {showSql ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  Show
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {showSql && (
                        <CardContent>
                          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm font-mono">
                            <code>{activeQuery.generatedSql}</code>
                          </pre>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Query Results */}
                  {activeQuery.status === 'success' && activeQuery.resultData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Query Results</CardTitle>
                        <CardDescription>
                          {JSON.parse(activeQuery.resultData).length} rows returned
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <QueryResultsTable data={JSON.parse(activeQuery.resultData)} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Error Message */}
                  {activeQuery.status === 'error' && activeQuery.errorMessage && (
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-destructive">
                          <XCircle className="h-5 w-5" />
                          Query Error
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-destructive">{activeQuery.errorMessage}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mb-2 text-lg font-semibold">Ready to Query</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your question above to start querying your EBS data
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Query History Sidebar */}
      <div className="w-full border-t lg:w-80 lg:border-l lg:border-t-0">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Query History</h2>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {queryHistory && queryHistory.length > 0 ? (
                queryHistory.map((query) => (
                  <button
                    key={query.id}
                    onClick={() => setActiveQueryId(query.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-all hover-elevate active-elevate-2 ${
                      activeQueryId === query.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    }`}
                    data-testid={`button-history-${query.id}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {query.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-chart-2" />
                      )}
                      {query.status === 'error' && (
                        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                      )}
                      {query.status === 'processing' && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-chart-4" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(query.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium">
                      {query.userQuestion}
                    </p>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center">
                  <History className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No query history</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// Results Table Component
function QueryResultsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No results found
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-query-results">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left font-semibold"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b hover-elevate">
              {columns.map((col) => (
                <td key={col} className="px-4 py-3">
                  {typeof row[col] === 'object' 
                    ? JSON.stringify(row[col]) 
                    : String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
