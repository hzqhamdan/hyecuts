# Routing & Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace custom `useState`/`sessionStorage` view management with React Router v7 for URL-based routing, deep-linking, and browser nav support.

**Architecture:** `<BrowserRouter>` wraps `<Routes>` in App.tsx. Six top-level routes + six nested admin routes under `/admin` rendered inside `AtelierDashboard` via `<Outlet />`. Auth guards via `<ProtectedRoute>` and `<AdminRoute>` wrapper components. All `setView` prop calls replaced with `useNavigate()`.

**Tech Stack:** React 19 + react-router-dom 7, existing framer-motion for transitions (now keyed on `useLocation().key`)

---

### Task 1: Install react-router-dom

- [ ] **Install the package**

Run:
```bash
cd C:\Users\nurha\hyecuts
npm install react-router-dom
```

Expected: adds to `package.json` under `dependencies`.

---

### Task 2: Create route guard components

**Files:**
- Create: `src/components/guards/ProtectedRoute.tsx`
- Create: `src/components/guards/AdminRoute.tsx`

- [ ] **Create ProtectedRoute.tsx**

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Create AdminRoute.tsx**

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'ROLE_ADMIN') return <Navigate to="/lounge" replace />;
  return <>{children}</>;
}
```

---

### Task 3: Rewrite App.tsx — replace custom routing with React Router

**Files:**
- Modify: `src/App.tsx`

- [ ] **Replace App.tsx content**

Remove: `ViewState` type, `useState/useEffect` for view management, `sessionStorage` read/write, `handleSetView`, auto-redirect `useEffect`, conditional rendering block.

Replace with `<BrowserRouter>`, `<Routes>`, `<Route>` definitions, and keep `<Suspense>` + `<AnimatePresence>` for page transitions (keyed on `locationKey`).

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';

const LandingPage = lazy(() => import('./components/landing/LandingPage'));
const MemberLounge = lazy(() => import('./MemberLounge'));
const AtelierDashboard = lazy(() => import('./AtelierDashboard'));
const LoginScreen = lazy(() => import('./LoginScreen'));
const BookingFlow = lazy(() => import('./components/booking/BookingFlow'));
const UserBookings = lazy(() => import('./components/booking/UserBookings'));

const THEME_STORAGE_KEY = 'hyecuts-theme-v2';

const LoadingView = () => (
  <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center z-[100]">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-serif text-2xl italic tracking-tighter uppercase"
    >
      Hyecuts
    </motion.div>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingView />}>
        <Routes location={location} key={location.key}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/booking" element={<BookingFlow />} />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <UserBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lounge"
            element={
              <ProtectedRoute>
                <MemberLounge />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AtelierDashboard />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/bookings" replace />} />
            <Route path="bookings" element={<BookingsManager token="" />} />
            <Route path="members" element={<MemberManager token="" />} />
            <Route path="staff" element={<StaffManager token="" />} />
            <Route path="reviews" element={<ReviewQueue token="" />} />
            <Route path="loyalty" element={<LoyaltyConfigurator />} />
            <Route path="analytics" element={<OverviewView />} />
          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <motion.button
        type="button"
        onClick={() => { setIsDarkMode((prev) => !prev); }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60] inline-flex h-10 sm:h-12 items-center justify-center gap-2 sm:gap-3 rounded-full border border-zinc-200 bg-white px-4 sm:px-5 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-black shadow-lg backdrop-blur transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isDarkMode ? 'dark' : 'light'}
            initial={{ y: -10, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 10, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-2"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            <span className="hidden xs:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </motion.div>
        </AnimatePresence>
      </motion.button>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
```

Wait — the nested routes in the `/admin` layout need access to `token`. The current design passes `token={token ?? ''}` to each sub-component. Since `AtelierDashboard` uses `<Outlet />`, the sub-components need to get `token` from `AuthContext` themselves rather than receiving it as a prop from the parent.

This means all admin sub-components (`BookingsManager`, `MemberManager`, `StaffManager`, `ReviewQueue`) need to use `useAuth()` directly instead of the `token` prop.

Update the approach: sub-components that currently receive `token` as a prop will instead call `const { token } = useAuth()` directly.

- [ ] **Update App.tsx** with the React Router implementation above, BUT:

