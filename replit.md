# Hanvitt Advisors - Financial Planning Website

## Overview

Hanvitt Advisors is a professional financial advisory firm website built as a full-stack TypeScript application. It features a modern marketing homepage (inspired by fin100x.ai layout), three client-side financial tools (Savings Lab, Wealth Tracker, and Financial Health Score with integrated insurance recommendations), and a contact page with WhatsApp/Call buttons. The tools run entirely in the browser with zero data retention (privacy-first), while the Wealth Tracker uses localStorage for persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server communication
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for dark/light theming (CSS custom properties: --page-bg, --text-primary, --text-secondary, --glass-bg, --border-subtle, --nav-bg; #D4AF37 gold accents, glassmorphism effects)
- **Theme**: Dark/light mode toggle with persistence via Zustand + localStorage (`client/src/hooks/use-theme.ts`). Uses `.light` CSS class on `<html>`. Toggle button in Navigation (Sun/Moon icon).
- **Animations**: Framer Motion for page transitions and hero animations, CSS marquee for scrolling tool showcase
- **Charts**: Recharts for data visualization in calculators (theme-aware tooltips and axes)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Input Sanitization**: DOMPurify for calculator inputs (client-side only)
- **Fonts**: Space Grotesk (primary) and Inter (fallback) via Google Fonts
- **Design System**: Dark/GenZ aesthetic (default) with optional light theme, inspired by fin100x.ai with bento grid layouts, gradient text, noise texture backgrounds

### Pages
- `/` — Marketing homepage with dark hero (5+ clients, <1 year stats + IRDAI badge), scrolling tool marquee, bento grid feature showcase, glassmorphism security section, animated how-it-works steps, CTA
- `/savings-lab` — Compound interest savings calculator with area charts
- `/wealth-tracker` — Personal income/expense tracker with pie chart (by category) and bar chart (monthly trend), localStorage-backed
- `/fin-score` — Financial Health Score assessment (0-100) with gauge chart, breakdown bar chart, personalized recommendations, plus integrated Health Insurance (family floater for self+spouse+children, separate senior citizen plan for parents) and Term Insurance recommendation engine (HLV method, per-lakh premium rates, city tier and age multipliers, 8% medical inflation projection)
- `/info` — "The Tea" - Insurance education page with IRDAI metrics (4% penetration, 75% without health cover, ₹6,600 per capita premium), health & term insurance facts
- `/contact` — WhatsApp and Call buttons for direct communication

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript, executed via tsx
- **API Pattern**: RESTful, with a shared route definition object (`shared/routes.ts`) that defines paths, methods, input schemas, and response schemas — used by both client and server
- **Security Headers**: HSTS and CSP middleware applied to all routes
- **Build**: Custom build script using Vite for client and esbuild for server, outputting to `dist/`

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` — single source of truth for both DB tables and Zod validation schemas
- **Migrations**: Managed via `drizzle-kit push` (no migration files checked in by default, uses `migrations/` output dir)
- **Tables**:
  - `contact_requests` — stores contact form submissions (id, name, email, phone, message, is_read, created_at)

### Shared Layer (`shared/`)
- `schema.ts` — Drizzle table definitions, insert schemas, and client-side calculator validation schemas (Zod)
- `routes.ts` — API route contracts with path, method, input/output schemas used by both frontend and backend

### Key Design Decisions

1. **Client-side calculators with zero data retention**: All financial calculations happen in the browser. No calculator data is sent to the server. This is a deliberate privacy feature highlighted in the UI.

2. **Shared schema between client and server**: The `shared/` directory contains both the database schema and API contracts, ensuring type safety across the full stack. Zod schemas derived from Drizzle tables are used for both form validation and API input parsing.

3. **Storage abstraction**: `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation, allowing the storage backend to be swapped if needed.

4. **Single API endpoint**: The app currently has only one API endpoint (`POST /api/contact`). The route definition pattern in `shared/routes.ts` is designed to scale to more endpoints.

## Security Hardening

- **CORS**: Explicit allowlist-based CORS policy (no wildcards). Uses Replit domain env vars + optional `ALLOWED_ORIGINS`. Foreign-origin API requests are blocked.
- **CSP**: Strict Content Security Policy blocking unauthorized scripts, frames, objects.
- **Headers**: HSTS with preload, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Permissions-Policy, Referrer-Policy.
- **Rate Limiting**: Contact form endpoint limited to 5 requests per 15 minutes per IP.
- **Input Sanitization**: Server-side HTML stripping on all contact form inputs. Email templates use HTML entity escaping.
- **Validation**: Zod schema validation on all API inputs with strict field length limits.
- **Body Size Limit**: 100KB max on JSON and URL-encoded request bodies.
- **Parameterized Queries**: All DB queries via Drizzle ORM (no raw SQL).
- **Logging**: API response logging only captures message field (no user data).
- **Secrets**: All sensitive config via environment variables/secrets. `.env` files in `.gitignore`.
- **Email Config**: `EMAIL_FROM`, `EMAIL_TO` via env vars. SMTP credentials (`SMTP_USER`, `SMTP_PASS`) expected as secrets when configured.

## External Dependencies

- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable. Used with `pg` (node-postgres) driver and Drizzle ORM.
- **Google Fonts**: Loaded via CDN for Space Grotesk and Inter font families.
- **No external APIs**: The application does not currently call any third-party APIs, though the build script bundles support for OpenAI, Stripe, Google Generative AI, and Nodemailer (suggesting planned future integrations).