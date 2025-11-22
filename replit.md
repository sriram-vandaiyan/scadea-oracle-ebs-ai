# Scadea Oracle AI Agent Accelerator Demo

## Project Overview
A sophisticated enterprise application demonstrating natural language query capabilities for Oracle E-Business Suite (EBS) data using OCI Generative AI integration. This proof-of-concept showcases how users can query EBS data using conversational language without SQL knowledge.

## Purpose & Goals
- **Primary Goal**: Demonstrate AI-powered natural language to SQL conversion for Oracle EBS 12.2
- **User Experience**: Enable non-technical users to query enterprise data conversationally
- **Technology Stack**: React + TypeScript frontend, Express.js backend, OpenAI GPT-5 for NLQ processing
- **Architecture**: RAG (Retrieval-Augmented Generation) approach with mock EBS database

## Current State
**Phase**: MVP Implementation Complete - Ready for Testing
- ✅ Complete data schema defined for queries, EBS mock data (sales, work orders, invoices, inventory)
- ✅ Oracle-inspired design system configured with enterprise blue theme
- ✅ Dashboard page with metrics overview, quick query templates, recent activity
- ✅ Query Interface page with natural language input, AI interpretation display, SQL viewer, results table
- ✅ Query history sidebar with status tracking
- ✅ Theme toggle (light/dark mode) with proper color variables
- ✅ All loading, error, and empty states implemented
- ✅ Backend API implementation complete with all endpoints
- ✅ OpenAI GPT-5 integration for SQL generation with RAG context
- ✅ Enhanced SQL execution engine with WHERE, ORDER BY, LIMIT support
- ✅ Real-time polling for query status updates
- 🔄 Architecture review and testing in progress

## Recent Changes
**November 15, 2025 - Complete MVP Implementation**

**Frontend Layer:**
- Initial project setup and architecture design
- Created comprehensive data models for queries and mock EBS data (SalesOrder, WorkOrder, Invoice, InventoryItem)
- Configured design tokens with Oracle-inspired color palette (primary blue: 217° 91% 60%)
- Built complete frontend component library:
  - Dashboard with 4 metrics cards, 6 query templates, recent activity feed
  - Query Interface with natural language textarea, SQL display, results table
  - Query history sidebar with real-time status indicators
  - Theme provider and toggle for light/dark modes
- Set up routing with wouter (/ for Dashboard, /query for Query Interface)

**Backend Layer:**
- Implemented OpenAI service with GPT-5 for natural language to SQL conversion
- Created comprehensive schema context for RAG-based query generation
- Built API routes for all endpoints (/api/dashboard/metrics, /api/queries, etc.)
- Developed enhanced SQL execution engine with:
  - WHERE clause parsing (status, priority, region, date comparisons)
  - ORDER BY support with ASC/DESC
  - LIMIT/TOP clause handling
  - Column name mapping from snake_case to camelCase
- Implemented asynchronous query processing with real-time status updates
- Created 50 sales orders, 40 work orders, 35 invoices, 30 inventory items as mock data

**Integration Layer:**
- Connected all frontend components to backend APIs
- Added real-time polling (1 second interval) for query status updates
- Implemented query history refresh every 2 seconds
- Added comprehensive error handling and toast notifications
- Configured CSV export functionality for query results

## Project Architecture

### Frontend Structure
```
client/src/
├── components/
│   ├── ui/ (shadcn components - Card, Button, Badge, Table, etc.)
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── pages/
│   ├── dashboard.tsx (landing page with metrics & templates)
│   ├── query-interface.tsx (main NLQ interface)
│   └── not-found.tsx
├── lib/
│   ├── queryClient.ts (TanStack Query setup)
│   └── utils.ts
├── App.tsx (routing & layout)
└── index.css (design tokens)
```

### Backend Structure
```
server/
├── index.ts (Express server setup)
├── routes.ts (API endpoints - to be implemented)
├── storage.ts (in-memory data store with mock EBS data)
└── vite.ts (Vite dev server integration)
```

