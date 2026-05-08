# The Studio — Product Requirements Document
**v3.0 · Includes Booking System + Admin Panel · Confidential**

---

## What changed from v2.0

| Area | v2.0 (Previous) | v3.0 (This document) |
|---|---|---|
| Booking | Deferred — admin marks completion manually or via third-party webhook | Built natively: service catalogue, staff roster, calendar, member self-booking |
| Admin panel | Mentioned as "Atelier Dashboard" with minimal detail | Fully specified across 4 modules: Booking Manager, Loyalty Configurator, Member Manager, Analytics |
| Loyalty config | Point rates and tiers were fixed constants | Every loyalty parameter is configurable by admin at runtime — no code deploy needed |

---

## 1. Product Vision & Scope

The Studio is a premium digital membership platform for a high-end barbershop. It operates as three interconnected products under one codebase:

| Product | Audience | Primary job |
|---|---|---|
| Public Landing | Prospective clients | Brand statement. Drive registration and first booking. |
| Member Lounge | Registered members | Book appointments. Track status. Redeem rewards. |
| Atelier Dashboard | Owners and staff (admins) | Manage bookings, configure the loyalty program, monitor the business. |

> **Design Principle:** The brand aesthetic is the container. Every feature — including the booking flow and admin panel — must be rendered within the Studio visual language. Functional does not mean ugly. The admin panel is used by the owner daily; it should feel as considered as the member-facing product.

### 1.1 What Is In Scope (v3.0)

- Public landing page — brand statement, member registration CTA
- Member authentication — email/password, Google, Apple sign-in
- Native booking system — service catalogue, staff roster, availability calendar, appointment management
- Loyalty engine — points, tiers, missions, badges, vouchers, referrals
- Member Lounge — dashboard with status, bookings, rewards, activity feed
- Atelier Dashboard (Admin Panel) — four modules: Booking Manager, Loyalty Configurator, Member Manager, Analytics

### 1.2 What Is Explicitly Out of Scope (v3.0)

- **Native mobile app** — the web app must be mobile-responsive; a native app is a v2 product decision
- **Multi-location** — architecture must not preclude it, but v1 is single-branch
- **Public leaderboards** — deferred to v2 (brand risk; see Decision Log)
- **Social media integrations** — removed entirely (see Decision Log)
- **Payment processing** — bookings are confirmed without upfront payment in v1; deposits are a v2 feature

---

## 2. Aesthetic & UX Framework

### 2.1 Non-Negotiable Design Rules

These rules apply to every screen — member-facing and admin alike. They are constraints, not guidelines.

| Rule | Application |
|---|---|
| Palette | True Black (`#1A1A1A`), Paper White (`#FAFAFA`), Soft Slate (`#6B6B6B`). One accent: warm muted gold (`#B8A070`) for tier indicators and active CTAs only. |
| Typography | Display Serif (Playfair Display) for tier names and major headings. Inter (tracked +0.06em) for all UI text. Two typefaces maximum, never mixed within an element. |
| Spacing | 48px minimum vertical rhythm between sections. Member-facing content max-width 640px. Admin content max-width 1200px. Whitespace is part of the product. |
| Motion | Framer Motion for three interactions only: page fade-in (400ms), tier arc animation (800ms spring), reward card reveal on scroll (200ms stagger). Nothing else. |
| Admin panels | Same palette. Increased information density is permitted — admin screens are tools. Data tables, filter bars, and form inputs follow the same typographic rules. |

### 2.2 Gamification Rendering Rules

Gamification elements are present but rendered to fit the Studio aesthetic — not the other way around.

| Element | How it is rendered |
|---|---|
| Tier display | Tier name in Display Serif at 32px. Single hairline arc (SVG, 1px, gold) shows progress. No percentage numbers. No point totals on the hero card. |
| Badges | Horizontal row of minimal monogram-style marks. Max 5 visible. Rare badges use gold accent. Full collection accessed via secondary link. |
| Missions | Clean checklist under "This Week." Max 3 active. Completed = strikethrough + 30% opacity. No progress bars per mission. |
| Streak | Displayed as a number only: "4-week streak." No icons. No animations. Placed in the activity section. |
| Points balance | Visible in activity log only — not the hero stat. The tier name is the brand identity. |

