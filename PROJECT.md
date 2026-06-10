# Hyecuts: The Studio

A premium digital membership and booking platform for **Hyecuts Barbershop**, a high-end barbershop in Kuala Lumpur, Malaysia.

Three products in one codebase:

| Product | Audience | Purpose |
|---|---|---|
| **Public Landing** | Prospective clients | Brand statement, drive registration and first booking |
| **Member Lounge** | Registered members | Book appointments, track loyalty status, redeem rewards |
| **Atelier Dashboard** | Admin/staff | Manage bookings, configure loyalty, monitor analytics |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 + TypeScript 6 | UI framework with strict type safety |
| Vite 8 | Build tool, dev server, Vitest integration |
| React Router 7 | Client-side routing with lazy loading |
| TanStack React Query 5 | Server state management, caching |
| Zustand 5 | Client state (booking flow wizard) |
| Framer Motion 12 | Page transitions, micro-animations |
| Tailwind CSS 3 | Utility-first CSS with custom design tokens |
| i18next | Internationalization (EN + MS) |
| Recharts | Admin analytics charts |
| Stripe (react-stripe-js) | Payment processing |
| Vite PWA | Progressive Web App support |

### Backend

| Technology | Purpose |
|---|---|
| Java 17 + Spring Boot 3.2 | REST API framework |
| Spring Data JPA | ORM / database access |
| Spring Security | JWT auth, CORS, CSRF |
| Gradle | Build tool |
| Flyway | Database migration management |
| PostgreSQL 15 | Production database |
| H2 | Dev/in-memory database |
| Stripe Java SDK | Payment processing |

### DevOps

Docker Compose orchestrates three services: `db` (PostgreSQL 15 Alpine), `backend` (Spring Boot JAR on Temurin 17), `frontend` (Nginx Alpine serving React SPA).

---

## Structure

```
hyecuts/
├── backend/                        # Spring Boot API (Java 17)
│   ├── src/main/java/com/hyecuts/loyalty/
│   │   ├── controller/             # REST endpoints (auth, bookings, loyalty, admin, etc.)
│   │   ├── service/                # Business logic layer
│   │   ├── model/                  # JPA entities (User, Booking, Reward, Tier, Badge, etc.)
│   │   ├── repository/             # Spring Data JPA repositories
│   │   ├── security/              # JWT, SecurityConfig, CustomUserDetailsService
│   │   ├── exception/              # Custom exceptions
│   │   └── web/                    # ApiError, GlobalExceptionHandler, DTOs
│   ├── src/main/resources/
│   │   ├── application.yml         # Default config
│   │   ├── application-dev.yml     # H2 in-memory, dev settings
│   │   ├── application-prod.yml    # PostgreSQL, prod settings
│   │   └── db/migration/           # Flyway SQL migrations
│   └── Dockerfile                  # Multi-stage: builder + JRE runtime
│
├── src/                            # React frontend
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router, theme, lazy-loaded routes
│   ├── pages/                      # LandingPage, LoginScreen, MemberLounge, AtelierDashboard
│   ├── components/
│   │   ├── landing/                # Navbar, Hero, Services, Hours, Contact, Footer
│   │   ├── lounge/                 # StatusCard, RewardPortfolio, ActivityFeed, MissionsPanel, BadgeShowcase
│   │   ├── booking/                # BookingFlow (multi-step wizard), UserBookings, PaymentStep
│   │   ├── atelier/                # BookingsManager, MemberManager, StaffManager, Analytics, etc.
│   │   ├── guards/                 # ProtectedRoute, AdminRoute
│   │   └── profile/                # UserProfileModal
│   ├── hooks/                      # useLoungeData, useTierProgress
│   ├── store/                      # useBookingStore (Zustand)
│   ├── api/                        # Centralized HTTP client
│   ├── types/                      # TypeScript interfaces
│   ├── utils/                      # Gamification logic, animation variants
│   ├── i18n/                       # English + Bahasa Malaysia translations
│   └── data/                       # Shop info, services, pricing, team data
│
├── e2e/                            # Playwright end-to-end tests
├── docs/                           # Architecture plans, design specs
├── docker-compose.yml              # 3-service orchestration
├── Dockerfile                      # Frontend multi-stage (Node + Nginx)
├── vite.config.ts                  # Vite + React + PWA + Vitest
├── tailwind.config.js              # Custom design tokens
├── eslint.config.js                # Strict type-checked linting
└── tsconfig.json                   # TypeScript project references
```

