import { 
  type Query, 
  type InsertQuery,
  type DashboardMetrics,
  type QueryTemplate,
  type SalesOrder,
  type WorkOrder,
  type Invoice,
  type InventoryItem
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Query operations
  createQuery(query: InsertQuery): Promise<Query>;
  getQuery(id: string): Promise<Query | undefined>;
  updateQuery(id: string, updates: Partial<Query>): Promise<Query | undefined>;
  getRecentQueries(limit?: number): Promise<Query[]>;
  getQueryHistory(): Promise<Query[]>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<DashboardMetrics>;
  
  // Query templates
  getQueryTemplates(): Promise<QueryTemplate[]>;
  
  // Mock EBS data operations
  getSalesOrders(): Promise<SalesOrder[]>;
  getWorkOrders(): Promise<WorkOrder[]>;
  getInvoices(): Promise<Invoice[]>;
  getInventoryItems(): Promise<InventoryItem[]>;
  
  // Execute SQL on mock data
  executeSqlQuery(sql: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private queries: Map<string, Query>;
  private salesOrders: SalesOrder[];
  private workOrders: WorkOrder[];
  private invoices: Invoice[];
  private inventoryItems: InventoryItem[];

  constructor() {
    this.queries = new Map();
    this.salesOrders = this.initSalesOrders();
    this.workOrders = this.initWorkOrders();
    this.invoices = this.initInvoices();
    this.inventoryItems = this.initInventoryItems();
  }

  // Query operations
  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const id = randomUUID();
    const query: Query = {
      id,
      ...insertQuery,
      generatedSql: null,
      aiInterpretation: null,
      resultData: null,
      status: "processing",
      errorMessage: null,
      executionTimeMs: null,
      createdAt: new Date(),
    };
    this.queries.set(id, query);
    return query;
  }

  async getQuery(id: string): Promise<Query | undefined> {
    return this.queries.get(id);
  }

  async updateQuery(id: string, updates: Partial<Query>): Promise<Query | undefined> {
    const query = this.queries.get(id);
    if (!query) return undefined;
    
    const updated = { ...query, ...updates };
    this.queries.set(id, updated);
    return updated;
  }

  async getRecentQueries(limit: number = 5): Promise<Query[]> {
    return Array.from(this.queries.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getQueryHistory(): Promise<Query[]> {
    return Array.from(this.queries.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const totalSales = this.salesOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    
    const pendingOrders = this.salesOrders.filter(o => o.status === 'pending').length;
    const activeWorkOrders = this.workOrders.filter(w => w.status === 'in-progress').length;
    const overdueInvoices = this.invoices.filter(i => {
      return i.status === 'pending' && new Date(i.dueDate) < new Date();
    }).length;

    return {
      totalSales,
      pendingOrders,
      activeWorkOrders,
      overdueInvoices,
    };
  }

  // Query templates
  async getQueryTemplates(): Promise<QueryTemplate[]> {
    return [
      {
        id: "sales-last-quarter",
        category: "Sales Analytics",
        title: "Last Quarter Sales",
        description: "View sales performance for the previous quarter",
        exampleQuery: "What are our sales figures for the last quarter?",
        icon: "chart",
      },
      {
        id: "delayed-work-orders",
        category: "Work Orders",
        title: "Delayed Work Orders",
        description: "Find all work orders that are behind schedule",
        exampleQuery: "Show me all delayed work orders",
        icon: "alert",
      },
      {
        id: "pending-invoices",
        category: "Invoice Processing",
        title: "Pending Invoices",
        description: "List all invoices awaiting payment",
        exampleQuery: "Show all pending invoices",
        icon: "file",
      },
      {
        id: "low-inventory",
        category: "Inventory Status",
        title: "Low Stock Items",
        description: "Items below reorder level",
        exampleQuery: "Which inventory items are running low?",
        icon: "package",
      },
      {
        id: "top-customers",
        category: "Sales Analytics",
        title: "Top Customers",
        description: "Customers with highest order values",
        exampleQuery: "Who are our top 5 customers by total sales?",
        icon: "users",
      },
      {
        id: "overdue-invoices",
        category: "Invoice Processing",
        title: "Overdue Invoices",
        description: "Invoices past their due date",
        exampleQuery: "Show overdue invoices",
        icon: "alert-circle",
      },
    ];
  }

  // Mock EBS data getters
  async getSalesOrders(): Promise<SalesOrder[]> {
    return this.salesOrders;
  }

  async getWorkOrders(): Promise<WorkOrder[]> {
    return this.workOrders;
  }

  async getInvoices(): Promise<Invoice[]> {
    return this.invoices;
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return this.inventoryItems;
  }

  // Execute SQL - enhanced mock implementation with basic SQL parsing
  async executeSqlQuery(sql: string): Promise<any[]> {
    const lowerSql = sql.toLowerCase().trim();
    
    // Validate SQL starts with SELECT
    if (!lowerSql.startsWith('select')) {
      throw new Error('Only SELECT queries are supported');
    }
    
    // Determine which table to query
    let data: any[] = [];
    let tableName = '';
    
    if (lowerSql.includes('sales_orders')) {
      data = [...this.salesOrders];
      tableName = 'sales_orders';
    } else if (lowerSql.includes('work_orders')) {
      data = [...this.workOrders];
      tableName = 'work_orders';
    } else if (lowerSql.includes('invoices')) {
      data = [...this.invoices];
      tableName = 'invoices';
    } else if (lowerSql.includes('inventory_items')) {
      data = [...this.inventoryItems];
      tableName = 'inventory_items';
    } else {
      throw new Error('No valid table found in query. Supported tables: sales_orders, work_orders, invoices, inventory_items');
    }

    try {
      // Apply WHERE conditions
      data = this.applyWhereConditions(data, sql);

      // Apply ORDER BY
      data = this.applyOrderBy(data, sql);

      // Apply LIMIT/TOP
      data = this.applyLimit(data, sql);

      return data;
    } catch (error) {
      throw new Error(`SQL execution error on ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private applyWhereConditions(data: any[], sql: string): any[] {
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER BY|LIMIT|TOP|$)/i);
    if (!whereMatch) return data;

    const whereClause = whereMatch[1].trim();
    
    return data.filter(row => {
      // Handle common WHERE patterns
      
      // Status equality
      if (whereClause.match(/status\s*=\s*['"](\w+)['"]/i)) {
        const statusMatch = whereClause.match(/status\s*=\s*['"](\w+)['"]/i);
        if (statusMatch && row.status !== statusMatch[1]) return false;
      }

      // Priority equality
      if (whereClause.match(/priority\s*=\s*['"](\w+)['"]/i)) {
        const priorityMatch = whereClause.match(/priority\s*=\s*['"](\w+)['"]/i);
        if (priorityMatch && row.priority !== priorityMatch[1]) return false;
      }

      // Region equality
      if (whereClause.match(/region\s*=\s*['"](\w+)['"]/i)) {
        const regionMatch = whereClause.match(/region\s*=\s*['"](\w+)['"]/i);
        if (regionMatch && row.region !== regionMatch[1]) return false;
      }

      // Date comparisons - overdue invoices
      if (whereClause.match(/due_date\s*<\s*(?:GETDATE|CURRENT_DATE|NOW)/i)) {
        if (row.dueDate) {
          const dueDate = new Date(row.dueDate);
          if (dueDate >= new Date()) return false;
        }
      }

      // Date comparisons - scheduled date for delayed work orders
      if (whereClause.match(/scheduled_date\s*<\s*(?:GETDATE|CURRENT_DATE|NOW)/i)) {
        if (row.scheduledDate) {
          const schedDate = new Date(row.scheduledDate);
          if (schedDate >= new Date()) return false;
        }
      }

      // Low inventory - quantity <= reorder level
      if (whereClause.match(/quantity_on_hand\s*<=\s*reorder_level/i)) {
        if (row.quantityOnHand && row.reorderLevel) {
          if (row.quantityOnHand > row.reorderLevel) return false;
        }
      }

      // Date range for quarter
      if (whereClause.match(/order_date\s*>=\s*DATEADD\(quarter,\s*-1/i)) {
        if (row.orderDate) {
          const orderDate = new Date(row.orderDate);
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          if (orderDate < threeMonthsAgo) return false;
        }
      }

      // Handle OR conditions for delayed work orders
      if (whereClause.match(/status\s*=\s*['"]delayed['"]\s+OR/i)) {
        const isDelayed = row.status === 'delayed';
        const isOverdue = row.status === 'in-progress' && 
                         row.scheduledDate && 
                         new Date(row.scheduledDate) < new Date();
        if (!isDelayed && !isOverdue) return false;
      }

      return true;
    });
  }

  private applyOrderBy(data: any[], sql: string): any[] {
    const orderMatch = sql.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (!orderMatch) return data;

    const column = this.mapColumnName(orderMatch[1]);
    const direction = (orderMatch[2] || 'ASC').toUpperCase();

    return data.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Handle dates
      if (aVal instanceof Date || typeof aVal === 'string' && !isNaN(Date.parse(aVal))) {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        return direction === 'DESC' ? bDate - aDate : aDate - bDate;
      }

      // Handle numbers
      if (typeof aVal === 'number' || !isNaN(parseFloat(aVal))) {
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        return direction === 'DESC' ? bNum - aNum : aNum - bNum;
      }

      // Handle strings
      const comparison = String(aVal).localeCompare(String(bVal));
      return direction === 'DESC' ? -comparison : comparison;
    });
  }

  private applyLimit(data: any[], sql: string): any[] {
    // Handle LIMIT clause
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      return data.slice(0, parseInt(limitMatch[1]));
    }

    // Handle TOP clause
    const topMatch = sql.match(/SELECT\s+TOP\s+(\d+)/i);
    if (topMatch) {
      return data.slice(0, parseInt(topMatch[1]));
    }

    return data;
  }

  private mapColumnName(sqlColumn: string): string {
    // Map SQL column names to JavaScript property names (camelCase)
    const mapping: { [key: string]: string } = {
      'order_id': 'orderId',
      'order_number': 'orderNumber',
      'customer_name': 'customerName',
      'order_date': 'orderDate',
      'total_amount': 'totalAmount',
      'sales_rep': 'salesRep',
      'work_order_id': 'workOrderId',
      'work_order_number': 'workOrderNumber',
      'assigned_to': 'assignedTo',
      'scheduled_date': 'scheduledDate',
      'completion_date': 'completionDate',
      'invoice_id': 'invoiceId',
      'invoice_number': 'invoiceNumber',
      'vendor_name': 'vendorName',
      'invoice_date': 'invoiceDate',
      'due_date': 'dueDate',
      'payment_terms': 'paymentTerms',
      'item_id': 'itemId',
      'item_code': 'itemCode',
      'item_name': 'itemName',
      'quantity_on_hand': 'quantityOnHand',
      'unit_price': 'unitPrice',
      'reorder_level': 'reorderLevel',
    };

    return mapping[sqlColumn.toLowerCase()] || sqlColumn;
  }

  // Initialize mock data
  private initSalesOrders(): SalesOrder[] {
    const statuses = ['pending', 'completed', 'cancelled', 'processing'];
    const regions = ['North', 'South', 'East', 'West'];
    const customers = [
      'Acme Corporation', 'TechFlow Industries', 'Global Solutions Inc',
      'Summit Enterprises', 'Pinnacle Systems', 'Vertex Group',
      'Horizon Technologies', 'Meridian Corp', 'Atlas Industries',
      'Zenith Solutions'
    ];
    const salesReps = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Chen', 'Robert Wilson'];

    const orders: SalesOrder[] = [];
    const baseDate = new Date('2024-01-01');

    for (let i = 1; i <= 50; i++) {
      const orderDate = new Date(baseDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);
      orders.push({
        orderId: `SO-${1000 + i}`,
        orderNumber: `ORD-2024-${String(i).padStart(4, '0')}`,
        customerName: customers[Math.floor(Math.random() * customers.length)],
        orderDate,
        totalAmount: (Math.random() * 50000 + 5000).toFixed(2),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        salesRep: salesReps[Math.floor(Math.random() * salesReps.length)],
      });
    }

    return orders;
  }

  private initWorkOrders(): WorkOrder[] {
    const statuses = ['pending', 'in-progress', 'completed', 'delayed', 'cancelled'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const departments = ['Manufacturing', 'Maintenance', 'Quality Control', 'Production', 'Assembly'];
    const assignees = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon'];

    const orders: WorkOrder[] = [];
    const baseDate = new Date('2024-01-01');

    for (let i = 1; i <= 40; i++) {
      const scheduledDate = new Date(baseDate.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000);
      const hasCompleted = Math.random() > 0.5;
      
      orders.push({
        workOrderId: `WO-${2000 + i}`,
        workOrderNumber: `WRK-2024-${String(i).padStart(4, '0')}`,
        description: `Work order for ${departments[Math.floor(Math.random() * departments.length)]} operations`,
        assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        scheduledDate,
        completionDate: hasCompleted 
          ? new Date(scheduledDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)
          : null,
        department: departments[Math.floor(Math.random() * departments.length)],
      });
    }

    return orders;
  }

  private initInvoices(): Invoice[] {
    const statuses = ['pending', 'paid', 'overdue', 'cancelled'];
    const vendors = [
      'Office Supplies Co', 'Industrial Parts Ltd', 'Tech Equipment Inc',
      'Building Materials Corp', 'Energy Solutions', 'Logistics Partners',
      'Manufacturing Tools Ltd', 'Safety Equipment Co', 'IT Services Inc'
    ];
    const paymentTerms = ['Net 30', 'Net 60', 'Net 90', 'Due on Receipt', '2/10 Net 30'];

    const invoices: Invoice[] = [];
    const baseDate = new Date('2024-01-01');

    for (let i = 1; i <= 35; i++) {
      const invoiceDate = new Date(baseDate.getTime() + Math.random() * 300 * 24 * 60 * 60 * 1000);
      const daysToAdd = Math.random() > 0.5 ? 30 : 60;
      const dueDate = new Date(invoiceDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      
      invoices.push({
        invoiceId: `INV-${3000 + i}`,
        invoiceNumber: `IV-2024-${String(i).padStart(4, '0')}`,
        vendorName: vendors[Math.floor(Math.random() * vendors.length)],
        invoiceDate,
        dueDate,
        amount: (Math.random() * 25000 + 1000).toFixed(2),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        paymentTerms: paymentTerms[Math.floor(Math.random() * paymentTerms.length)],
      });
    }

    return invoices;
  }

  private initInventoryItems(): InventoryItem[] {
    const categories = ['Raw Materials', 'Finished Goods', 'Components', 'Tools', 'Supplies'];
    const warehouses = ['Warehouse A', 'Warehouse B', 'Warehouse C', 'Distribution Center'];

    const items: InventoryItem[] = [];

    for (let i = 1; i <= 30; i++) {
      const quantity = Math.floor(Math.random() * 1000);
      const reorderLevel = Math.floor(Math.random() * 200 + 50);
      
      items.push({
        itemId: `ITM-${4000 + i}`,
        itemCode: `ITEM-${String(i).padStart(4, '0')}`,
        itemName: `Inventory Item ${i}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        quantityOnHand: quantity,
        unitPrice: (Math.random() * 500 + 10).toFixed(2),
        reorderLevel,
        warehouse: warehouses[Math.floor(Math.random() * warehouses.length)],
      });
    }

    return items;
  }
}

export const storage = new MemStorage();
