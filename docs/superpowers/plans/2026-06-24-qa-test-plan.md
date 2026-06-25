# QA Test Plan Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **Session Protocol:** Read `CLAUDE.md` first for coding principles before any work.  
> **Session 1 (2026-06-24):** Completed Tasks 1–2 (except 2c). Next session starts at Task 2c.

**Goal:** Generate exhaustive QA test matrices and vulnerability reports across all 10 feature modules, then implement automated tests.

**Architecture:** Feature-by-feature approach — each module gets a QA matrix (7 cols) + vulnerability report (7 cols) + automated tests. All 20 edgecase.md categories applied per feature. Adversarial red-team mindset.

**Tech Stack:** Vitest (frontend unit), JUnit 5 + Mockito (backend unit), Playwright (E2E)

**Session Protocol:** Every session reads `CLAUDE.md` first for coding principles.

---

> **✅ Session 1 COMPLETE**

### Task 1: Auth & Authorization — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/01-auth-authorization.md`

- [x] **Step 1: Write Auth QA test matrix** → `docs/testing/01-auth-authorization.md` (50 test cases)
- [x] **Step 2: Write Auth vulnerability report** → same file (20 vulnerabilities, 6 critical)
- [x] **Step 3: Backend auth tests (JUnit)** → `JwtUtilTest.java` (17 tests, all pass)
- [x] **Step 4: Frontend auth tests (Vitest)** → Already existed (all pass)
- [ ] **Step 5: Auth E2E tests (Playwright)** → NOT YET DONE

---

> **✅ Session 1 COMPLETE (partial)**

### Task 2: Booking Flow — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/02-booking-flow.md`

- [x] **Step 1: Write Booking QA test matrix** → `docs/testing/02-booking-flow.md` (80 test cases)
- [x] **Step 2: Write Booking vulnerability report** → same file (15 vulnerabilities)
- [x] **Step 3: Backend booking tests (JUnit)** → `BookingServiceTest.java` (26 tests, also added missing validations to BookingService)
- [ ] **Step 4: Frontend booking tests (Vitest)** — NOT YET DONE
- [ ] **Step 5: Booking E2E tests (Playwright)** — NOT YET DONE

---

### Task 3: Loyalty & Tiers — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/03-loyalty-tiers.md`

- [ ] **Step 1: Write Loyalty QA test matrix**

Cover:
- Points earn: valid points, negative points, overflow, max integer
- Tier progression: boundary values for each tier (MEMBER:0, INSIDER:100, ARTISAN:350, CONNOISSEUR:750, PATRON:1500)
- Points redeem: insufficient points, exact points, zero points
- Birthday bonus: birth month edge cases, already awarded this year
- Quarterly voucher: PATRON only, timing (Jan/Apr/Jul/Oct 1st), already issued
- Referral: self-referral, circular referral chain, already referred
- Profile update: all field validations (name length, phone format, email format, DOB)
- Race conditions: concurrent earn+redeem, double-redeem

Minimum 50 test cases.

- [ ] **Step 2: Write Loyalty vulnerability report**

Cover:
- Negative points abuse (POST earn with negative)
- Tier manipulation via direct API
- Birthday bonus multiple claims
- Referral code enumeration
- Profile update mass assignment

Minimum 10 vulnerabilities.

- [ ] **Step 3: Backend loyalty tests (JUnit)**

Add to LoyaltyServiceTest:
- Tier progression at exact boundary values (99, 100, 349, 350, 749, 750, 1499, 1500)
- Redeem points: exact cost, insufficient, negative cost
- Concurrent earn+redeem → consistent state
- Birthday bonus: correct month, wrong month, already awarded

Run: `cd backend && .\gradlew test --tests "*LoyaltyService*"`
Expected: All pass

- [ ] **Step 4: Frontend loyalty tests (Vitest)**

Write tests for:
- useTierProgress: all tier boundaries, 0 points, max points
- gamification.ts: calculateLoyaltyPoints, determineTier, calculateProgressToNextTier
- Member lounge data fetching (useLoungeData): loading, error, empty states

Run: `npx vitest run --reporter=verbose`
Expected: All pass

---

### Task 4: Rewards & Vouchers — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/04-rewards-vouchers.md`