---

## 3. Booking System

The booking system is built natively within The Studio platform. Members book directly through their Member Lounge. Admins manage all bookings, availability, and the service catalogue from the Atelier Dashboard. There is no dependency on a third-party scheduling tool.

> **Points Integration:** Every confirmed and completed appointment automatically triggers the points engine. The booking system is the primary earning touchpoint for the loyalty program — making it native eliminates the webhook dependency and the manual-completion workaround from v2.0.

### 3.1 Service Catalogue

The service catalogue is admin-managed. Each service has the following attributes:

| Field | Type | Notes |
|---|---|---|
| Service name | Text | Displayed in booking flow and member history |
| Description | Long text | Shown on the booking detail screen |
| Duration | Integer (min) | Used to calculate availability slots |
| Price (MYR) | Decimal | Displayed to member; used for spend-threshold calculations |
| Points value | Integer | Points awarded on completion — configurable per service |
| Tier requirement | Enum | Minimum tier to book (default: Initiate — open to all) |
| Staff restriction | Multi-select | If set, only listed staff can perform this service |
| Buffer time (min) | Integer | Gap added after appointment before next slot opens |
| Is active | Boolean | Inactive services are hidden from the booking flow |

### 3.2 Staff Roster

Each staff member has a profile within the system. Staff are not members — they use the Atelier Dashboard only.

| Field | Notes |
|---|---|
| Display name | Shown to members in the booking flow |
| Role | `ADMIN` (full dashboard access) or `STAFF` (booking management only) |
| Services offered | Multi-select from service catalogue — limits which bookings can be assigned |
| Working hours | Per-day schedule (e.g. Mon–Sat, 10:00–19:00) with break blocks |
| Days off | Individual date overrides — holidays, leave, etc. |
| Is active | Inactive staff are hidden from the booking flow |

### 3.3 Member Booking Flow

The booking flow is accessed from the Member Lounge. It follows a linear, step-by-step structure with minimal screens.

| Step | Screen | Member action |
|---|---|---|
| 1 | Service selection | Member selects one service from the active catalogue. Tier-locked services are shown but not selectable (with a label like "Artisan and above"). |
| 2 | Staff selection | Member selects a preferred staff member, or "No preference" (system assigns based on availability). |
| 3 | Date & time | Calendar shows available slots based on staff working hours, existing bookings, and service duration. Unavailable days are greyed out. |
| 4 | Confirmation | Summary screen: service, staff, date/time, price, points to be earned. Member confirms with one tap. |
| 5 | Booking confirmed | Confirmation screen with booking reference. Email confirmation sent. Appointment appears in member's "My Bookings" tab. |

> **Priority Booking:** Artisan-tier members and above receive priority access to booking slots. For a single-chair studio, this means Artisan+ members see slots 48 hours before they open to Initiate and Member tiers. The advance window is configurable in admin settings.

### 3.4 Appointment States

| Status | Triggered by | Points awarded? |
|---|---|---|
| `PENDING` | Member confirms booking | No |
| `CONFIRMED` | Admin confirms (or auto-confirm is enabled) | No |
| `COMPLETED` | Admin marks as completed in dashboard | **Yes — triggers points engine immediately** |
| `CANCELLED` | Member cancels (within window) or admin cancels | No |
| `NO_SHOW` | Admin marks as no-show | No — member flagged for repeat behaviour |

> **Cancellation Window:** Members can cancel up to 24 hours before their appointment without penalty. Cancellations inside 24 hours are flagged in the member's record. After 3 flagged late cancellations, admin is alerted. Configurable in admin settings.

### 3.5 Member Booking Management

