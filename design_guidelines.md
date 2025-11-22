# Scadea Oracle AI Agent Accelerator Demo - Design Guidelines

## Design Approach
**System-Based with Modern Enterprise Influence**
Combining Fluent Design System principles (enterprise productivity focus) with inspiration from Linear (clean data presentation) and Notion (intelligent interface design). Oracle's enterprise heritage demands professional polish while maintaining modern usability standards.

## Typography System

**Font Family**
- Primary: Inter (via Google Fonts CDN) - clean, professional, excellent readability
- Monospace: JetBrains Mono - for SQL queries, code snippets, technical data

**Type Scale**
- Hero/Primary Heading: text-4xl md:text-5xl, font-bold
- Section Headings: text-2xl md:text-3xl, font-semibold
- Card Titles: text-lg font-semibold
- Body Text: text-base, font-normal
- Captions/Metadata: text-sm, font-medium
- Technical/Query Text: text-sm font-mono

## Layout System

**Spacing Primitives**
Core spacing units: 2, 4, 6, 8, 12, 16, 20 (Tailwind scale)
- Component internal padding: p-4, p-6
- Section spacing: py-8, py-12, py-16
- Grid gaps: gap-4, gap-6
- Margins between major sections: mb-8, mb-12

**Container Structure**
- Max-width: max-w-7xl for main content area
- Dashboard grid: Single column mobile, 2-3 column desktop
- Query interface: 60/40 split (input area / history panel) on desktop, stacked mobile

## Component Library

### Navigation
**Top Application Bar**
- Fixed position header with application branding
- Height: h-16
- Contains: Logo + "Scadea Oracle AI Agent Accelerator Demo" title, user profile, settings icon
- Layout: Horizontal flex with space-between alignment

### Dashboard Cards (Landing View)
**Metrics Overview Cards** (4-column grid on desktop, 2-col tablet, 1-col mobile)
- Card structure: Rounded corners (rounded-lg), elevated shadow
- Internal padding: p-6
- Contains: Icon (top-left), metric value (text-3xl font-bold), label (text-sm text-muted), sparkline or trend indicator

**Quick Query Templates** (3-column grid desktop)
- Card structure: Clickable cards with hover elevation
- Contains: Category icon, template title, example query preview
- Common templates: Sales Analytics, Work Orders, Invoice Processing, Inventory Status

### Main Query Interface
**Natural Language Input Area**
- Prominent textarea with generous height (min-h-32)
- Placeholder: "Ask anything about your EBS data... e.g., 'Show delayed work orders' or 'What are sales figures for last quarter?'"
- Submit button: Large, primary action (px-8 py-3, rounded-lg)
- Character count indicator below input

**Query History Sidebar**
- Scrollable panel with individual history items
- Each item contains: timestamp, truncated query text, status indicator
- Click to restore previous query
- Clear history action at bottom

### Results Display Area
**Response Container**
- Two-part layout: AI Interpretation explanation + Data results
- AI Interpretation section: Shows how the query was understood, generated SQL (in code block with syntax highlighting)
- Expandable/collapsible SQL viewer with copy button

**Data Tables**
- Responsive table with horizontal scroll on mobile
- Header row: Sticky, bold, background differentiation
- Alternating row backgrounds for readability
- Action columns (if applicable) aligned right
- Export buttons above table (CSV, Excel)

**Empty States**
- Center-aligned illustration placeholder
- Helpful text: "No queries yet. Try asking a question above."
- Suggested starter queries as clickable chips

### Additional Components

**Loading States**
- Skeleton loaders for table rows
- Animated pulse for cards during data fetch
- Inline spinner for query processing

**Status Indicators**
- Success: Check icon with semantic styling
- Error: Alert icon with error messaging
- Processing: Animated spinner

**Modal/Dialog**
- Query explanation detail view
- Settings/configuration panel
- User guide/help overlay

## Page Structure

**Dashboard Layout** (Landing/Home)
1. Top Navigation Bar (h-16)
2. Page Header Section (py-12): Title "Oracle EBS AI Assistant", subtitle explaining NLQ capabilities
3. Metrics Grid (py-8): 4 key performance cards
4. Quick Query Templates Section (py-12): 3-6 template cards
5. Recent Activity/History Preview (py-8): Last 5 queries with results summary

**Query Interface Layout**
1. Top Navigation Bar
2. Two-column layout (desktop):
   - Left: Query input + results (70% width, pr-6)
   - Right: History sidebar (30% width, pl-6, border-left)
3. Mobile: Stacked with collapsible history drawer

**Results View Enhancements**
- Tabbed interface for multiple query results
- Breadcrumb navigation showing query context
- Action bar: Refresh, Download, Share query
- Pagination for large result sets (bottom-aligned)

## Responsive Breakpoints
- Mobile: < 640px (single column, stacked)
- Tablet: 640px - 1024px (2-column grids)
- Desktop: > 1024px (full multi-column layouts)

## Interaction Patterns

**Primary Actions**
- Submit query button: Most prominent action
- Template cards: Single-click to populate query
- Export data: Secondary button styling

**Micro-interactions**
- Card hover: Subtle elevation increase (shadow-lg on hover)
- Button feedback: Scale down slightly on click
- Success states: Brief fade-in for results
- Error states: Shake animation for input validation

## Images

**Dashboard Hero Background** (Optional subtle treatment)
- Abstract data visualization pattern as background texture
- Low opacity (10-15%) gradient mesh
- Position: Behind page header section
- Purpose: Visual interest without distraction

**Empty State Illustrations**
- Location: Center of results area when no data
- Style: Simple line art depicting database/query concepts
- Dimensions: 200x200px placeholder
- Sources: Use illustration libraries (unDraw, Storyset)

**Icon System**
- Use Heroicons throughout via CDN
- Sizes: 16px (inline), 20px (buttons), 24px (cards), 32px (headers)
- Categories represented: Database, Search, Chart, Document, CheckCircle, ExclamationCircle

## Critical Layout Notes
- No large hero section - prioritize functional interface
- Query input should be immediately visible and accessible
- Results display uses natural height based on data (not forced viewport)
- Consistent vertical rhythm: py-8 for sections, py-12 for major breaks
- Dashboard cards use equal heights within rows for visual harmony
- Sidebar/panel widths use percentage-based responsive values