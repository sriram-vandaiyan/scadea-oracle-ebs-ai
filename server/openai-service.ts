import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SQLGenerationResult {
  sql: string;
  interpretation: string;
  confidence: number;
}

// Schema information for RAG context
const EBS_SCHEMA_CONTEXT = `
You are an expert SQL generator for Oracle E-Business Suite (EBS) database queries.

Available Tables and Schemas:

1. sales_orders
   - order_id (VARCHAR, Primary Key)
   - order_number (VARCHAR)
   - customer_name (TEXT)
   - order_date (TIMESTAMP)
   - total_amount (DECIMAL)
   - status (VARCHAR) - values: 'pending', 'completed', 'cancelled', 'processing'
   - region (VARCHAR) - values: 'North', 'South', 'East', 'West'
   - sales_rep (TEXT)

2. work_orders
   - work_order_id (VARCHAR, Primary Key)
   - work_order_number (VARCHAR)
   - description (TEXT)
   - assigned_to (TEXT)
   - status (VARCHAR) - values: 'pending', 'in-progress', 'completed', 'delayed', 'cancelled'
   - priority (VARCHAR) - values: 'low', 'medium', 'high', 'urgent'
   - scheduled_date (TIMESTAMP)
   - completion_date (TIMESTAMP, nullable)
   - department (VARCHAR)

3. invoices
   - invoice_id (VARCHAR, Primary Key)
   - invoice_number (VARCHAR)
   - vendor_name (TEXT)
   - invoice_date (TIMESTAMP)
   - due_date (TIMESTAMP)
   - amount (DECIMAL)
   - status (VARCHAR) - values: 'pending', 'paid', 'overdue', 'cancelled'
   - payment_terms (VARCHAR)

4. inventory_items
   - item_id (VARCHAR, Primary Key)
   - item_code (VARCHAR)
   - item_name (TEXT)
   - category (VARCHAR)
   - quantity_on_hand (INTEGER)
   - unit_price (DECIMAL)
   - reorder_level (INTEGER)
   - warehouse (VARCHAR)

Rules:
- Use standard SQL syntax
- Return only SELECT queries (no INSERT, UPDATE, DELETE)
- Use appropriate WHERE clauses for filtering
- Use ORDER BY for sorting results
- Limit results to reasonable numbers (e.g., TOP 10, LIMIT 20)
- Use CAST or CONVERT for date comparisons
- For "last quarter" use: WHERE order_date >= DATEADD(quarter, -1, GETDATE())
- For "delayed" work orders: WHERE status = 'delayed' OR (status = 'in-progress' AND scheduled_date < GETDATE())
- For "overdue" invoices: WHERE status = 'pending' AND due_date < GETDATE()
- For "low inventory": WHERE quantity_on_hand <= reorder_level
`;

