# Project Improvements & Roadmap

This file tracks the status of suggested improvements for **Hyecuts (The Studio)**.

## 1. Technical & Performance Optimizations
- [x] Enable React Compiler (Vite plugin)
- [x] Stricter Type Safety (`strictTypeChecked` in ESLint)
- [x] Code Splitting (React.lazy/Suspense for Admin/Booking flows)

## 2. Architectural Improvements
- [x] Integrate TanStack Query (React Query) for data fetching
- [x] Lightweight State Management (Zustand) for Booking Flow

## 3. Feature Enhancements (Active)
- [x] **PWA Support** (Vite PWA plugin, Service Workers, Manifest)
- [x] **Advanced Analytics Visualization** (Recharts/Tremor in Atelier Dashboard)
- [x] **API Error Resolution** (Aligned ports to 8080 for Docker compatibility, fixed redemption fulfillment, seeded global settings)
- [x] **Multi-language Support (i18n)** (Full App Support: Landing, Lounge, Booking, Dashboard)
- [ ] *WhatsApp Integration* (Deferred)

## 4. Testing & Reliability
- [x] Gamification Unit Tests (Vitest)
- [x] E2E Testing (Playwright)

## 6. Pending Linting Cleanup
- [x] `src/components/atelier/BookingsManager.tsx`: Resolve `react-hooks/exhaustive-deps` warning.
- [x] `src/components/atelier/LoyaltyConfigurator.tsx`: Resolve `react-hooks/exhaustive-deps` warning.
- [x] `src/components/landing/LandingPage.tsx`: Re-enable `no-unnecessary-condition` rule (currently disabled globally for this file).
- [x] `src/context/AuthContext.tsx`: Resolve `react-refresh/only-export-components` by refactoring exports.

---
*Last Updated: May 19, 2026*
