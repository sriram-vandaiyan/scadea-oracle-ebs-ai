import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSQLWithContext } from "./openai-service";
import { insertQuerySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (_req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Query templates
  app.get("/api/query-templates", async (_req, res) => {
    try {
      const templates = await storage.getQueryTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching query templates:", error);
      res.status(500).json({ error: "Failed to fetch query templates" });
    }
  });

  // Get recent queries
  app.get("/api/queries/recent", async (_req, res) => {
    try {
      const queries = await storage.getRecentQueries(5);
      res.json(queries);
    } catch (error) {
      console.error("Error fetching recent queries:", error);
      res.status(500).json({ error: "Failed to fetch recent queries" });
    }
  });

  // Get query history
  app.get("/api/queries/history", async (_req, res) => {
    try {
      const queries = await storage.getQueryHistory();
      res.json(queries);
    } catch (error) {
      console.error("Error fetching query history:", error);
      res.status(500).json({ error: "Failed to fetch query history" });
    }
  });

  // Get specific query
  app.get("/api/queries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const query = await storage.getQuery(id);
      
      if (!query) {
        return res.status(404).json({ error: "Query not found" });
      }
      
      res.json(query);
    } catch (error) {
      console.error("Error fetching query:", error);
      res.status(500).json({ error: "Failed to fetch query" });
    }
  });

  // Submit new query (Natural Language to SQL)
  app.post("/api/queries", async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertQuerySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validationResult.error.errors 
        });
      }

      const { userQuestion } = validationResult.data;

      // Create initial query record
      const query = await storage.createQuery({ userQuestion });

      // Return immediately while processing continues
      res.json(query);

      // Process query asynchronously
      processQueryAsync(query.id, userQuestion);
    } catch (error) {
      console.error("Error creating query:", error);
      res.status(500).json({ error: "Failed to create query" });
    }
  });

  // Async query processing
  async function processQueryAsync(queryId: string, userQuestion: string) {
    const startTime = Date.now();
    
    try {
      // Get recent queries for context (RAG approach)
      const recentQueries = await storage.getRecentQueries(5);
      const context = recentQueries
        .filter(q => q.generatedSql)
        .map(q => ({
          question: q.userQuestion,
          sql: q.generatedSql!,
        }));

      // Generate SQL using OpenAI with RAG context
      const result = await generateSQLWithContext(userQuestion, context);

      // Execute the generated SQL
      let resultData: any[] = [];
      let errorMessage: string | null = null;

      try {
        resultData = await storage.executeSqlQuery(result.sql);
      } catch (execError) {
        console.error("SQL Execution Error:", execError);
        errorMessage = `Failed to execute query: ${execError instanceof Error ? execError.message : "Unknown error"}`;
      }

      const executionTimeMs = Date.now() - startTime;

      // Update query with results
      await storage.updateQuery(queryId, {
        generatedSql: result.sql,
        aiInterpretation: result.interpretation,
        resultData: errorMessage ? null : JSON.stringify(resultData),
        status: errorMessage ? "error" : "success",
        errorMessage,
        executionTimeMs,
      });
    } catch (error) {
      console.error("Query Processing Error:", error);
      
      await storage.updateQuery(queryId, {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Failed to process query",
        executionTimeMs: Date.now() - startTime,
      });
    }
  }

  // Get mock EBS data (for debugging/testing)
  app.get("/api/ebs/sales-orders", async (_req, res) => {
    try {
      const orders = await storage.getSalesOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ error: "Failed to fetch sales orders" });
    }
  });

  app.get("/api/ebs/work-orders", async (_req, res) => {
    try {
      const orders = await storage.getWorkOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ error: "Failed to fetch work orders" });
    }
  });

  app.get("/api/ebs/invoices", async (_req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/ebs/inventory", async (_req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ error: "Failed to fetch inventory items" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
