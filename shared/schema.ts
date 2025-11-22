import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Query Schema - stores user queries and AI responses
export const queries = pgTable("queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userQuestion: text("user_question").notNull(),
  generatedSql: text("generated_sql"),
  aiInterpretation: text("ai_interpretation"),
  resultData: text("result_data"), // JSON stringified results
  status: varchar("status", { length: 20 }).notNull().default("processing"), // processing, success, error
  errorMessage: text("error_message"),
  executionTimeMs: integer("execution_time_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuerySchema = createInsertSchema(queries).pick({
  userQuestion: true,
});

export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;

// Mock EBS Data Schemas - for demonstration purposes

// Sales Orders
export const salesOrders = pgTable("sales_orders", {
  orderId: varchar("order_id").primaryKey(),
  orderNumber: varchar("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  orderDate: timestamp("order_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  region: varchar("region", { length: 50 }),
  salesRep: text("sales_rep"),
});

export type SalesOrder = typeof salesOrders.$inferSelect;

// Work Orders
export const workOrders = pgTable("work_orders", {
  workOrderId: varchar("work_order_id").primaryKey(),
  workOrderNumber: varchar("work_order_number").notNull(),
  description: text("description").notNull(),
  assignedTo: text("assigned_to"),
  status: varchar("status", { length: 20 }).notNull(),
  priority: varchar("priority", { length: 10 }).notNull(),
  scheduledDate: timestamp("scheduled_date"),
  completionDate: timestamp("completion_date"),
  department: varchar("department", { length: 50 }),
});

export type WorkOrder = typeof workOrders.$inferSelect;

// Invoices
export const invoices = pgTable("invoices", {
  invoiceId: varchar("invoice_id").primaryKey(),
  invoiceNumber: varchar("invoice_number").notNull(),
  vendorName: text("vendor_name").notNull(),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  paymentTerms: varchar("payment_terms", { length: 50 }),
});

export type Invoice = typeof invoices.$inferSelect;

// Inventory Items
export const inventoryItems = pgTable("inventory_items", {
  itemId: varchar("item_id").primaryKey(),
  itemCode: varchar("item_code").notNull(),
  itemName: text("item_name").notNull(),
  category: varchar("category", { length: 50 }),
  quantityOnHand: integer("quantity_on_hand").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  reorderLevel: integer("reorder_level"),
  warehouse: varchar("warehouse", { length: 50 }),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;

// Dashboard Metrics Type
export type DashboardMetrics = {
  totalSales: number;
  pendingOrders: number;
  activeWorkOrders: number;
  overdueInvoices: number;
};

// Query Template Type
export type QueryTemplate = {
  id: string;
  category: string;
  title: string;
  description: string;
  exampleQuery: string;
  icon: string;
};
