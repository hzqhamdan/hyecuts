import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';

const LandingPage = lazy(() => import('./LandingPage'));
const MemberLounge = lazy(() => import('./MemberLounge'));
const AtelierDashboard = lazy(() => import('./AtelierDashboard'));
const LoginScreen = lazy(() => import('./LoginScreen'));
const OAuth2Callback = lazy(() => import('./pages/OAuth2Callback'));
const BookingFlow = lazy(() => import('./components/booking/BookingFlow'));
const UserBookings = lazy(() => import('./components/booking/UserBookings'));
const BookingsManager = lazy(() => import('./components/atelier/BookingsManager').then(m => ({ default: m.BookingsManager })));
const MemberManager = lazy(() => import('./components/atelier/MemberManager').then(m => ({ default: m.MemberManager })));
const StaffManager = lazy(() => import('./components/atelier/StaffManager').then(m => ({ default: m.StaffManager })));
const ReviewQueue = lazy(() => import('./components/atelier/ReviewQueue').then(m => ({ default: m.ReviewQueue })));
const LoyaltyConfigurator = lazy(() => import('./components/atelier/LoyaltyConfigurator').then(m => ({ default: m.LoyaltyConfigurator })));
const OverviewView = lazy(() => import('./components/atelier/OverviewView').then(m => ({ default: m.OverviewView })));

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
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
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
            <Route path="bookings" element={<BookingsManager />} />
            <Route path="members" element={<MemberManager />} />
            <Route path="staff" element={<StaffManager />} />
            <Route path="reviews" element={<ReviewQueue />} />
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