### Data Models
**Query Schema**: Stores user questions, generated SQL, AI interpretation, results, status
**Mock EBS Data**: 
- SalesOrders: 50 records with customer, amount, region, status
- WorkOrders: 40 records with priority, status, department, assigned team
- Invoices: 35 records with vendor, amounts, payment terms, due dates
- InventoryItems: 30 records with quantities, prices, warehouses

## Key Features Implemented

### Dashboard Page
1. **Hero Section**: Branded header with gradient background, call-to-action to start querying
2. **Metrics Cards**: 4-column responsive grid showing:
   - Total Sales (with dollar formatting)
   - Pending Orders count
   - Active Work Orders count
   - Overdue Invoices count
3. **Query Templates**: 6 pre-built templates (Sales Analytics, Work Orders, Invoice Processing, Inventory)
4. **Recent Activity**: Last 5 queries with status badges and timestamps

### Query Interface Page
1. **Natural Language Input**: Large textarea with character count, Ctrl+Enter submit
2. **Query Processing**: Real-time status (processing, success, error) with appropriate icons
3. **AI Interpretation**: Display of how the AI understood the question
4. **SQL Viewer**: Collapsible code block showing generated SQL with copy button
5. **Results Table**: Responsive table with horizontal scroll, alternating row backgrounds
6. **Export Functionality**: CSV download button for query results
7. **Query History Sidebar**: Chronological list of all queries with status indicators

### Design System
- **Colors**: Primary blue (217° 91% 60%), Oracle-inspired enterprise palette
- **Typography**: Inter for UI, JetBrains Mono for code/SQL
- **Spacing**: Consistent 4px-based scale (p-4, p-6, py-8, py-12)
- **Components**: Shadcn UI with custom hover/active elevation states
- **Responsive**: Mobile-first with breakpoints at 640px, 1024px
- **Dark Mode**: Full support with proper contrast in both themes

## User Preferences
- **Design Philosophy**: Enterprise-grade, Oracle-inspired, professional polish
- **Interaction Style**: Minimal clicks, keyboard shortcuts (Ctrl+Enter), instant feedback
- **Visual Priority**: Clean data presentation, clear status indicators, generous whitespace
- **Accessibility**: High contrast ratios, proper ARIA labels, keyboard navigation

## API Endpoints (To Be Implemented)
- `GET /api/dashboard/metrics` - Dashboard statistics
- `GET /api/query-templates` - Pre-built query templates
- `GET /api/queries/recent` - Last 5 queries
- `GET /api/queries/history` - All queries chronologically
- `GET /api/queries/:id` - Specific query details
- `POST /api/queries` - Submit new natural language query (triggers OpenAI processing)

## Technology Decisions

### Why OpenAI GPT-5?
- Latest model (released Aug 7, 2025) with superior natural language understanding
- JSON response format for structured SQL generation
- Vision capabilities for potential future document analysis features

### Why In-Memory Storage?
- Fast prototyping and demonstration
- No database setup complexity
- Easy to reset and regenerate mock data
- Sufficient for POC/demo purposes

### Why Wouter for Routing?
- Lightweight (1.6KB) vs React Router
- Simple API matching project complexity
- Built-in hooks (useLocation, useSearch)

## Next Steps
1. **Backend Implementation**: Build API routes with OpenAI integration for NLQ to SQL
2. **Query Execution Engine**: Implement SQL parser and execution against mock data
3. **Error Handling**: Comprehensive error messages for invalid queries
4. **Testing**: E2E testing with Playwright for user journeys
5. **Polish**: Final UX refinements, loading state optimizations

## Environment Variables
- `OPENAI_API_KEY`: Required for AI-powered SQL generation
- `SESSION_SECRET`: For session management (if implementing auth)

## Development Commands
- `npm run dev`: Start development server (frontend + backend)
- Frontend: http://localhost:5000
- Backend API: http://localhost:5000/api

## Notes
- Using TanStack Query v5 (object form for all hooks)
- All API requests use `apiRequest(method, url, data)` helper from queryClient
- Theme toggle persists preference to localStorage
- Mock data includes realistic business scenarios (overdue invoices, delayed work orders, low inventory)