- [ ] **Step 1: Write Rewards QA test matrix**

Cover:
- Reward CRUD: create with missing fields, duplicate title, negative cost, minTier validation
- Redeem: insufficient points, already out of stock, tier requirement not met, already redeemed
- Voucher lifecycle: ACTIVE → REDEEMED, ACTIVE → EXPIRED, redeemed voucher cannot be re-redeemed
- Voucher expiry: quarter-end expiry, already expired, scheduler edge cases
- Admin fulfill: already fulfilled, invalid voucher ID

Minimum 40 test cases.

- [ ] **Step 2: Write Rewards vulnerability report**

Cover:
- Free item generation (missing stock limits)
- Unlimited redemption loop
- Voucher code tampering
- Redeeming another user's voucher
- Voucher status manipulation

Minimum 8 vulnerabilities.

- [ ] **Step 3: Reward service tests (JUnit)**

Write RewardServiceTest:
- redeemReward: valid, insufficient points, already redeemed, out of stock
- fulfillVoucher: valid, already fulfilled, expired voucher
- createReward: valid, negative points, missing required fields

Run: `cd backend && .\gradlew test --tests "*RewardService*"`
Expected: All pass

---

### Task 5: Admin Dashboard — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/05-admin-dashboard.md`

- [ ] **Step 1: Write Admin QA test matrix**

Cover:
- User management: list all, pagination abuse, search with injection
- Points adjustment: negative/zero/overflow amounts, non-existent userId
- Tier override: valid tiers, invalid tier strings, current same as new
- Settings: invalid key, SQL injection in value, special chars in value
- Analytics: date range boundary, empty data, large data volume
- Economy controls: points ratio min/max range bounds, seasonal multiplier extremes

Minimum 40 test cases.

- [ ] **Step 2: Write Admin vulnerability report**

Cover:
- No backend role enforcement (`permitAll()` on admin endpoints)
- Direct API access to admin functions as ROLE_USER
- Hidden UI endpoint discovery
- JWT role manipulation
- Analytics data exposure (PII in summaries)

Minimum 10 vulnerabilities.

- [ ] **Step 3: Admin E2E tests (Playwright)**

Write tests for:
- Admin login → dashboard renders
- Blocked access for non-admin users
- Points adjustment flow
- Economy control changes reflected in UI

Run: `npx playwright test e2e/admin.spec.ts`
Expected: All pass

---

### Task 6: Gamification — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/06-gamification.md`

- [ ] **Step 1: Write Gamification QA test matrix**

Cover:
- Badges: CRUD, duplicate badge names, missing fields
- Missions: DAILY/WEEKLY/QUEST type validation, reward points boundary
- User progress: progress > required count, negative progress, already completed
- Activity log: missing user, null action type, pagination

Minimum 30 test cases.

- [ ] **Step 2: Write Gamification vulnerability report**