- Members view all upcoming and past appointments in a **My Bookings** tab within the Member Lounge
- Upcoming appointments show: service name, staff name, date/time, and a **Cancel** option (visible only within the cancellation window)
- Past appointments show: service name, date, points earned (if completed), and a **Book again** shortcut
- Members cannot reschedule — they must cancel and rebook. This is intentional to simplify v1 logic.

---

## 4. Member Lounge (Client-Side)

### 4.1 Navigation Structure

| Tab | Content |
|---|---|
| Home (Dashboard) | Tier arc, active missions, next reward milestone, streak counter, upcoming appointment summary |
| Book | Entry to the booking flow (Section 3.3) |
| My Bookings | Upcoming and past appointments (Section 3.5) |
| Rewards | The rewards catalogue. Eligible rewards highlighted. Points cost displayed. |
| My Vouchers | Active, redeemed, and expired vouchers. QR code accessible per active voucher. |
| Activity | Chronological feed: points earned/redeemed, tier changes, missions completed, appointments |
| Profile | Display name, email, birth month, referral code, notification preferences, account settings |

### 4.2 Public Landing Page

- **Hero section:** shop name, one high-concept sentence, "Book an Appointment" CTA (primary) and "Member Entry" CTA (secondary)
- **Ghost header:** appears only on scroll-up. Contains logo and the two CTAs.
- No booking flow on the landing page — the CTA routes non-members to registration, members to the Member Lounge booking tab
- No shop interior photography. Abstract texture or high-fashion portraiture only, if imagery is used at all.

---

## 5. Loyalty Program

### 5.1 Points Earning Rules

All rates below are defaults. Every value is overridable by admin in the Loyalty Configurator (Section 6.3).

| Trigger | Default Points | Conditions |
|---|---|---|
| Service completion | Set per service | Admin assigns point value to each service in the catalogue. Awarded when admin marks appointment `COMPLETED`. |
| First booking | +50 pts | One-time, per account lifetime |
| Birthday month | +100 pts | Awarded on day 1 of member's birth month. Requires verified birth month. |
| Review after service | +25 pts | Admin-validated. Member submits review; admin approves before points credit. |
| Referral — referrer | +75 pts | Credited when referred member completes first paid service. 7-day unlock delay. |
| Referral — referee | +25 pts | Same conditions and delay |
| Spend threshold | +150 pts | Triggered when rolling 90-day spend exceeds configured threshold (default MYR 300) |
| Mission completion | Set per mission | Admin defines reward per mission in the Mission Builder (Section 6.3) |

### 5.2 Tier Structure

| Tier | Lifetime pts | Service discount | Priority booking | Monthly bonus |
|---|---|---|---|---|
| Initiate | 0 | — | — | — |
| Member | 250 | 10% | — | +25 pts |
| Artisan | 750 | 15% | 48hr advance | +50 pts |
| Connoisseur | 2,000 | 20% | 48hr advance | +75 pts |
| Patron | 5,000 | 25% | 72hr advance | +100 pts |

> **Tier Basis:** Tier is calculated from `points_lifetime` (all-time earnings), not `points_balance`. Spending points on rewards does not cause a demotion. Demotion only happens through the inactivity policy — zero points earned in 180 days = one tier down. Both the inactivity window and the demotion warning are admin-configurable.

### 5.3 Badges

| Badge | Trigger |
|---|---|
| First Cut | First completed appointment |
| Regular | 5 completed appointments lifetime |
| Devoted | 10 completed appointments lifetime |
| Loyal | 25 completed appointments lifetime |
| Patron's Mark | Reach Patron tier |
| Streak: 4 Weeks | 4 consecutive weeks with at least one completed appointment |
| Streak: 8 Weeks | 8 consecutive weeks |
| Referral: First | First successful referral |
| Referral: Five | 5 successful referrals |
| Seasonal | Admin-created in the Badge Builder for events, campaigns, or seasonal periods |

### 5.4 Missions & Challenges

Three mission types, all configurable and creatable by admin in the Mission Builder:

