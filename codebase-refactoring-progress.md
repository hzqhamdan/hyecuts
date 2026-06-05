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
- [ ] **Monolithic page files** — `MemberLounge.tsx` (~690 lines) and `LandingPage.tsx` (~441 lines) mix data fetching, state management, modal logic, and rendering in single files. Violates Principle 5 (Optimize for Maintainability).

### Moderate

- [x] **No React Router** — Resolved in Phase 3. React Router v7 with URL routes for all views, nested admin routes, deep-linking, browser nav support.
- [ ] **`any` type usage** — Multiple places use `as any` type assertions (translation keys, service lookups) that bypass TypeScript safety. Violates Principle 5 (Optimize for Maintainability).
- [x] **Console.log in production** — Resolved in Phase 1. Removed debug logs from `config.ts`, `LoginScreen.tsx`, `AtelierDashboard.tsx`; backend `System.out.println` replaced with SLF4J.
- [x] **Dead dependency: Firebase** — Resolved in Phase 1. Removed from `package.json`.
- [ ] **Booking times hardcoded** — `TIMES = ['12:00 PM', '2:30 PM', '4:00 PM', '6:00 PM', '8:00 PM']` in `BookingFlow.tsx` is static, not dynamic from backend. Violates Principle 3 (Design for Growth).

### Minor

- [ ] **Inconsistent file organization** — `LandingPage.tsx` and `LoginScreen.tsx` are barrel re-exports from `components/`, but `MemberLounge.tsx` and `AtelierDashboard.tsx` are standalone page components in `src/` directly. Violates Principle 2 (Respect Existing Architecture).
- [ ] **i18n keys with `as any` casts** — Translation calls like `` t(`data.services.${service.name}` as any) `` bypass static checking.
- [ ] **Build tool noise** — `build-tech-v2.js` (1035+ lines DOCX generator) committed to the app repo.
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

### Phase 4: Component Decomposition
- [ ] Break down `MemberLounge.tsx` into focused sub-components
- [ ] Break down `LandingPage.tsx` into focused sub-components
- [ ] Standardize file organization (all pages under `src/pages/` or consistent pattern)

### Phase 5: Code Quality
- [ ] Remove `as any` type assertions, add proper TypeScript types
- [ ] Make booking times dynamic from backend API
- [ ] Remove or archive `build-tech-v2.js`
- [ ] Create proper `.env` documentation

---

## Session Continuation Notes

- **Tech stack:** React 19, TypeScript 6, Vite 8, Tailwind 3, Zustand 5, TanStack Query 5, Spring Boot 3.2.5, Java 17, PostgreSQL
- **Frontend:** `src/` directory, 42 source files, feature-based component folders
- **Backend:** `backend/` directory, Spring Boot layered architecture (controller/service/repository/model/security)
- **Tests:** Vitest (1 unit test file), Playwright (2 E2E specs), JUnit (1 backend test)
- **Lint:** ESLint flat config with strict TypeScript rules
- **PRD:** See `updatedPRD.md` for full product requirements
- **Coding principles:** See `codingprinciples.md` for the 12 guiding principles
