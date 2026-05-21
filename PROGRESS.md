# Progress

## Goal
- Ensure every page and component fully supports toggling translations between English and Bahasa Malaysia.
- Every single text element on every page must translate when the user switches the language.
- The language toggle switch must be available and accessible on every single page/view.

## Done
- Resolved all linting warnings (`react-refresh/only-export-components`, `react-hooks/exhaustive-deps`, `no-unnecessary-condition`).
- Enabled React Compiler via Vite plugin.
- Migrated `BookingFlow` state to Zustand (`useBookingStore`).
- Integrated TanStack Query for data fetching and mutations.
- Passed E2E tests using Playwright and unit tests using Vitest.
- Expanded `en.json` and `ms.json` dictionaries to cover all site strings.
- Implemented `useTranslation()` hooks and mapped hardcoded text in all pages.
- Mapped text values from `src/data/hyecuts.ts` dynamically at the component level.
- Added language toggle button on: `LandingPage.tsx`, `LoginScreen.tsx`, `MemberLounge.tsx`, `BookingFlow.tsx`.
- Replaced `Globe` icon with Malaysian flag emoji + "MY" text when language is English; `Globe` icon + "EN" text when language is Malay.
- Added `i18n` usage for `handleConfirm` error messages in `BookingFlow.tsx`.
- Translated all remaining hardcoded strings in `BookingFlow.tsx` (confirmation messages, notes header).
- Translated all remaining hardcoded strings in `MemberLounge.tsx` (tier description, loading states, voucher modal, profile/privacy modal, redemption messages, badge/mission labels).
- Verified changes via successful `npm run build`.

## In Progress
- (none)

## Next Steps / Unresolved
- The language toggle shows what you're switching **to** (e.g., "MY" while viewing English) rather than what's currently active. This may confuse users. Consider changing to always show the current language instead.
- Some remaining hardcoded strings that are harder to translate without changing data structures:
  - Time values in `BookingFlow.tsx` (`'12:00 PM'`, `'2:30 PM'`, etc.) — these are display-only and may be acceptable in English
  - Staff names (`'Haiqal'`, `'Naim'`) — proper nouns, no translation needed
  - `HYECUTS.address`, `HYECUTS.phone`, `HYECUTS.email`, `HYECUTS.waze` — business data, no translation needed
  - `HYECUTS.name` ("Hyecuts") — brand name, no translation needed
  - `reward.title` and `reward.description` come from API — would need backend i18n support
  - `badge.name` and `badge.description` come from API — would need backend i18n support
  - `mission.title` and `mission.description` come from API — would need backend i18n support
  - `mission.targetAction` comes from API — would need backend i18n support
  - Tier names (`'Rookie'`, `'Regular'`, `'Legend'`, `'Master'`, `'Icon'`) — come from API, would need backend i18n
  - "The Studio" in voucher modal header — brand name, could stay as-is
  - "The pinnacle of grooming..." tier description — now translated via `lounge.tier_description`

## Key Decisions
- Moved complex local state to Zustand and standard API effects to React Query to simplify component logic before adding i18n.
- Retained hardcoded English data structures in `src/data/hyecuts.ts` and mapped them to translation keys at the component level (e.g., `t('data.days.' + item.day)`) to avoid breaking other references.
- Language toggle icon: Globe when showing EN (Malay mode), Malaysian flag emoji when showing MY (English mode).

## Critical Context
- Terminal is PowerShell; avoid Unix-only redirects, multiline heredocs, and operators like `&&`.
- The project is configured as an ES module (`"type": "module"` in `package.json`), meaning standalone scripts using CommonJS `require()` must use the `.cjs` extension.

## Relevant Files
- `src/i18n/locales/en.json` & `src/i18n/locales/ms.json`: Active dictionaries for translation strings.
- `src/data/hyecuts.ts`: Contains hardcoded business data that is mapped to translations dynamically in UI components.
- `src/components/landing/LandingPage.tsx`: I18n implemented with toggle.
- `src/LoginScreen.tsx`: I18n implemented with toggle.
- `src/MemberLounge.tsx`: I18n implemented with toggle.
- `src/components/booking/BookingFlow.tsx`: I18n implemented with toggle.
- `src/store/useBookingStore.ts`: Zustand store for booking flow state.
