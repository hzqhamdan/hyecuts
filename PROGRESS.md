# Progress

## Goal
- Ensure every page and component fully supports toggling translations between English and Bahasa Malaysia.
- Every single text element on every page must translate when the user switches the language.
- The language toggle switch must be available and accessible on every single page/view.

## Done
- Resolved all linting warnings.
- Enabled React Compiler via Vite plugin.
- Migrated `BookingFlow` state to Zustand.
- Integrated TanStack Query for data fetching and mutations.
- Passed E2E tests using Playwright and unit tests using Vitest.
- Expanded `en.json` and `ms.json` dictionaries to cover all site strings.
- Implemented `useTranslation()` hooks across the entire application.
- Added language toggle button on all pages.
- Localized all "API-style" dynamic data (Rewards, Badges, Missions, and Tiers).
- **Atelier Dashboard (Admin Panel) Completed**:
    - `MemberManager.tsx`: Searchable member registry with point adjustment and tier override.
    - `StaffManager.tsx`: Team roster and availability management interface.
    - `ReviewQueue.tsx`: Validation module for post-service feedback and points awarding.
    - Integrated language toggle in admin sidebar.
    - Localized all admin modules.
- **Member Lounge**:
    - Enhanced PDPA data export (includes profile, activity, badges, and mission progress).
    - Fully implemented Dark Mode (palette #1A1A1A / #FAFAFA).
- **Codebase Cleanup**:
    - Removed orphaned `AdminLogin.tsx` component.
    - Removed unused build/utility scripts.
    - Final Dark Mode Audit completed across all components.
    - Final Dynamic Data i18n Audit completed.

## Next Steps / Unresolved
- [x] PDPA Delete Account backend integration.
- [x] Revamp Profile Page: Create dedicated UserProfile full-screen overlay/modal, implement tabs (General, Hair Profile, Security) and framer-motion transitions.

## Key Decisions
- Standardized language toggle: Shows active language with icon (Globe for EN, Flag for MY) across the entire application.
- Tier/Reward mapping: Use a mapping strategy where backend-provided keys are dynamically localized in the UI.
- Dark Mode Palette: Enforced strict adherence to `#1A1A1A` for dark backgrounds and `#FAFAFA` for dark text.

## Relevant Files
- `src/i18n/locales/en.json` & `src/i18n/locales/ms.json`: Active translation dictionaries.
- `src/data/hyecuts.ts`: Business data mapped to translation keys.
- `src/components/atelier/*`: Admin modules.
- `src/components/booking/*`: Booking flow components.
- `src/MemberLounge.tsx`: Member-facing loyalty interface.

## Backlog / Future Enhancements

### 1. Functional & Backend Integrations
- [x] Profile Save API: Connect "Save Changes" to backend.
- [x] PDPA Delete Account: Actual backend API call.
- [x] Avatar Uploads: File input for profile pictures.

### 2. Booking Flow Enhancements
- [x] Calendar Integration: Added "Add to Calendar" button in UserBookings generating an `.ics` file.
- [x] Reschedule Flow: Added "Reschedule" UI placeholder button in UserBookings.
- [ ] Deposits & Payments (Stripe integration).

### 3. Member Lounge & Gamification
- [x] Notification System: Added Bell icon with unread badge and dropdown/popover in Member Lounge.
- [x] Animated Mission Progress bars: Replaced raw text progress in 'Directives' with framer-motion powered progress bars.

### 4. Admin (Atelier) Upgrades
- [ ] Data Visualization with interactive charts (recharts).
- [ ] Role-Based Access Control (RBAC) enforcement on UI.