| Type | Reset cadence | Examples |
|---|---|---|
| Daily | Every 24 hours | Book an appointment today. Leave a review. |
| Weekly | Every Monday | Get 2 haircuts this week. Spend MYR 100+ this week. |
| Quest | Fixed date range | Hair Transformation: 4 cuts in 2 months. Beard Legend: beard service 8 times. |

- Maximum 3 active missions visible to a member at any time
- Completed missions shown as struck-through for the remainder of the period, then hidden on reset
- Quest missions show a progress count (e.g. "2 of 4 cuts completed") — no percentage bar

### 5.5 Vouchers & Redemption

- One-click redemption from rewards catalogue. Member confirms with a second tap (prevents accidental redemption).
- Each voucher has a 30-day validity from redemption date by default — configurable per reward by admin
- QR code generated server-side on each dashboard load. Signed with a 60-minute HMAC window. Screenshots expire.
- Admin scans QR from the Atelier Dashboard validator. System checks: voucher active, not expired, HMAC valid, belongs to presenting member.
- Redemption is atomic — no double-spend is possible

### 5.6 Referral Program

- Each member has a unique referral code displayed in their Profile tab and shareable as a link
- Referee registers using the referral link or enters the code during sign-up
- Points credited to both parties only after referee completes first paid appointment
- 7-day delay before points unlock (anti-abuse)
- Fraud detection: device fingerprint flags same-device registrations within 30 days. Flagged accounts are held for admin review before points are credited.

### 5.7 Points Expiry

- Points expire after 12 months of inactivity (no points earned or redeemed)
- Members receive email warnings at 60 days and 14 days before expiry
- Expired points are logged in the ledger — never silently deleted
- Expiry window and warning schedule are configurable in admin settings

---

## 6. Atelier Dashboard (Admin Panel)

The Atelier Dashboard is the operational heart of The Studio. It is accessible only to users with `ADMIN` or `STAFF` roles. Admins have full access to all four modules. Staff are limited to the Booking Manager.

> **⚠️ Access Control:** Admin roles are set manually in the database on account creation. There is no self-service admin registration. The first admin account is seeded during deployment. Subsequent admins are created by an existing admin in the Staff Manager.

---

### 6.1 Module 1 — Booking Manager

The primary operational screen for daily use. Accessible to both `ADMIN` and `STAFF` roles.

#### 6.1.1 Calendar View

- Day, week, and month views. Default: day view.
- Each appointment shown as a card with: member name, service, duration, and status badge (`PENDING` / `CONFIRMED` / `COMPLETED` / `CANCELLED`)
- Click any card to open the Appointment Detail Panel (below)
- Staff filter: view all staff or filter to a single staff member's calendar
- Drag-and-drop rescheduling — updates appointment time and sends member a notification email. Undoable within 5 seconds.

#### 6.1.2 Appointment Detail Panel

| Feature | Description |
|---|---|
| Member info | Name, tier badge, lifetime visit count, last appointment date. Tapping the name opens the full member profile. |
| Appointment info | Service, staff, date/time, duration, price, booking reference |
| Status actions | Confirm (`PENDING → CONFIRMED`), Complete (`CONFIRMED → COMPLETED`), Mark No-Show, Cancel. Each action requires confirmation. |
| Complete & award | When admin clicks "Complete", points are awarded immediately. Points value and new balance shown in a confirmation toast. |
| Admin notes | Free-text field visible only to admin. Useful for service notes, member preferences, follow-ups. |
| Cancellation | Admin-initiated cancels do not penalise the member's cancellation record |

#### 6.1.3 New Appointment (Admin-Created)

Admin can create appointments directly — useful for walk-ins and phone bookings.

- Search for an existing member by name or email, or create a guest record (no loyalty account)
- Select service, staff, date, and time from the same availability logic as the member flow
- Admin-created appointments are auto-confirmed (no `PENDING` state)

#### 6.1.4 Service Catalogue Manager

Create, edit, and deactivate services. All fields from Section 3.1 are editable. Changes take effect immediately for future bookings — existing bookings are not affected.

