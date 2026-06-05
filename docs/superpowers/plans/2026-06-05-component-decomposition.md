# Component Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break down `MemberLounge.tsx` (677 lines) and `LandingPage.tsx` (438 lines) into focused sub-components with zero UI changes. Pure cut-and-paste extraction.

**Architecture:** Extract inline JSX sections into separate component files under `src/components/lounge/` and `src/components/landing/`. Types move to `src/types/loyalty.ts`. Framer-motion variants move to `src/utils/animations.ts`. Parent components import and compose extracted components with identical props.

**Tech Stack:** React 19, TypeScript 6, framer-motion, react-i18next, react-router-dom

---

### Task 1: Move LoyaltyProfile type to src/types/loyalty.ts

**Files:**
- Modify: `src/MemberLounge.tsx:11-15`
- Modify: `src/types/loyalty.ts`

- [ ] **Add LoyaltyProfile to src/types/loyalty.ts**

Append to the end of the file (before the final export):

```typescript
export interface LoyaltyProfile {
  userId: string;
  pointsBalance: number;
  currentTier: string;
}
```

- [ ] **Remove LoyaltyProfile from MemberLounge.tsx**

Delete lines 11-15 (`interface LoyaltyProfile { ... }`).

- [ ] **Add import to MemberLounge.tsx**

Add `LoyaltyProfile` to the existing import from `../../types/loyalty` (change line 3 to also import it, or add a new import line).

- [ ] **Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 2: Extract framer-motion variants to src/utils/animations.ts

**Files:**
- Create: `src/utils/animations.ts`
- Modify: `src/components/landing/LandingPage.tsx:25-43`

- [ ] **Create src/utils/animations.ts**

```typescript
import { type Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } }
};

export const navTap = { scale: 0.94, y: 1 };

export const navTapTransition = { type: "spring" as const, stiffness: 400, damping: 17 };
```

- [ ] **Replace inline variants in LandingPage.tsx**

Remove lines 25-43 (the `fadeUp`, `staggerContainer`, `navTap`, `navTapTransition` declarations). Add import:

```typescript
import { fadeUp, staggerContainer, navTap, navTapTransition } from '../../utils/animations';
```

- [ ] **Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 3: Extract all MemberLounge sub-components + reassemble

**Files:**
- Create: `src/components/lounge/LoungeHeader.tsx`
- Create: `src/components/lounge/MobileMenu.tsx`
- Create: `src/components/lounge/StatusCard.tsx`
- Create: `src/components/lounge/RewardPortfolio.tsx`
- Create: `src/components/lounge/ActivityFeed.tsx`
- Create: `src/components/lounge/MissionsPanel.tsx`
- Create: `src/components/lounge/BadgeShowcase.tsx`
- Modify: `src/components/member-lounge/VoucherModal.tsx` (overwrite existing unused file)
- Modify: `src/MemberLounge.tsx`

**CRITICAL RULE: ZERO UI CHANGES.** Every line of JSX, every CSS class, every framer-motion prop, every conditional must be identical. The rendered DOM must be byte-for-byte the same. Do NOT:
- Change class names
- Change structure or nesting
- Change conditional logic
- Change animation variants or durations
- Change event handler logic
- Add or remove wrapper elements

**Extraction approach for each component:**
1. Read the exact lines from MemberLounge.tsx
2. Wrap them in a new function component file
3. The component calls `useNavigate()`, `useTranslation()`, `useAuth()` directly (not prop-drilled)
4. Everything NOT in the extracted section stays in MemberLounge.tsx
5. Data/state is passed as props from the parent

#### Sub-component: LoungeHeader (`src/components/lounge/LoungeHeader.tsx`)
- Extract lines 183-290 (nav bar, notifications, logout, language)
- Props: `onLogout: () => void`, `onToggleLanguage: () => void`, `showNotifications: boolean`, `onToggleNotifications: () => void`, `onOpenSettings: () => void`, `onCloseNotifications: () => void`, `unreadCount: number`, `notifications: Array<{id: number, message: string, read: boolean}>`, `i18nLang: string`
- Uses `useNavigate()` internally for nav links

#### Sub-component: MobileMenu (`src/components/lounge/MobileMenu.tsx`)
- Extract lines 292-339 (mobile overlay)
- Props: `isOpen: boolean`, `onClose: () => void`, `onLogout: () => void`, `onToggleLanguage: () => void`, `onOpenSettings: () => void`, `i18nLang: string`
- Uses `useNavigate()` internally

