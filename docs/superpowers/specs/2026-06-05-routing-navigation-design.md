# Routing & Navigation — Phase 3 Design

## Problem

The app uses a custom `useState<ViewState>` in `App.tsx` persisted to `sessionStorage` for view management. No URL bookmarks, no browser back/forward, no deep-linking. The `setView` callback is prop-drilled to every component. AtelierDashboard duplicates this pattern with its own `useState<View>` for admin sub-views.

## Approach

React Router v7 (depended transitively via React 19) with flat top-level routes and nested routes under `/admin`.

## Route Map

| Path | Component | Navigation Key | Guard |
|---|---|---|---|
| `/` | `LandingPage` | — | public |
| `/login` | `LoginScreen` | — | public |
| `/booking` | `BookingFlow` | — | public |
| `/my-bookings` | `UserBookings` | — | auth |
| `/lounge` | `MemberLounge` | — | auth |
| `/admin` | redirect → `/admin/bookings` | — | admin |
| `/admin/bookings` | `BookingsManager` | booking-manager | staff+ |
| `/admin/members` | `MemberManager` | member-manager | staff+ |
| `/admin/staff` | `StaffManager` | staff-manager | master barber+ |
| `/admin/reviews` | `ReviewQueue` | reviews | master barber+ |
| `/admin/loyalty` | `LoyaltyConfigurator` | loyalty-configurator | owner |
| `/admin/analytics` | `OverviewView` | analytics | owner |

Nested routes under `/admin` render inside `AtelierDashboard` via `<Outlet />`.

## Changes

### App.tsx

- Remove `ViewState` type, `useState`, `sessionStorage` read/write, `handleSetView`, auto-redirect `useEffect`
- Wrap in `<BrowserRouter>`
- Define routes with `<Routes>` + `<Route>`
- Auth-guarded routes use `<ProtectedRoute>` wrapper component: checks `token` from `AuthContext`, redirects to `/login` if missing
- Admin routes use `<AdminRoute>` wrapper: additionally checks `role === 'ROLE_ADMIN'`, redirects to `/lounge`
- Keep `<Suspense>` + lazy loading + `<AnimatePresence>` — page transition keyed by `useLocation().key`

### AtelierDashboard.tsx

- Remove `currentView: useState<View>`, `handleNav`, role-conditional rendering in content area
- Sidebar buttons become `<NavLink to="/admin/...">` with role-based visibility (unchanged logic)
- Main content area becomes `<Outlet />`
- The role guards that were in the content area move to the `<Route>` definitions in `App.tsx`

### All Components Receiving `setView` Prop

Every component currently receives `setView` and calls it with a view name. Replace with `useNavigate()` from React Router:

| File | Current Call | Replacement |
|---|---|---|
| `LandingPage.tsx` | `setView('booking')`, `setView('lounge')`, `setView('login')` | `navigate('/booking')`, `navigate('/lounge')`, `navigate('/login')` |
| `LoginScreen.tsx` | `setView('lounge')`, `setView('atelier')` | `navigate('/lounge')`, `navigate('/admin')` |
| `MemberLounge.tsx` | `setView('booking')`, `setView('my-bookings')`, `setView('facade')` | `navigate('/booking')`, `navigate('/my-bookings')`, `navigate('/')` |
| `BookingFlow.tsx` | `setView('facade')`, `setView('lounge')` | `navigate('/')`, `navigate('/lounge')` |
| `UserBookings.tsx` | `setView('booking')`, `setView('facade')` | `navigate('/booking')`, `navigate('/')` |
| `PaymentStep.tsx` | `setView('my-bookings')`, `setView('facade')` | `navigate('/my-bookings')`, `navigate('/')` |
| `UserProfileModal.tsx` | (setView for navigation from modals) | `navigate(...)` |
| `FulfillmentHistory.tsx` | `setView('facade')` | `navigate('/')` |
| `OverviewView.tsx` | `setView('facade')` | `navigate('/')` |
| `EconomyControlCenter.tsx` | `setView('facade')` | `navigate('/')` |
| `RewardsInventory.tsx` | `setView('facade')` | `navigate('/')` |
| `BookingsManager.tsx` | `setView('facade')` | `navigate('/')` |
| `MemberManager.tsx` | `setView('facade')` | `navigate('/')` |
| `LoyaltyConfigurator.tsx` | `setView('facade')` | `navigate('/')` |

### AuthProvider.tsx

- On logout, call `navigate('/')` to return to landing page

## Not Changing

- AuthContext, Zustand booking store, TanStack Query, i18n, API client
- Framer-motion page transitions (same `<AnimatePresence>` pattern, just keyed on location)
- BookingFlow step state (remains in Zustand, no URL encoding — unnecessary complexity)
- AnimatePresence exit animations on admin sub-views (AtelierDashboard still uses framer-motion for sub-view transitions via NavLink active state)

## Verification

- `tsc --noEmit` passes
- `npx eslint src/` shows no new errors
- `npx vitest run` passes (existing tests unaffected)