#### 6.1.5 Staff & Availability Manager

- Create and edit staff profiles (Section 3.2)
- Set recurring weekly schedules per staff member using a visual time grid
- Block out individual dates or date ranges (leave, holidays)
- View each staff member's booking density as a simple bar chart for the current and next 4 weeks

---

### 6.2 Module 2 — Member Manager

Full visibility into the member base. `ADMIN` role only.

#### 6.2.1 Member List

- Searchable, filterable table of all members
- Filters: tier, join date range, last activity date, referral status, points balance range
- Columns: name, email, tier, points balance, lifetime points, join date, last activity, appointment count
- Export to CSV respecting active filters

#### 6.2.2 Member Profile (Admin View)

| Feature | Description |
|---|---|
| Identity | Name, email, phone (if provided), birth month, join date, referral code, referred by |
| Loyalty summary | Current tier, points balance, lifetime points, streak weeks, badge count |
| Points adjustment | Admin can add or deduct points with a mandatory reason note. Every adjustment is logged to the ledger with the admin's ID. |
| Tier override | Admin can manually set a member's tier, bypassing the points threshold. Logged with reason note. Use sparingly — for special cases only. |
| Appointment history | Full list of past appointments: service, staff, date, status, points awarded |
| Points ledger | Full chronological ledger: every earn, redeem, adjustment, and expiry event with balance snapshots |
| Active vouchers | Admin view of all current vouchers — status, reward, expiry, redemption detail |
| Referral activity | Who this member referred, whether they converted, and whether points were credited |
| Fraud flags | Device-fingerprint flags and late cancellation flags shown with timestamps |
| Account actions | Suspend account (blocks login), Delete account (irreversible — triggers PDPA data erasure flow) |

#### 6.2.3 Review Approval Queue

When a member submits a post-service review, it enters a queue here. Admin reads the review and either approves (triggering +25 pts) or rejects (no points, no member notification). The queue shows: member name, appointment date, service, and review text.

---

### 6.3 Module 3 — Loyalty Configurator

The Loyalty Configurator is the most powerful section of the admin panel. Every parameter of the loyalty economy is set here — no code deployment required to adjust rates, tiers, missions, or rewards.

> **Change Log:** Every change made in the Loyalty Configurator is recorded — what changed, the old value, the new value, which admin made the change, and a timestamp. This log is visible at the bottom of each settings screen.

#### 6.3.1 Points Engine Settings

| Setting | Default | Range / Notes |
|---|---|---|
| Base point rate | 1.0× | Global multiplier applied on top of per-service values. Set to 2.0× for a double-points campaign. |
| Seasonal multiplier | — | Date-range multiplier (e.g. 1.5× from 1–7 Dec). Stacks with base rate. Max one active at a time. |
| First booking bonus | 50 pts | 0–500 |
| Birthday bonus | 100 pts | 0–500 |
| Review bonus | 25 pts | 0–200 |
| Referral — referrer | 75 pts | 0–500 |
| Referral — referee | 25 pts | 0–500 |
| Referral unlock delay | 7 days | 1–30 days |
| Spend threshold amount | MYR 300 | Rolling 90-day window |
| Spend threshold bonus | 150 pts | Points awarded when threshold crossed |
| Points expiry window | 12 months | 3–36 months of inactivity |
| Expiry warning — first | 60 days before | Configurable |
| Expiry warning — second | 14 days before | Configurable |

#### 6.3.2 Tier Settings

| Setting | Notes |
|---|---|
| Tier thresholds | Lifetime points required for each tier. Changing thresholds does not retroactively demote members — applies to future progressions only. |
| Tier names | Display names for each tier. Changing names updates all member-facing UI immediately. |
| Service discount per tier | Percentage discount applied to service price at booking. Shown to member at checkout. |
| Priority booking window | Hours of advance access per tier (Artisan+). Default: 48hr for Artisan/Connoisseur, 72hr for Patron. |
| Monthly bonus points | Points auto-credited on the first of each month per tier. |
| Inactivity demotion | Days of zero-earning inactivity before demotion one tier. Default: 180. Set to 0 to disable. |
| Demotion warning email | Days before demotion to send warning email. Default: 30. |