#### Sub-component: StatusCard (`src/components/lounge/StatusCard.tsx`)
- Extract lines 343-381 (tier card with SVG arc)
- Import `LoyaltyProfile` from `../../types/loyalty`
- Props: `profile: LoyaltyProfile | null`, `isLoading: boolean`, `progressData: { percentage: number; nextTier: string }`, `tierLabel: string`

#### Sub-component: RewardPortfolio (`src/components/lounge/RewardPortfolio.tsx`)
- Extract lines 385-453 (reward cards grid + loading/empty states) — everything from the portfolio header to the start of the activity feed
- Import `Reward` from `../../types/loyalty`
- Props: `rewards: Reward[]`, `isLoading: boolean`, `onRedeem: (reward: Reward) => void`

#### Sub-component: VoucherModal (`src/components/member-lounge/VoucherModal.tsx`)
- OVERWRITE the existing file at `src/components/member-lounge/VoucherModal.tsx`
- Extract lines 571-633 (the voucher redemption modal overlay)
- Props: `voucher: Reward | null`, `status: 'idle' | 'loading' | 'success' | 'error'`, `onClose: () => void`, `onConfirmRedeem: () => void`

#### Sub-component: ActivityFeed (`src/components/lounge/ActivityFeed.tsx`)
- Extract lines 455-478 (recent activity section header + rows)
- Import `ActivityLog` from `../../types/loyalty`
- Props: `activities: ActivityLog[]`, `isLoading: boolean`

#### Sub-component: MissionsPanel (`src/components/lounge/MissionsPanel.tsx`)
- Extract lines 485-533 (mission rows with progress bars)
- Import `Mission`, `UserMissionProgress` from `../../types/loyalty`
- Props: `missions: Mission[]`, `missionProgress: UserMissionProgress[]`, `isLoading: boolean`

#### Sub-component: BadgeShowcase (`src/components/lounge/BadgeShowcase.tsx`)
- Extract lines 535-568 (badge pills + view collection link)
- Import `Badge`, `UserBadge` from `../../types/loyalty`
- Props: `badges: Badge[]`, `userBadges: UserBadge[]`, `isLoading: boolean`

#### Reassemble MemberLounge.tsx