Cover:
- Multiple mission completion rewards from same action
- Progress manipulation via direct API calls
- Activity log leakage (other users' activities)

Minimum 5 vulnerabilities.

- [ ] **Step 3: Gamification tests (JUnit)**

Write GamificationServiceTest:
- getUserMissions: valid, multiple missions, completed missions
- createBadge: valid, duplicate name

Run: `cd backend && .\gradlew test --tests "*GamificationService*"`
Expected: All pass

---

### Task 7: User Profile — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/07-user-profile.md`

- [ ] **Step 1: Write Profile QA test matrix**

Cover:
- Update name: empty, max length, special chars, emoji, XSS payloads
- Update email: invalid format, existing email, SQL injection
- Update phone: invalid formats, special chars, max length
- Update DOB: invalid dates, future dates, leap years, very old dates
- Hair profile: all radio options, null values
- Avatar upload: oversized (>1MB), non-image files, executable disguised as image, MIME spoofing, SVG with XSS, ZIP bomb, path traversal in filename, corrupted files
- Export data: large datasets, concurrent export
- Delete account: with active bookings, with points balance

Minimum 40 test cases.

- [ ] **Step 2: Write Profile vulnerability report**

Cover:
- File upload: executable upload, MIME spoofing, path traversal, ZIP bomb
- Mass assignment: update userId to modify another user's profile
- PII exposure in export (excessive data)
- Deleted account data recovery
- SQL injection in update fields

Minimum 10 vulnerabilities.

- [ ] **Step 3: Profile E2E tests (Playwright)**

Write tests for:
- Profile update flow (name, email, phone)
- Avatar upload (valid + invalid file)
- Invalid form submission validation messages
- Export data download

Run: `npx playwright test e2e/profile.spec.ts`
Expected: All pass

---

### Task 8: Barber Services — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/08-barber-services.md`

- [ ] **Step 1: Write Services QA test matrix**

Cover:
- Create service: duplicate name, negative price, zero duration, missing fields
- Deactivate: already inactive, non-existent ID
- List active/all: empty list, mixed active/inactive, pagination abuse
- Price boundary: zero, negative, max decimal

Minimum 25 test cases.

- [ ] **Step 2: Write Services vulnerability report**

Cover:
- Price manipulation on deactivated service
- SQL injection in service name
- Mass assignment on service creation

Minimum 5 vulnerabilities.

- [ ] **Step 3: Service tests (JUnit)**

Write BarberServiceServiceTest:
- createService: valid, duplicate name, negative price
- deactivateService: valid, already inactive
- getActiveServices: mixed states

Run: `cd backend && .\gradlew test --tests "*BarberServiceService*"`
Expected: All pass

---

### Task 9: Payments — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/09-payments.md`

- [ ] **Step 1: Write Payments QA test matrix**

Cover:
- Create PaymentIntent: valid amount, zero amount, negative amount, missing fields
- Stripe integration failures (network error, invalid API key, card declined)
- Webhook handling (if applicable)
- Double charge prevention

Minimum 20 test cases.

- [ ] **Step 2: Write Payments vulnerability report**

Cover:
- Price manipulation before PaymentIntent creation
- Stripe API key exposure
- PaymentIntent reuse or replay
- Insufficient funds bypass

Minimum 5 vulnerabilities.

- [ ] **Step 3: Payment integration tests**

Write PaymentService tests:
- createPaymentIntent: valid booking price, error handling
- Stripe failure scenarios (mocked)

Run: `cd backend && .\gradlew test --tests "*Payment*"`
Expected: All pass

---

### Task 10: Frontend UI/UX — QA Matrix + Vulnerability Report

**Files:**
- Create: `docs/testing/10-frontend-uiux.md`

- [ ] **Step 1: Write Frontend QA test matrix**

Cover:
- All routes: logged out, ROLE_USER, ROLE_ADMIN — correct redirects
- Empty states: no bookings, no rewards, no activity
- Form validation: empty forms, partial data, invalid formats
- Browser: refresh clears sessionStorage, back button, forward button
- PWA: install prompt lifecycle, offline state, service worker cache
- i18n: switching between EN/MS, missing translations, RTL characters
- Theme: dark/light toggle, system preference, persistence
- Mobile: responsive breakpoints, touch interactions
- Performance: large lists, animation-heavy pages, repeated re-renders
- Accessibility: missing aria labels, keyboard navigation, tab order, screen reader, color contrast

Minimum 40 test cases.

- [ ] **Step 2: Write Frontend vulnerability report**

Cover:
- XSS in translated strings
- Sensitive data exposed in browser storage
- CSP bypass via dynamic imports or inline scripts
- CORS misconfiguration (from frontend perspective)
- Open redirect in OAuth callback handling

Minimum 8 vulnerabilities.

- [ ] **Step 3: Frontend unit tests (Vitest)**

Write tests for:
- i18n config: locale switching, fallback behavior, interpolation
- PWA install hook: all states, event listeners, cleanup
- useBookingStore: step transitions, reset, edge cases
- Theme toggle: apply, persist, system preference detection

Run: `npx vitest run --reporter=verbose`
Expected: All pass

- [ ] **Step 4: Frontend E2E tests (Playwright)**

Write tests for:
- Route protection (unauthenticated → login)
- i18n toggle changes page text
- Dark/light mode switch persists
- Mobile viewport renders correctly (375px width)

Run: `npx playwright test e2e/frontend-ui.spec.ts`
Expected: All pass

---

### Task 11: Infrastructure & Config Security Scan

**Files:**
- Create: `docs/testing/11-infrastructure-security.md`

- [ ] **Step 1: Infrastructure security review**

Check all config files for:
- Hardcoded secrets (application.yml, .env, docker-compose.yml, vite.config.ts)
- Weak CORS config (currently allows localhost:5173, *.vercel.app, *.railway.app)
- Missing security headers
- CSRF disabled (check SecurityConfig)
- Debug/actuator endpoints exposed
- H2 console exposed in production config
- Dockerfile: exposed ports, running as root, unnecessary packages
- HTTPS enforcement, mixed content

- [ ] **Step 2: Write infrastructure vulnerability report**

Document findings with: Title | Scenario | Steps | Impact | Severity | Fix | Payload

- [ ] **Step 3: Dependency audit**

Run: `cd backend && .\gradlew dependencies` and check for known vulnerabilities
Run: `cd frontend && npm audit` (if npm audit available)
Document findings.

---

### Task 12: Final Coverage Dashboard

**Files:**
- Create: `docs/testing/index.md`

- [ ] **Step 1: Write coverage dashboard**

Summarize across all 10 features:
- Total test cases per feature
- Total vulnerabilities found per feature
- Coverage gaps
- Priority distribution
- Risk heatmap
- Recommendations

- [ ] **Step 2: Identify systemic issues**

Cross-cutting findings:
- All endpoints `permitAll()` (no `@PreAuthorize`)
- JWT stored in sessionStorage
- No rate limiting anywhere
- CSRF globally disabled
- Base64 avatar storage (potential for abuse)
- No input length validation on most fields
- Missing audit trail on sensitive operations

---

## Session Handoff (2026-06-24)

### Completed This Session
| Task | Deliverable | Location |
|------|------------|----------|
| 1a | Auth QA Matrix (50 cases) + Vuln Report (20 findings) | `docs/testing/01-auth-authorization.md` |
| 1b | Auth Backend Tests (17 JUnit tests) | `backend/src/test/.../JwtUtilTest.java` |
| 1c | Auth Frontend Tests (already existed, 47 pass) | Various `*.test.tsx` |
| 2a | Booking QA Matrix (80 cases) + Vuln Report (15 findings) | `docs/testing/02-booking-flow.md` |
| 2b | Booking Backend Tests (26 JUnit tests) + added validations | `backend/src/test/.../BookingServiceTest.java` |

### Remaining For Next Session
Start at **Task 2c** (Booking Frontend Tests), then continue sequentially:

- [ ] **Task 2c**: Booking Frontend Tests (Vitest) — useBookingStore + BookingFlow + RescheduleModal
- [ ] **Task 2d**: Booking E2E Tests (Playwright)
- [ ] **Task 3**: Loyalty & Tiers — QA Matrix + Vuln Report + Tests
- [ ] **Task 4**: Rewards & Vouchers — QA Matrix + Vuln Report + Tests
- [ ] **Task 5**: Admin Dashboard — QA Matrix + Vuln Report + Tests
- [ ] **Task 6**: Gamification — QA Matrix + Vuln Report + Tests
- [ ] **Task 7**: User Profile — QA Matrix + Vuln Report + Tests
- [ ] **Task 8**: Barber Services — QA Matrix + Vuln Report + Tests
- [ ] **Task 9**: Payments — QA Matrix + Vuln Report + Tests
- [ ] **Task 10**: Frontend UI/UX — QA Matrix + Vuln Report + Tests
- [ ] **Task 11**: Infrastructure & Config Security Scan
- [ ] **Task 12**: Final Coverage Dashboard

Also not done in Task 1: Step 5 (Auth E2E Playwright tests).

### Key Context for Next Session
- **CLAUDE.md** contains coding principles — read first
- **edgecase.md** has the full QA requirements (20 testing categories)
- Pattern: QA matrix in `docs/testing/XX-feature.md`, backend tests in `backend/src/test/...`, frontend tests in `src/`
- Use subagent-driven-development: dispatch implementer → spec review → code quality review per task
- The implementer prompt template is at `C:\Users\nurha\.agents\skills\subagent-driven-development\implementer-prompt.md`
