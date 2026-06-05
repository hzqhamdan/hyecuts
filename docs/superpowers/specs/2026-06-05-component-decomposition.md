# Component Decomposition — Phase 4 Design

## Goal

Break down `MemberLounge.tsx` (677 lines) and `LandingPage.tsx` (438 lines) into focused sub-component files with zero UI or behavior changes. Pure cut-and-paste extraction — no logic refactoring, no styling changes, no markup modifications.

## Layout Changes

| File | Current Lines | After Extraction | Files Created |
|---|---|---|---|
| `MemberLounge.tsx` | 677 | ~240 | 7 new files under `src/components/lounge/` |
| `LandingPage.tsx` | 438 | ~60 | 7 new files under `src/components/landing/` |

## MemberLounge Decomposition

All new files go in `src/components/lounge/`. Each component receives exactly the props it needs to render the same markup — no more, no less.

### LoungeHeader.tsx
- Lines 183–290: nav bar, back button, desktop nav links, notification bell + dropdown, logout, language toggle
- Props: `onLogout: () => void`, `onToggleLanguage: () => void`, `onToggleNotifications: () => void`, `onOpenSettings: () => void`, `showNotifications: boolean`, `unreadCount: number`, `notifications: Notification[]`, `i18nLang: string`, `isDark: boolean` (for flag icon)

### MobileMenu.tsx
- Lines 292–339: full-screen mobile overlay
- Props: `isOpen: boolean`, `onClose: () => void`, `onLogout: () => void`, `onToggleLanguage: () => void`, `i18nLang: string`

### StatusCard.tsx
- Lines 343–381: tier name, SVG progress arc, tier description
- Props: `profile: LoyaltyProfile | null`, `isLoading: boolean`, `progressData: { percentage: number; nextTier: string }`, `tierLabel: string`

### RewardPortfolio.tsx
- Lines 383–453 (excludes activity feed): header, reward cards grid with loading/empty states, hover overlay
- Props: `rewards: Reward[]`, `isLoading: boolean`, `onRedeem: (reward: Reward) => void`

### VoucherModal.tsx
- Lines 571–633: redemption state machine, physical card UI
- Props: `voucher: Reward | null`, `status: 'idle' | 'loading' | 'success' | 'error'`, `onClose: () => void`, `onConfirmRedeem: () => void`
- Note: this component already has a parallel file `src/components/member-lounge/VoucherModal.tsx` that's unused — overwrite it

### ActivityFeed.tsx
- Lines 455–478: recent activity section
- Props: `activities: ActivityLog[]`, `isLoading: boolean`

### MissionsPanel.tsx
- Lines 485–533: mission progress rows with animated bars
- Props: `missions: Mission[]`, `missionProgress: UserMissionProgress[]`, `isLoading: boolean`

### BadgeShowcase.tsx
- Lines 535–568: badge pills with locked/unlocked states
- Props: `badges: Badge[]`, `userBadges: UserBadge[]`, `isLoading: boolean`

## LandingPage Decomposition

All new files go in `src/components/landing/`. Same strict cut-and-paste rule.

### MobileMenu.tsx
- Lines 123–181: full-screen mobile overlay
- Props: `isOpen: boolean`, `onClose: () => void`, `token: string | null`, `onToggleLanguage: () => void`, `i18nLang: string`

### Navbar.tsx
- Lines 53–121: fixed nav bar, desktop links, login, language, hamburger
- Props: `isMenuOpen: boolean`, `onToggleMenu: () => void`, `token: string | null`, `onToggleLanguage: () => void`, `i18nLang: string`

### HeroSection.tsx
- Lines 183–215: hero with CTAs
- Props: `shopName: string`

### ServicesSection.tsx
- Lines 217–312: service category accordion
- Props: none (reads from `useBookingStore` and `useTranslation` internally via hooks)

### HoursSection.tsx
- Lines 314–347: business hours + policies
- Props: none (reads `useTranslation` internally)

### ContactSection.tsx
- Lines 349–416: contact details, team, social links
- Props: none (reads `useTranslation` internally)

### Footer.tsx
- Lines 418–434: brand + address + credit
- Props: `shopName: string`, `address: string`

## Shared Extractions

### src/utils/animations.ts
- Lines 25–43 from LandingPage: `fadeUp`, `staggerContainer`, `navTap`, `navTapTransition` framer-motion Variants
- Used by Navbar, HeroSection, MobileMenu, ContactSection

## Data Flow Rules
- MemberLounge keeps all `useState`, `useEffect` for data fetching, and handler functions
- Extracted components receive data as props or use `useNavigate()`/`useTranslation()` directly via hooks
- LandingPage extracted components use `useTranslation()`, `useNavigate()`, `useBookingStore()` directly via hooks (not prop-drilled)
- No state or behavior changes — strictly moving JSX + its direct hook calls into separate files

## Verification
- `npx tsc --noEmit` passes
- `npx vitest run` passes
- Visual diff: the rendered DOM should be identical atom-for-atom — no class changes, no structure changes, no conditional rendering differences