After all extractions, MemberLounge.tsx should:
- Remove all inline type definitions (they're now in `src/types/loyalty.ts`)
- Remove all framer-motion Variants (those were in MemberLounge? Let me check...)

Actually, looking at the MemberLounge analysis, it doesn't have framer-motion Variants defined inline. The `springTransition` is defined inside the component function. Good.

- Import all 8 extracted components
- Replace each inline JSX section with the corresponding component, passing the same data/handlers as props
- Keep all state variables, the `useEffect` data fetcher, `handleRedeem`, and `getTierProgress` — these stay in MemberLounge

The final MemberLounge.tsx return block should look like:

```tsx
return (
  <div className="min-h-screen ...">
    <LoungeHeader ... />
    <MobileMenu ... />
    <div className="max-w-7xl mx-auto ...">
      <div className="flex flex-col lg:flex-row ...">
        <StatusCard ... />
        <div className="flex flex-col ...">
          <RewardPortfolio ... />
          <ActivityFeed ... />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 ...">
        <MissionsPanel ... />
        <BadgeShowcase ... />
      </div>
    </div>
    <VoucherModal ... />
    <UserProfileModal ... />
  </div>
);
```

- [ ] **Verify TypeScript**

```bash
cd C:\Users\nurha\hyecuts
npx tsc --noEmit
```

Expected: no errors.

---

### Task 4: Extract all LandingPage sub-components + reassemble

**Files:**
- Create: `src/components/landing/Navbar.tsx`
- Create: `src/components/landing/HeroSection.tsx`
- Create: `src/components/landing/ServicesSection.tsx`
- Create: `src/components/landing/HoursSection.tsx`
- Create: `src/components/landing/ContactSection.tsx`
- Create: `src/components/landing/Footer.tsx`
- Overwrite: `src/components/landing/MobileMenu.tsx` (already exists but is inline in LandingPage)
- Modify: `src/components/landing/LandingPage.tsx`

**CRITICAL RULE: ZERO UI CHANGES.** Same as Task 3.

**Extraction approach:**
- LandingPage sub-components can call `useTranslation()`, `useNavigate()`, `useBookingStore()` directly since they're global hooks
- No prop-drilling needed for these
- `isMenuOpen` and `toggleLanguage` must be passed as props (local state in LandingPage)

#### Sub-component: Navbar (`src/components/landing/Navbar.tsx`)
- Extract lines 53-121 (fixed nav, desktop links, language toggle, hamburger)
- Props: `isMenuOpen: boolean`, `onToggleMenu: () => void`, `token: string | null`, `onToggleLanguage: () => void`, `i18nLang: string`
- Uses `useNavigate()` and `useTranslation()` internally

#### Sub-component: MobileMenu (`src/components/landing/MobileMenu.tsx`)
- Extract lines 123-181 (mobile overlay)
- Props: `isOpen: boolean`, `onClose: () => void`, `token: string | null`, `onToggleLanguage: () => void`, `i18nLang: string`
- Uses `useNavigate()` and `useTranslation()` internally

#### Sub-component: HeroSection (`src/components/landing/HeroSection.tsx`)
- Extract lines 183-215 (hero with CTAs)
- Props: none (uses `useNavigate()` and `useTranslation()` internally)

#### Sub-component: ServicesSection (`src/components/landing/ServicesSection.tsx`)
- Extract lines 217-312 (service category accordion)
- Props: none (uses `useBookingStore()`, `useNavigate()`, `useTranslation()` internally)
- Imports `SERVICE_CATEGORIES`, `ALL_SERVICES` from `../../data/hyecuts`

#### Sub-component: HoursSection (`src/components/landing/HoursSection.tsx`)
- Extract lines 314-347 (business hours + policies)
- Props: none (uses `useNavigate()` and `useTranslation()` internally)
- Imports `BUSINESS_HOURS`, `BOOKING_POLICIES` from `../../data/hyecuts`

#### Sub-component: ContactSection (`src/components/landing/ContactSection.tsx`)
- Extract lines 349-416 (contact details, team, social links)
- Props: none (uses `useNavigate()` and `useTranslation()` internally)
- Imports `HYECUTS`, `TEAM_MEMBERS` from `../../data/hyecuts`

#### Sub-component: Footer (`src/components/landing/Footer.tsx`)
- Extract lines 418-434 (brand + address + credit)
- Props: none (uses `useNavigate()` and `useTranslation()` internally)
- Imports `HYECUTS` from `../../data/hyecuts`

#### Reassemble LandingPage.tsx

After all extractions:

```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useBookingStore } from '../../store/useBookingStore';
import { useNavigate } from 'react-router-dom';
import { fadeUp } from '../../utils/animations';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import HeroSection from './HeroSection';
import ServicesSection from './ServicesSection';
import HoursSection from './HoursSection';
import ContactSection from './ContactSection';
import Footer from './Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openCategory, setOpenCategory, selectedService, setSelectedService } = useBookingStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    void i18n.changeLanguage(newLang);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] min-h-screen font-sans transition-colors duration-500 overflow-x-hidden"
    >
      <Navbar
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => { setIsMenuOpen((prev) => !prev); }}
        token={token}
        onToggleLanguage={toggleLanguage}
        i18nLang={i18n.language}
      />
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => { setIsMenuOpen(false); }}
        token={token}
        onToggleLanguage={toggleLanguage}
        i18nLang={i18n.language}
      />
      <HeroSection />
      <ServicesSection />
      <HoursSection />
      <ContactSection />
      <Footer />
    </motion.div>
  );
};

export default LandingPage;
```

- [ ] **Verify TypeScript**

```bash
cd C:\Users\nurha\hyecuts
npx tsc --noEmit
```

Expected: no errors.

---

### Task 5: Verification

- [ ] **TypeScript check**

```bash
cd C:\Users\nurha\hyecuts
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Run tests**

```bash
npx vitest run
```

Expected: 12/12 passing (no behavioral changes).

- [ ] **Manual spot check**

Verify these are untouched:
- `src/api/client.ts` — no changes
- `src/App.tsx` — no changes
- `src/AtelierDashboard.tsx` — no changes
- `src/LoginScreen.tsx` — no changes
- `src/components/booking/` — no changes
- `src/components/atelier/` — no changes
- `src/context/` — no changes