The nested routes for `/admin` must handle the `token` change. Instead of passing `token=""`, the admin sub-components will read `token` from `AuthContext` internally.

So the nested route content is:

```tsx
<Route path="/admin" element={<AdminRoute><AtelierDashboard /></AdminRoute>}>
  <Route index element={<Navigate to="/admin/bookings" replace />} />
  <Route path="bookings" element={<BookingsManager />} />
  <Route path="members" element={<MemberManager />} />
  <Route path="staff" element={<StaffManager />} />
  <Route path="reviews" element={<ReviewQueue />} />
  <Route path="loyalty" element={<LoyaltyConfigurator />} />
  <Route path="analytics" element={<OverviewView />} />
</Route>
```

Also add required imports at the top of App.tsx:
```tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
```

And the lazy imports for admin sub-components:
```tsx
const BookingsManager = lazy(() => import('./components/atelier/BookingsManager'));
const MemberManager = lazy(() => import('./components/atelier/MemberManager'));
const StaffManager = lazy(() => import('./components/atelier/StaffManager'));
const ReviewQueue = lazy(() => import('./components/atelier/ReviewQueue'));
const LoyaltyConfigurator = lazy(() => import('./components/atelier/LoyaltyConfigurator'));
const OverviewView = lazy(() => import('./components/atelier/OverviewView'));
```

- [ ] **Remove unused imports** from App.tsx: remove `useAuth`, `motion` (only needed if used elsewhere), and old imports.

Actually `motion` is still used by `LoadingView` and the dark mode toggle button, so keep it.

Final verification: App.tsx should have no references to `view`, `setView`, `handleSetView`, `ViewState`, or `sessionStorage` for routing purposes.

---

### Task 4: Update admin sub-components — replace token prop with useAuth

**Files:**
- Modify: `src/components/atelier/BookingsManager.tsx`
- Modify: `src/components/atelier/MemberManager.tsx`
- Modify: `src/components/atelier/StaffManager.tsx`
- Modify: `src/components/atelier/ReviewQueue.tsx`

Each of these currently receives `token: string` as a prop and uses it for API calls. Since they'll now be rendered as child routes via `<Outlet />` (no more prop passing from AtelierDashboard), they need to read the token from AuthContext directly.

- [ ] **Update each file** — replace the `token` prop with `useAuth()`:

For each file (BookingsManager, MemberManager, StaffManager, ReviewQueue):

1. Remove `token` from the component's props interface
2. Add import: `import { useAuth } from '../../context/AuthContext';`
3. Inside the component body, add: `const { token } = useAuth();`
4. Remove the `{ token: string }` from `export function` signature
5. Keep the existing `const safeToken = token ?? '';` pattern (these files already have this guard)

---

### Task 5: Update AtelierDashboard — replace setView/currentView with NavLink + Outlet

**Files:**
- Modify: `src/AtelierDashboard.tsx`

- [ ] **Rewrite AtelierDashboard**

Remove: `useState` import (no longer needed for `currentView`), `AnimatePresence` import, `currentView` state, `handleNav`, `View` type, conditional rendering block (lines 179-195), sub-view imports (`BookingsManager` through `ReviewQueue`), `AtelierDashboardProps` interface, `setView` prop.

Add: `import { useNavigate, Outlet, useLocation } from 'react-router-dom';`

The sidebar buttons change from `onClick={() => { handleNav('booking-manager'); }}` to `<NavLink to="/admin/bookings">`.

The header "back to facade" button changes from `setView('facade')` to `navigate('/')`.

The logout buttons change from `setView('facade')` to `navigate('/')`.

The main content area changes from the conditional rendering block to just `<Outlet />`.

Replace `key={currentView}` with `<motion.div key={location.pathname}>` for the animation, using `useLocation()`.

