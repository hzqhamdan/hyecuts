# Codebase Refactoring Progress

## Guiding Principles

All refactoring decisions should be evaluated through these 12 principles (see `codingprinciples.md`):

1. **Understand Before Generating** — Know purpose, architecture, data flow, side effects
2. **Respect Existing Architecture** — Follow established conventions and patterns
3. **Design for Growth** — Prefer configurable, reusable, modular solutions
4. **Consider Performance During Design** — Evaluate complexity, queries, memory
5. **Optimize for Maintainability** — Prioritize readability, consistency, clear naming
6. **Anticipate Production Conditions** — Design for real-world traffic and data volume
7. **Recognize Context Limitations** — Don't assume unverified business knowledge
8. **Think Beyond Current Requirements** — Consider expansion and reuse
9. **Prefer Reuse Over Reinvention** — Use existing services, utilities, patterns
10. **Minimize Technical Debt** — Avoid hacks, duplication, unclear abstractions
11. **Make Change Easy** — Build for new features, rules, integrations
12. **Preserve System Integrity** — Don't damage the system for a feature

---

## Discovered Issues

### Critical

- [x] **Exposed secrets** — Resolved in Phase 1. Moved to `.env`/env vars, no hardcoded defaults.
- [x] **`hibernate.ddl-auto: update`** — Resolved in Phase 1. `application-prod.yml` overrides to `validate`.
- [x] **No centralized API client** — Resolved in Phase 2. `src/api/client.ts` provides typed `api.get/post/put/del` methods.
- [x] **Monolithic page files** — Resolved in Phase 4. `MemberLounge.tsx` data fetching extracted to hooks; `LandingPage.tsx` already decomposed. All pages moved to `src/pages/`.

### Moderate

- [x] **No React Router** — Resolved in Phase 3. React Router v7 with URL routes for all views, nested admin routes, deep-linking, browser nav support.
- [x] **`any` type usage** — Resolved in Phase 5. Removed all 19 `as any` casts from translation calls and `catch (error: any)`. Zero `any` usages remain.
- [x] **Console.log in production** — Resolved in Phase 1. Removed debug logs from `config.ts`, `LoginScreen.tsx`, `AtelierDashboard.tsx`; backend `System.out.println` replaced with SLF4J.
- [x] **Dead dependency: Firebase** — Resolved in Phase 1. Removed from `package.json`.
- [x] **Booking times hardcoded** — Resolved in Phase 5. Moved to `src/data/hyecuts.ts` as `AVAILABLE_TIMES`, centralized with other business data, ready for backend integration.

### Minor

- [x] **Inconsistent file organization** — Resolved in Phase 4. All pages under `src/pages/` with barrel re-exports from `src/`.
- [x] **i18n keys with `as any` casts** — Resolved in Phase 5. All translation key casts removed.
- [x] **Build tool noise** — Resolved in Phase 5. `build-tech-v2.js` archived.
- [x] **No `.env` file** — Resolved in Phase 1. `.env` created for local dev, `.env.example` documents all required vars.

---

## Refactoring Plan (To Be Completed)

### Phase 1: Safety & Hygiene ✅
- [x] Move secrets to environment variables — `docker-compose.yml` now references `${VAR}` with no defaults, `.env` file created for local dev, `.env.example` documents all required vars
- [x] Add `application-prod.yml` with `ddl-auto: validate` and reduced logging (activated via `SPRING_PROFILES_ACTIVE=prod`)
- [x] Remove hardcoded JWT/Stripe fallback defaults from `application.yml` (they must now be explicitly provided)
- [x] Remove `console.log` debug statements from `config.ts`, `LoginScreen.tsx`, `AtelierDashboard.tsx` (kept legitimate `console.error` calls)
- [x] Replace `System.out.println` with SLF4J logger in `DatabaseSeeder.java`; removed debug prints from `LoyaltyApplication.java` and `AuthController.java`
- [x] Remove unused Firebase dependency from `package.json`

### Phase 2: API Layer ✅
- [x] Create `src/api/client.ts` — centralized API client with `api.get/post/put/del` methods, auto-JSON parsing, typed error handling (`ApiError` class), conditional auth header injection
- [x] Migrate all 32 raw `fetch()` calls across 13 files to use the new client
- [x] Full type safety via generics on all API calls (no more `as Promise<T>` casts)
- [x] Consistent error handling — `ApiError` with status + message thrown on non-ok responses

### Phase 3: Routing & Navigation ✅
- [x] Installed `react-router-dom` v7.17.0
- [x] Created guard components: `ProtectedRoute` (auth check → /login), `AdminRoute` (role check → /lounge)
- [x] Rewrote `App.tsx` — replaced `useState<ViewState>` + `sessionStorage` with `<BrowserRouter>`, `<Routes>`, nested routes
- [x] Updated `AtelierDashboard` — replaced `currentView` state + conditional rendering with `<NavLink>` sidebar + `<Outlet />`
- [x] Migrated all `setView()` calls to `useNavigate()` across 5 components (LoginScreen, MemberLounge, LandingPage, BookingFlow, UserBookings)
- [x] Updated admin sub-components (BookingsManager, MemberManager, StaffManager, ReviewQueue) to use `useAuth()` instead of `token` prop
- [x] Route map: `/` (public), `/login`, `/booking`, `/my-bookings` (auth), `/lounge` (auth), `/admin/*` (admin with 6 nested routes)
- [x] Preserved framer-motion page transitions via `<AnimatePresence>` keyed on `location.key`
- [x] Verification: TypeScript ✅, Tests ✅ (12/12), no remaining `setView` references

### Phase 4: Component Decomposition ✅
- [x] Break down `MemberLounge.tsx` — extracted data fetching into `src/hooks/useLoungeData.ts`, `src/hooks/useTierProgress.ts`
- [x] Break down `LandingPage.tsx` — already decomposed into sub-components in Phase 3; moved to `src/pages/`
- [x] Standardize file organization — all 4 page components now live under `src/pages/` with barrel re-exports from `src/` (LandingPage, LoginScreen, MemberLounge, AtelierDashboard)

### Phase 5: Code Quality ✅
- [x] Remove `as any` type assertions — removed all 19 `as any` on translation calls, removed `catch (error: any)`, zero `any` usages remain
- [x] Make booking times dynamic — moved `TIMES` hardcoded array to `src/data/hyecuts.ts` as `AVAILABLE_TIMES`, centralized with other business data
- [x] Remove or archive `build-tech-v2.js` — moved to `archive/` directory
- [x] Create proper `.env` documentation — already done in Phase 1

---

## Session Continuation Notes

- **Tech stack:** React 19, TypeScript 6, Vite 8, Tailwind 3, Zustand 5, TanStack Query 5, Spring Boot 3.2.5, Java 17, PostgreSQL
- **Frontend:** `src/` directory, 42 source files, feature-based component folders
- **Backend:** `backend/` directory, Spring Boot layered architecture (controller/service/repository/model/security)
- **Tests:** Vitest (1 unit test file), Playwright (2 E2E specs), JUnit (1 backend test)
- **Lint:** ESLint flat config with strict TypeScript rules
- **PRD:** See `updatedPRD.md` for full product requirements
- **Coding principles:** See `codingprinciples.md` for the 12 guiding principles
