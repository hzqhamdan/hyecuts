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
- Language toggle now shows the **active** language (e.g., "EN" while in English) across all pages for a more standard user experience.
- Localized all "API-style" dynamic data (Rewards, Badges, Missions, and Tiers) by mapping their hardcoded seeder values to translation keys in the frontend.
- Localized time values in `BookingFlow.tsx` (e.g., "12:00 PM" -> "12:00 TGH").
- Localized common UI elements like "The Studio" branding in modals.

## In Progress
- (none)

## Next Steps / Unresolved
- Staff names (`'Haiqal'`, `'Naim'`) — proper nouns, no translation needed.
- `HYECUTS.address`, `HYECUTS.phone`, `HYECUTS.email`, `HYECUTS.waze` — business data, no translation needed.
- `HYECUTS.name` ("Hyecuts") — brand name, no translation needed.
- Ensure any future rewards/badges added to the database seeder have corresponding entries in `en.json` and `ms.json`.

## Key Decisions
- Moved complex local state to Zustand and standard API effects to React Query to simplify component logic before adding i18n.
- Standardized language toggle: Shows active language with icon (Globe for EN, Flag for MY).
- Tier/Reward mapping: Instead of full backend i18n support, we use a mapping strategy where the hardcoded seeder strings are used as keys (e.g., `t('data.rewards.' + reward.title + '.title')`).

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
