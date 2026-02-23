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
- `/retirement-planner` — AI-powered Retirement Planning with deterministic calculations (SIP FV, inflation-adjusted expenses, corpus calculation, PMT solver), year-by-year projections, readiness gauge, and Hugging Face AI insights (risk assessment, savings advice, asset allocation, behavioral tips). Indian financial context (PPF, NPS, ELSS). Rate-limited AI endpoint (50 req/15min), 15s timeout with fallback.
- `/ca-services` — Public CA & Tax Advisory Services page showing active services by category with pricing, cross-sell offers banner, and enquiry links to contact page. Trilingual support.
- `/admin` — Admin login page with OTP-based passwordless authentication (email + 6-digit OTP)
- `/admin/dashboard` — Admin panel with tabs for: CA Services CRUD, Cross-Sell Offers CRUD, Audit Logs viewer
- `/info` — "The Tea" - Insurance education page with IRDAI metrics (4% penetration, 75% without health cover, ₹6,600 per capita premium), health & term insurance facts
- `/contact` — Contact page with lead capture form (Full Name, Email, Phone, City, Interest Type dropdown including CA & Tax Advisory, Message, Consent checkbox), Google reCAPTCHA v3 verification, honeypot spam protection, WhatsApp and Call buttons. Sends admin notification + customer thank-you emails via Gmail SMTP. Trilingual support (EN/HI/TE).

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
  - `contact_requests` — stores contact form submissions (id, full_name, email, phone, city, interest_type, message, consent_given, ip_address, user_agent, created_at). Indexed on created_at and interest_type.
  - `security_logs` — stores blocked malicious attempts (id, ip_address, attempt, created_at). Indexed on created_at and ip_address.
  - `ca_services` — CA & Tax Advisory services (UUID id, service_name, description, category, price, is_active, created_at, updated_at). Indexed on category and is_active.
  - `cross_sell_offers` — trigger-based promotional offers (UUID id, trigger_product, offer_title, offer_description, offer_type, discount_value, free_service_id, is_active, start_date, end_date, created_at). Indexed on trigger_product and is_active.
  - `admin_users` — admin accounts for OTP login (UUID id, email, role, is_active, totp_secret, totp_enabled, created_at). Indexed on email. TOTP secret is AES-256-CBC encrypted.
  - `admin_otps` — OTP tokens for admin authentication (UUID id, admin_id, otp_hash, expires_at, is_used, created_at). Indexed on admin_id and expires_at.
  - `audit_logs` — admin action audit trail (UUID id, admin_id, action, entity, entity_id, timestamp). Indexed on admin_id and timestamp.
  - `site_settings` — key-value site configuration (key varchar PK, value text, updated_at). Used for feature toggles like `ca_tax_enabled`.

### Shared Layer (`shared/`)
- `schema.ts` — Drizzle table definitions, insert schemas, and client-side calculator validation schemas (Zod)
- `routes.ts` — API route contracts with path, method, input/output schemas used by both frontend and backend

### Key Design Decisions

1. **Client-side calculators with zero data retention**: All financial calculations happen in the browser. No calculator data is sent to the server. This is a deliberate privacy feature highlighted in the UI.

2. **Shared schema between client and server**: The `shared/` directory contains both the database schema and API contracts, ensuring type safety across the full stack. Zod schemas derived from Drizzle tables are used for both form validation and API input parsing.

3. **Storage abstraction**: `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation, allowing the storage backend to be swapped if needed.

4. **Multiple API endpoints**: `POST /api/contact` (lead capture with reCAPTCHA), `POST /api/retirement/calculate` (deterministic), `POST /api/retirement/ai-analysis` (Hugging Face AI).

5. **Admin authentication**: OTP-based passwordless login via email + optional TOTP 2FA. JWT access tokens (1h expiry) + refresh tokens (7d, httpOnly cookie). Admin routes protected by `adminAuthMiddleware`. OTP rate limited to 3 per 10 min per email + 10 auth requests per 15 min per IP. TOTP uses `otpauth` library with AES-256-CBC encrypted secrets.

6. **Admin API routes** (`/api/admin/*`): Auth (request-otp, verify-otp, refresh, logout, me, totp/setup, totp/verify-setup, totp/disable, totp/status), CA Services CRUD, Cross-Sell Offers CRUD, Audit Logs, Security Logs & Stats. All admin mutations create audit log entries.

7. **Security monitoring**: Admin dashboard "Security" tab shows blocked attack stats (total, last 24h), threat type breakdown (SQL Injection, XSS, Email Injection), top suspicious IPs, and full blocked attempt log.

8. **Public API routes**: `GET /api/public/services` (active services only), `GET /api/public/offers` (active offers within date range).

## Security Hardening

- **Helmet**: Uses `helmet` package for secure HTTP headers (X-Powered-By disabled, etc.). CSP managed separately.
- **CORS**: Explicit allowlist-based CORS policy (no wildcards). Uses Replit domain env vars + optional `ALLOWED_ORIGINS`. Foreign-origin API requests are blocked.
- **CSP**: Strict Content Security Policy blocking unauthorized scripts, frames, objects. Allows Google reCAPTCHA domains.
- **Headers**: HSTS with preload, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Permissions-Policy, Referrer-Policy. SameSite cookies.
- **Rate Limiting**: Contact form limited to 10 requests per 15 minutes per IP. AI endpoint limited to 50 requests per 15 min.
- **reCAPTCHA v3**: Google reCAPTCHA v3 verification on contact form with score >= 0.5 threshold and action validation. Honeypot field for additional bot protection.
- **Malicious Pattern Blocking**: Server-side regex detection of SQL injection (DROP TABLE, SELECT *, INSERT INTO, ' OR 1=1, etc.), XSS (<script>, javascript:, onerror=, etc.), and email header injection (BCC:, CC:, newlines). Blocked attempts logged to security_logs table.
- **Input Sanitization**: Server-side HTML stripping + newline removal on all contact form inputs. Email templates use HTML entity escaping.
- **Validation**: Zod schema validation on all API inputs with strict field length limits (fullName 2-50, email max 30, message 10-1000, city max 20).
- **Body Size Limit**: 10KB max on JSON and URL-encoded request bodies.
- **Parameterized Queries**: All DB queries via Drizzle ORM (no raw SQL).
- **Logging**: API response logging only captures message field (no user data). Security events logged to DB.
- **Secrets**: All sensitive config via environment variables/secrets. Production startup aborts if critical env vars missing (DATABASE_URL, RECAPTCHA_SECRET_KEY, SMTP_USER, SMTP_PASS).
- **Email**: Gmail SMTP (port 465 SSL) for admin notifications and customer thank-you emails. Config via `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` env vars. Credentials via `SMTP_USER`, `SMTP_PASS` secrets. Email failures are logged but never exposed to user. Email header injection blocked.
- **Process Safety**: Unhandled rejections and uncaught exceptions are caught and logged. In production, uncaught exceptions trigger process exit.

## External Dependencies

- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable. Used with `pg` (node-postgres) driver and Drizzle ORM.
- **Google Fonts**: Loaded via CDN for Space Grotesk and Inter font families.
- **Google reCAPTCHA v3**: Used for contact form bot protection. Site key via `VITE_RECAPTCHA_SITE_KEY` env var, secret key via `RECAPTCHA_SECRET_KEY` secret.
- **Hugging Face API**: Used for AI retirement planning insights. API key via `HUGGINGFACE_API_KEY` secret.
- **Gmail SMTP**: Used for admin notification and customer thank-you emails via Nodemailer.