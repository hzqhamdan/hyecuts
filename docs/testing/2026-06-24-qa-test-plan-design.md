# QA Test Plan — Comprehensive Coverage

Based on [edgecase.md](../../edgecase.md) — 20 testing categories across 10 feature modules.

## Structure

### Two Deliverables Per Feature

**1. QA Test Matrix**
Columns: Test Case ID | Feature | Input | Expected Result | Actual Risk | Priority (C/H/M/L) | Test Type (Happy/Sad/Edge/Security/Performance)

**2. Vulnerability Report**
Columns: Vulnerability Title | Attack Scenario | Steps to Reproduce | Impact | Severity (C/H/M/L) | Recommended Fix | Example Exploit Payload

### Guiding Principles
- Assume every user is malicious, impatient, confused
- Assume every user is actively attempting to abuse the application
- Do not trust frontend validation, hidden fields, UI restrictions, or client-side checks
- Think like an attacker, not a developer
- Continue recursively until complete coverage

## Feature Modules

### 1. Auth & Authorization
**Scope:**
- Endpoints: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/ping`, OAuth2 callback
- Frontend: Login form, register form, OAuth button, OAuth2Callback page, ProtectedRoute, AdminRoute
- Backend: JwtUtil, JwtRequestFilter, CustomUserDetailsService, CustomOAuth2UserService, OAuth2LoginSuccessHandler, SecurityConfig

**Key edgecase.md sections applicable:**
1-8 (core QA), 9 (Auth Security), 10 (Authorization), 11 (Injection), 14 (API Abuse), 15 (Browser Security), 16 (Infra), 17 (Logging), 19 (Data Privacy), 20 (Config)

### 2. Booking Flow
**Scope:**
- Endpoints: `POST /api/bookings/`, `GET /api/bookings/user/{userId}`, `GET /api/bookings/all`, `GET /api/bookings/date/{date}`, `PUT /{id}/complete`, `PUT /{id}/reschedule`, `PUT /{id}/cancel`
- Frontend: BookingFlow (6 steps), RescheduleModal, UserBookings page
- Backend: BookingService, booking state machine (PENDING→CONFIRMED→COMPLETED/CANCELLED/NO_SHOW)
- Store: useBookingStore (Zustand)

**Key sections:** 1-8, 13 (Business Logic Abuse), 14 (API Abuse), 18 (DoS), 19 (Data Privacy)

### 3. Loyalty & Tiers
**Scope:**
- Endpoints: `GET /api/loyalty/profile/{userId}`, `PUT /api/loyalty/profile/{userId}`, `POST /api/loyalty/earn/{userId}`, `POST /api/loyalty/redeem/{userId}`
- Frontend: MemberLounge, TierProgress, VoucherModal
- Backend: LoyaltyService, BenefitsService, QuarterlyVoucherScheduler, tier enum (MEMBER/INSIDER/ARTISAN/CONNOISSEUR/PATRON)
- Utils: gamification.ts (calculateLoyaltyPoints, determineTier, calculateProgressToNextTier)

**Key sections:** 1-8, 13 (Business Logic), 14 (API Abuse), 18 (DoS), 19 (Data Privacy)

### 4. Rewards & Vouchers
**Scope:**
- Endpoints: `GET /api/rewards/`, `POST /api/rewards/`, `POST /api/rewards/redeem/{userId}/{rewardId}`, `GET /api/rewards/vouchers/{userId}`, admin redeem endpoints
- Frontend: RewardsInventory, VoucherModal, member lounge rewards display
- Backend: RewardService, Voucher entity (ACTIVE/REDEEMED/EXPIRED lifecycle), QuarterlyVoucherScheduler (expiry)
- Database: rewards, vouchers tables

**Key sections:** 1-8, 13 (Business Logic Abuse), 14 (API Abuse), 18 (DoS)

### 5. Admin Dashboard
**Scope:**
- Endpoints: All `/api/admin/*`, `/api/analytics/summary`, `/api/admin/settings/*`
- Frontend: AtelierDashboard, EconomyControlCenter, BookingsManager, MemberManager, StaffManager, ReviewQueue, LoyaltyConfigurator, OverviewView
- Backend: GlobalSettingsService, admin controller endpoints

**Key sections:** 1-8, 9 (Auth), 10 (Authorization), 13 (Business Logic), 14 (API Abuse), 16 (Infra), 19 (Data Privacy), 20 (Config)

### 6. Gamification
**Scope:**
- Endpoints: All `/api/gamification/*` (badges CRUD, missions, activity, user progress)
- Frontend: Member lounge badges/missions display
- Backend: GamificationService, Badge/UserBadge/Mission/UserMissionProgress entities
- Database: badge, user_badge, mission, user_mission_progress tables

**Key sections:** 1-8, 13 (Business Logic), 14 (API Abuse), 18 (DoS)

### 7. User Profile
**Scope:**
- Endpoints: `PUT /api/loyalty/profile/{userId}` (update name, email, phone, dob, hair profile, avatar)
- Frontend: UserProfileModal (General tab, Hair tab, Security tab — export/delete)
- Backend: LoyaltyService.updateUser()
- File upload: Avatar (image/*, <1MB, base64 storage)

**Key sections:** 1-8, 11 (Injection), 12 (File Upload), 13 (Business Logic), 14 (API Abuse), 19 (Data Privacy), 20 (Config)

### 8. Barber Services
**Scope:**
- Endpoints: `GET /api/services/active`, `GET /api/services/all`, `POST /api/services/`, `PUT /api/services/{id}/deactivate`
- Frontend: Service selection in booking flow, admin service management
- Backend: BarberServiceService, BarberService entity

**Key sections:** 1-8, 13 (Business Logic), 14 (API Abuse)

### 9. Payments
**Scope:**
- Endpoints: `POST /api/payments/create-intent`
- Frontend: Stripe PaymentElement in BookingFlow step 5
- Backend: Stripe PaymentIntent creation (50% deposit)

**Key sections:** 1-8, 13 (Business Logic Abuse — price manipulation, double charges), 14 (API Abuse), 19 (Data Privacy — PCI concerns)

### 10. Frontend UI/UX
**Scope:**
- All frontend routes, guards, forms, modals
- PWA (service worker, manifest, install prompt)
- i18n (EN/MS locale switching)
- Dark/light theme toggle
- Framer Motion animations
- Mobile responsiveness
- Browser history, refresh, back button behavior

**Key sections:** 1-8, 15 (Browser Security), 19 (Data Privacy — browser storage)

## Session Protocol
- Every new session must read `CLAUDE.md` first for coding principles before any work begins.

## Implementation Order

Phase 1: Write all 10 QA test matrices (markdown)
Phase 2: Write all 10 vulnerability reports (markdown)
Phase 3: Implement automated tests prioritizing Critical/High items:
  - Backend: JUnit 5 + Mockito (service layer), Spring MockMvc (API layer)
  - Frontend: Vitest + React Testing Library (components, hooks, utils)
  - E2E: Playwright (critical user journeys)
Phase 4: Security-specific tests (OWASP ZAP or manual)

## Output Files

```
docs/testing/
├── 2026-06-24-qa-test-plan-design.md   ← This document
├── index.md                            ← Coverage dashboard
├── 01-auth-authorization.md
├── 02-booking-flow.md
├── 03-loyalty-tiers.md
├── 04-rewards-vouchers.md
├── 05-admin-dashboard.md
├── 06-gamification.md
├── 07-user-profile.md
├── 08-barber-services.md
├── 09-payments.md
└── 10-frontend-uiux.md
```