```tsx
import { motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, Outlet, useLocation, NavLink } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  SlidersHorizontal,
  BarChart3,
  ShieldCheck,
  Globe,
  MessageSquareQuote,
  Shield
} from 'lucide-react';

export default function AtelierDashboard() {
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  const isOwner = user?.role === 'ROLE_ADMIN' || user?.role === 'owner';
  const isMasterBarber = user?.role === 'master_barber' || isOwner;
  const isStaff = user?.role === 'junior' || isMasterBarber;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] font-sans selection:bg-black selection:text-white transition-colors duration-500">
      <aside className="w-full md:w-72 border-b md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col h-auto md:h-screen md:sticky top-0 bg-white dark:bg-[#1A1A1A] z-20 transition-colors">
        <div className="p-6 sm:p-10 mb-2 md:mb-8">
          <button
            onClick={() => { navigate('/'); }}
            className="text-left hover:opacity-70 transition-opacity focus:outline-none group"
          >
            <h1 className="font-serif text-2xl sm:text-3xl tracking-tighter font-light uppercase italic group-hover:tracking-normal transition-all duration-500">
              Hyecuts <span className="font-sans text-[9px] sm:text-[10px] not-italic tracking-[0.3em] block text-zinc-400 dark:text-zinc-500 uppercase mt-1 font-bold">{t('atelier.title')}</span>
            </h1>
          </button>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible px-4 md:px-6 space-y-0 md:space-y-2 pb-4 md:pb-0 scrollbar-hide">
          {isStaff && (
            <NavLink
              to="/admin/bookings"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <CalendarDays size={18} />
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{t('atelier.nav.booking_manager')}</span>
                  </div>
                  {isActive && <motion.div layoutId="nav-indicator" className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full ml-3 md:ml-0" />}
                </>
              )}
            </NavLink>
          )}
          {/* Repeat pattern for other nav items... */}
        </nav>

        <div className="hidden md:flex flex-col p-8 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
          {/* ... existing language toggle, session info, logout button ... */}
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full py-3 border border-black dark:border-white text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-center"
          >
            {t('atelier.sign_out_exit')}
          </button>
        </div>

        {/* Mobile footer */}
        <div className="md:hidden flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <button
            onClick={() => {
              const newLang = i18n.language === 'en' ? 'ms' : 'en';
              void i18n.changeLanguage(newLang);
            }}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold"
          >
            {i18n.language === 'en' ? 'EN' : 'MY'}
          </button>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-400 font-bold">
            <ShieldCheck size={12} /> {user?.role === 'owner' ? 'Owner' : 'Staff'}
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="text-[10px] uppercase tracking-widest text-red-500 font-bold"
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-12 py-8 md:py-16 relative">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={springTransition}
          className="max-w-6xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
```

- [ ] **Remove unused imports** — `useState`, `AnimatePresence`, sub-view imports (`BookingsManager` through `ReviewQueue`), `AtelierDashboardProps`, `setView` prop

---

### Task 6: Update LoginScreen — setView → navigate

**Files:**
- Modify: `src/LoginScreen.tsx`

- [ ] **Replace setView with useNavigate**

Remove `{ setView }` from the component props signature. Add `import { useNavigate } from 'react-router-dom';`. Add `const navigate = useNavigate();` inside the component.

Replace:
- `setView('atelier')` → `navigate('/admin')`
- `setView('lounge')` → `navigate('/lounge')`
- `setView('facade')` → `navigate('/')`

---

### Task 7: Update MemberLounge — setView → navigate

**Files:**
- Modify: `src/MemberLounge.tsx`

- [ ] **Replace setView with useNavigate**

Remove `{ setView }` from the component props signature. Add `import { useNavigate } from 'react-router-dom';`. Add `const navigate = useNavigate();`.

Replace all setView calls line by line (from the grep output):

| Line | Current | Replacement |
|---|---|---|
| 184 | `setView('facade')` | `navigate('/')` |
| 208 | `setView('booking')` | `navigate('/booking')` |
| 214 | `setView('my-bookings')` | `navigate('/my-bookings')` |
| 273 | `setView('facade')` | `navigate('/')` |
| 299 | `setView('booking')` | `navigate('/booking')` |
| 305 | `setView('my-bookings')` | `navigate('/my-bookings')` |
| 329 | `setView('facade')` | `navigate('/')` |
| 663 | `setView('facade')` | `navigate('/')` |

---

### Task 8: Update LandingPage — setView → navigate

**Files:**
- Modify: `src/components/landing/LandingPage.tsx`

- [ ] **Replace setView with useNavigate**

Remove `interface LandingPageProps { setView: ... }` and the `setView` prop destructuring. Add `import { useNavigate } from 'react-router-dom';`. Add `const navigate = useNavigate();`.