---

## Key Features

### Authentication
- Register/login via JWT (24h expiry), BCrypt password hashing
- Session persisted in `sessionStorage` (`hc_token`, `hc_user`)
- Role-based routing: users → `/lounge`, admins → `/admin`
- Route guards: `ProtectedRoute`, `AdminRoute`

### Booking System
- Multi-step wizard: Service → Staff → Date/Time → Confirmation
- Zustand store manages wizard state
- Appointment lifecycle: PENDING → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW
- Points auto-awarded on completion
- 24h cancellation window; 3 late cancellations flag admin
- Artisan+ tiers get 48h priority booking window
- Calendar `.ics` export for appointments

### Loyalty Engine
- **Tiers (lifetime points):** Initiate (0) → Member (250) → Artisan (750) → Connoisseur (2,000) → Patron (5,000)
- Points earned via: services, first booking bonus (50), birthday (100), reviews (25), referrals (75+25), missions
- Tier based on `lifetime_points` (spending points does not demote)
- 180-day inactivity = one tier demotion
- Badges, missions, referral codes (7-day unlock delay)

### Member Lounge
- Status card with tier name, progress arc, appointment summary, streak counter
- Reward portfolio with point-based redemption and voucher modal
- Activity feed (earn/redeem/tier change/mission log)
- Missions panel, badge showcase
- Profile modal with General, Hair Profile, Security tabs; PDPA data export and account deletion

### Atelier Dashboard
- **Bookings Manager:** View/manage all appointments, mark complete (awards points), cancel
- **Member Manager:** Searchable registry, point adjustment, tier override (all audited)
- **Staff Manager:** Team roster, service assignments, working hours, days off
- **Loyalty Configurator:** Point ratio, seasonal multipliers, manual adjustments
- **Rewards Inventory:** Catalog management (title, cost, tier requirement, stock)
- **Analytics:** Business metrics with Recharts
- **Fulfillment History:** Full audit log of point/tier changes

### Internationalization
- Full English and Bahasa Malaysia support
- Language toggle on every page (Globe icon / Malaysian flag)
- Dynamic entities (rewards, tiers, badges) mapped to translation keys

### Design System
- **Palette:** True Black (`#1A1A1A`), Paper White (`#FAFAFA`), Soft Slate (`#6B6B6B`), Warm Muted Gold (`#B8A070`)
- **Typography:** Playfair Display (headings/tiers), Inter tracked +0.06em (UI text)
- **Spacing:** 48px minimum vertical rhythm; lounge max-width 640px; admin max-width 1200px
- **Motion:** Page fade-in 400ms, tier arc 800ms spring, reward card 200ms stagger
- Dark mode with `localStorage` persistence

---

## Testing

| Layer | Tool | What's Covered |
|---|---|---|
| Unit (frontend) | Vitest | Gamification logic (points, tiers, progress) |
| Unit (backend) | JUnit 5 + Mockito | LoyaltyService (points, redemption, tier promotion) |
| E2E | Playwright | Smoke tests (title, navigation), theme inversion |

---

## Getting Started

```bash
# Frontend dev server (port 5173)
npm install
npm run dev

# Backend (requires Java 17)
cd backend
./gradlew bootRun

# Or full stack via Docker
docker-compose up

# Tests
npm test                # Vitest unit tests
npm run test:e2e        # Playwright E2E
cd backend && ./gradlew test  # Spring Boot tests

# Production build
npm run build           # Output: dist/
cd backend && ./gradlew bootJar
```

Required env vars: `JWT_SECRET`, `QR_SECRET`, `STRIPE_SECRET_KEY`, `POSTGRES_PASSWORD`, `SPRING_DATASOURCE_PASSWORD`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`, `VITE_API_URL`.