export async function generateSQLFromNaturalLanguage(
  userQuestion: string
): Promise<SQLGenerationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `${EBS_SCHEMA_CONTEXT}

Your task is to:
1. Understand the user's natural language question
2. Generate the appropriate SQL query
3. Provide a clear interpretation of what you understood
4. Return the response in JSON format

Response format:
{
  "sql": "SELECT ... FROM ... WHERE ...",
  "interpretation": "Clear explanation of what the query does",
  "confidence": 0.95
}`,
        },
        {
          role: "user",
          content: userQuestion,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      sql: result.sql || "",
      interpretation: result.interpretation || "Unable to generate interpretation",
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error(`Failed to generate SQL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Fallback SQL generator for when OpenAI API is unavailable
function generateFallbackSQL(userQuestion: string): SQLGenerationResult {
  const lowerQuestion = userQuestion.toLowerCase();
  
  // Pattern matching for common queries
  if (lowerQuestion.includes('pending') && lowerQuestion.includes('sales')) {
    return {
      sql: "SELECT * FROM sales_orders WHERE status = 'pending' ORDER BY order_date DESC LIMIT 20",
      interpretation: "Showing all pending sales orders, ordered by date (newest first), limited to 20 results",
      confidence: 0.85
    };
  }
  
  if (lowerQuestion.includes('delayed') && lowerQuestion.includes('work')) {
    return {
      sql: "SELECT * FROM work_orders WHERE status = 'delayed' ORDER BY scheduled_date ASC LIMIT 20",
      interpretation: "Showing all delayed work orders, ordered by scheduled date (oldest first), limited to 20 results",
      confidence: 0.85
    };
  }
  
  if (lowerQuestion.includes('overdue') && lowerQuestion.includes('invoice')) {
    return {
      sql: "SELECT * FROM invoices WHERE status = 'pending' AND due_date < CURRENT_TIMESTAMP ORDER BY due_date ASC LIMIT 20",
      interpretation: "Showing all overdue invoices (pending invoices past their due date), ordered by due date (oldest first), limited to 20 results",
      confidence: 0.85
    };
  }
  
  if (lowerQuestion.includes('low') && lowerQuestion.includes('inventory')) {
    return {
      sql: "SELECT * FROM inventory_items WHERE quantity_on_hand <= reorder_level ORDER BY quantity_on_hand ASC LIMIT 20",
      interpretation: "Showing all inventory items below reorder level, ordered by quantity (lowest first), limited to 20 results",
      confidence: 0.85
    };
  }
  
  if (lowerQuestion.includes('sales')) {
    return {
      sql: "SELECT * FROM sales_orders ORDER BY order_date DESC LIMIT 20",
      interpretation: "Showing recent sales orders, ordered by date (newest first), limited to 20 results",
      confidence: 0.7
    };
  }
  
  if (lowerQuestion.includes('work')) {
    return {
      sql: "SELECT * FROM work_orders ORDER BY scheduled_date DESC LIMIT 20",
      interpretation: "Showing recent work orders, ordered by scheduled date (newest first), limited to 20 results",
      confidence: 0.7
    };
  }
  
  if (lowerQuestion.includes('invoice')) {
    return {
      sql: "SELECT * FROM invoices ORDER BY invoice_date DESC LIMIT 20",
      interpretation: "Showing recent invoices, ordered by date (newest first), limited to 20 results",
      confidence: 0.7
    };
  }
  
  if (lowerQuestion.includes('inventory')) {
    return {
      sql: "SELECT * FROM inventory_items ORDER BY quantity_on_hand ASC LIMIT 20",
      interpretation: "Showing inventory items, ordered by quantity (lowest first), limited to 20 results",
      confidence: 0.7
    };
  }
  
  // Default fallback
  return {
    sql: "SELECT * FROM sales_orders ORDER BY order_date DESC LIMIT 10",
    interpretation: "Showing recent sales orders as a default query",
    confidence: 0.5
  };
}

// Enhanced query generation with RAG approach
export async function generateSQLWithContext(
  userQuestion: string,
  previousQueries?: Array<{ question: string; sql: string }>
): Promise<SQLGenerationResult> {
  try {
    // Build context from previous queries for better understanding
    let contextPrompt = EBS_SCHEMA_CONTEXT;
    
    if (previousQueries && previousQueries.length > 0) {
      contextPrompt += `\n\nRecent query patterns for context:\n`;
      previousQueries.slice(0, 3).forEach((pq, idx) => {
        contextPrompt += `${idx + 1}. Question: "${pq.question}"\n   SQL: ${pq.sql}\n`;
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `${contextPrompt}

Your task is to:
1. Understand the user's natural language question about Oracle EBS data
2. Generate an accurate, efficient SQL query
3. Provide a clear interpretation of what the query does
4. Assess your confidence in the generated query

Important:
- Use proper SQL syntax and best practices
- Consider performance and use appropriate indexes
- Return only SELECT statements
- Be specific about which tables and columns to query
- Handle common business terms (e.g., "last quarter", "overdue", "top customers")

Return JSON format:
{
  "sql": "SELECT ... FROM ... WHERE ...",
  "interpretation": "Clear, business-friendly explanation",
  "confidence": 0.95
}`,
        },
        {
          role: "user",
          content: userQuestion,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Validate the SQL starts with SELECT
    if (!result.sql || !result.sql.trim().toUpperCase().startsWith("SELECT")) {
      throw new Error("Generated query must be a SELECT statement");
    }

    return {
      sql: result.sql.trim(),
      interpretation: result.interpretation || "Generated SQL query based on your question",
      confidence: Math.min(Math.max(result.confidence || 0.7, 0), 1),
    };
  } catch (error) {
    console.error("OpenAI SQL Generation Error:", error);
    
    // Check if it's a rate limit error
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('quota'))) {
      console.log("OpenAI quota exceeded, using fallback SQL generator");
      return generateFallbackSQL(userQuestion);
    }
    
    throw new Error(`AI processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