#### 6.3.3 Reward & Voucher Manager

| Feature | Description |
|---|---|
| Create reward | Title, description, category (Discount / Service / Merchandise / Experience), points cost, minimum tier, discount percent, stock count (null = unlimited), expiry days, active toggle |
| Edit reward | All fields editable. Changes apply to future redemptions only — existing vouchers are not affected. |
| Deactivate reward | Hides reward from member catalogue immediately. Existing active vouchers for this reward remain valid. |
| Stock alert | Admin receives in-dashboard notification when physical reward stock falls to 3 or fewer units |
| Voucher ledger | Filterable table of all issued vouchers: member, reward, issued date, expiry, status, redeemed by |
| Bulk expire | Admin can expire all active vouchers for a specific reward. Requires confirmation. |

#### 6.3.4 Mission Builder

| Feature | Description |
|---|---|
| Create mission | Title, description, type (Daily / Weekly / Quest), trigger (BOOKING\_COUNT / SPEND\_THRESHOLD / SERVICE\_SPECIFIC), target value, points reward, min tier (optional), start date, end date, active toggle |
| Active missions | List of currently active missions with live completion rate (% of eligible members who completed it) |
| Reset behaviour | Daily: midnight local time. Weekly: Monday midnight. Quest: no reset — runs until end date or completion. |
| Mission preview | Admin can preview how a mission appears in the member's lounge before activating it |
| Deactivate mission | Hides from new members. Members who already completed it retain their points. |

#### 6.3.5 Badge Manager

System badges (First Cut, Streak badges, etc.) are fixed and cannot be deleted. Admin can create additional custom badges.

| Feature | Description |
|---|---|
| Create badge | Name, description, trigger type (APPOINTMENT\_COUNT / TIER\_REACHED / REFERRAL\_COUNT / MANUAL), trigger value, rarity (Standard / Rare / Legendary), active toggle |
| Manual badge award | Admin can award any badge to any member directly from the member profile |
| Badge visibility | Admin can hide a badge from the member-facing collection without deleting it |

#### 6.3.6 Notification Settings

| Notification | Channel | Trigger | Admin-configurable |
|---|---|---|---|
| Tier upgrade | Push | Immediate on tier change | Toggle on/off |
| Reward expiring | Push | 7 days before voucher expiry | Toggle; days configurable |
| Birthday reward | Push | Day 1 of birth month | Toggle on/off |
| Weekly digest | Email | Every Monday | Toggle; day configurable |
| Points expiry warning | Email | 60 and 14 days before expiry | Toggle; days configurable |
| Demotion warning | Email | 30 days before inactivity demotion | Toggle; days configurable |
| Booking confirmation | Email | Immediate on booking created | Toggle; template editable |
| Appointment reminder | Email | 24 hours before appointment | Toggle; hours configurable |
| Cancellation confirmation | Email | Immediate on cancellation | Toggle on/off |

---

### 6.4 Module 4 — Analytics

A read-only reporting module. All data refreshes daily at 06:00 local time.

#### 6.4.1 Business Overview

| Report | Content |
|---|---|
| Appointments | Total completed this month vs. last. Completion rate. Cancellation and no-show rates. |
| Revenue | Total appointment value (MYR) for completed appointments. Breakdown by service. 12-month trend line. |
| Busiest periods | Heatmap of appointment density by day of week and hour of day |
| Staff utilisation | Completed appointments per staff member this month. Available slot fill rate. |

#### 6.4.2 Loyalty Overview

| Report | Content |
|---|---|
| Member growth | Total registered members. New registrations this month vs. last. Cumulative growth chart. |
| Tier distribution | Members by tier as a bar chart. Trend over last 6 months. |
| Points economy | Points issued and redeemed this month. Net points in circulation. Breakdown by reason. |
| Reward redemption | Vouchers issued and redeemed. Top 5 most redeemed rewards. Average days to redemption. |
| Mission performance | Completion rate per active mission |
| Referral funnel | Links shared → registrations → first service → points credited. Drop-off at each stage. |