Replace all setView calls:

| Line | Current | Replacement |
|---|---|---|
| 61 | `setView('facade')` | `navigate('/')` |
| 86 | `setView('lounge')` | `navigate('/lounge')` |
| 107 | `setView('booking')` | `navigate('/booking')` |
| 151 | `setView('lounge')` | `navigate('/lounge')` |
| 174 | `setView('booking')` | `navigate('/booking')` |
| 199 | `setView('booking')` | `navigate('/booking')` |
| 206 | `setView('lounge')` | `navigate('/lounge')` |
| 291 | `setView('booking')` | `navigate('/booking')` |
| 342 | `setView('booking')` | `navigate('/booking')` |
| 411 | `setView('booking')` | `navigate('/booking')` |
| 425 | `setView('facade')` | `navigate('/')` |

---

### Task 9: Update BookingFlow — setView → navigate

**Files:**
- Modify: `src/components/booking/BookingFlow.tsx`

- [ ] **Replace setView with useNavigate**

Remove `{ setView }` from the component props. Add `import { useNavigate } from 'react-router-dom';`. Add `const navigate = useNavigate();`.

Replace:

| Line | Current | Replacement |
|---|---|---|
| 136 | `if (step === 0) setView('facade')` | `if (step === 0) navigate('/')` |
| 138 | `else if (step === 1 || step === 6) setView(token ? 'lounge' : 'facade')` | `else if (step === 1 || step === 6) navigate(token ? '/lounge' : '/')` |
| 191 | `onClick={() => { setView('login') }}` | `onClick={() => { navigate('/login') }}` |
| 461 | `onClick={() => { setView('my-bookings') }}` | `onClick={() => { navigate('/my-bookings') }}` |
| 468 | `onClick={() => { setView(token ? 'lounge' : 'facade') }}` | `onClick={() => { navigate(token ? '/lounge' : '/') }}` |

---

### Task 10: Update UserBookings — setView → navigate

**Files:**
- Modify: `src/components/booking/UserBookings.tsx`

- [ ] **Replace setView with useNavigate**

Remove `{ setView }` from the component props. Add `import { useNavigate } from 'react-router-dom';`. Add `const navigate = useNavigate();`.

Replace:

| Line | Current | Replacement |
|---|---|---|
| 39 | `setView('lounge')` | `navigate('/lounge')` |
| 60 | `setView('booking')` | `navigate('/booking')` |

---

### Task 11: Update AuthProvider — navigate on logout

**Files:**
- Modify: `src/context/AuthProvider.tsx`

- [ ] **Keep as-is, no changes needed**

The AuthProvider doesn't handle navigation (it's a pure auth state manager). The navigate-on-logout already happens in the components that call `logout()` + `setView('facade')`. Since those now call `navigate('/')`, no change needed in AuthProvider.

---

### Task 12: Clean up unused code

- [ ] **Remove orphaned setView from remaining files**

Ensure no file still references `setView` as a prop or function. Run:
```bash
rg "setView" --include "*.tsx" C:\Users\nurha\hyecuts\src
```
Expected: empty output (all setView references removed).

- [ ] **Clean up unused imports**

Check for unused imports introduced by the refactor (e.g., `useEffect` in App.tsx if no longer needed, etc.)

---

### Task 13: Verification

- [ ] **TypeScript check**

```bash
cd C:\Users\nurha\hyecuts
npx tsc --noEmit
```
Expected: no errors (or only pre-existing errors unrelated to routing).

- [ ] **ESLint check**

```bash
npx eslint src/ --max-warnings 50
```
Expected: no new errors.

- [ ] **Run tests**

```bash
npx vitest run
```
Expected: 12/12 passing.

- [ ] **Manual sanity check**

The app should:
- Load at `/` showing LandingPage
- Navigate to `/booking` when "Book Now" is clicked (URL changes)
- Navigate to `/login` from the return button
- Navigate to `/lounge` after login (URL changes)
- Navigate to `/admin/bookings` for admin users (URL changes)
- Browser back/forward works to navigate between views
- Direct URL access works: `/booking`, `/lounge`, `/login`
- Protected routes redirect to `/login` when unauthenticated
- `/admin` redirects to `/admin/bookings`