#### 6.4.3 Member Segments

Pre-built segments for quick insight. Each is exportable to CSV.

| Segment | Definition |
|---|---|
| At risk of demotion | No earning activity in 120+ days (approaching 180-day threshold) |
| High-value | Members in Connoisseur or Patron tier |
| Lapsed | No completed appointment in 90+ days but account still active |
| New this month | Registered in the current calendar month |
| Referral champions | 3 or more successful referrals |
| Fraud watch | Members with active device-fingerprint or late-cancellation flags |

---

## 7. Compliance

### 7.1 PDPA Malaysia (Personal Data Protection Act 2010)

> **⚠️ Legal Requirement:** The Studio collects personal data including names, email addresses, phone numbers, birth months, appointment history, and device fingerprints. All of this falls under PDPA 2010. Compliance is non-negotiable.

- Consent screen on first registration: states what data is collected, how it is used, and who can access it. Consent is logged with timestamp.
- Members can download their full data as JSON from profile settings
- Member-initiated account deletion is permanent within 30 days. Admin-initiated deletion is immediate. Both trigger the full data erasure flow.
- Device fingerprint data: hashed, retained 90 days only, then purged
- Privacy policy linked from every page footer and the consent screen. Written in English and Bahasa Malaysia.

### 7.2 Data Minimisation

- **Birthday:** Only birth month collected — not full date. Satisfies the birthday bonus trigger while reducing data sensitivity.
- **Phone number:** Optional. Used only for account recovery. Not used for marketing.
- **Social media:** Not collected. The social check-in feature has been removed.

---

## 8. Success Metrics

| Metric | Target (6 months) | Measurement |
|---|---|---|
| Member registration rate | 60% of new clients register | New auth accounts / admin service records |
| Booking conversion | 70% of registered members make at least one booking via the platform | Bookings with member ID / total registered |
| Loyalty dashboard load time | < 2 seconds on 4G | Lighthouse + real user monitoring |
| Tier 2+ attainment | 30% of registered members reach Artisan | Tier distribution report |
| Reward redemption rate | > 15% of eligible members redeem per month | Voucher ledger |
| Referral conversion | > 20% of referred leads complete first service | Referral funnel report |
| Admin task time | Complete appointment + award points in < 30 seconds | Internal usability test |

---

## Appendix: Decision Log

**D-01: Leaderboards deferred to v2.**
Public rankings are inconsistent with the premium, private-club aesthetic. They also create social risk (public shaming of low-engagement members). Revisit when the member base exceeds 500.

**D-02: Social check-in removed.**
User-generated content is inherently off-brand. The Studio's visual identity cannot survive uncontrolled Instagram posts. Replace with a curated "Styled by The Studio" gallery managed by the shop — a separate marketing initiative, not a product feature.

**D-03: Push notifications limited to 3 types.**
A luxury product should never feel like it is pestering its members. Three push types are the maximum that can be justified as high-signal. All others are opt-in email.

**D-04: Points not surfaced as the hero stat.**
Points are a mechanism, not the brand. The member's tier is the brand. Points are visible in the activity log for transparency, but they are not the first thing a member sees. This is consistent with how Amex and high-end hotel programmes present membership.

**D-05: Booking built natively (not third-party).**
A native booking system eliminates the webhook dependency, makes points attribution immediate and reliable, and gives the admin panel full control over availability, service catalogue, and appointment states. The added scope is justified by the reduction in integration risk and the tighter connection between bookings and the loyalty engine.

**D-06: Payment processing deferred to v2.**
Introducing payment in v1 adds significant scope (payment gateway integration, refund flows, partial payments, failed payment handling). The loyalty program operates on completed services, not payments. Deposits can be added in v2 once the booking behaviour of the member base is understood.
