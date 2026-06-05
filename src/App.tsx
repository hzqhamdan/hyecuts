import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

// Lazy load components
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

type ViewState = 'facade' | 'login' | 'booking' | 'my-bookings' | 'lounge' | 'admin';

function App() {
  const [view, setView] = useState<ViewState>(() => {
    const savedView = sessionStorage.getItem('hc_view');
    return (savedView as ViewState) || 'facade';
  });
  const { token, user } = useAuth();
  
  useEffect(() => {
    sessionStorage.setItem('hc_view', view);
  }, [view]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSetView = (newView: string) => {
    setView(newView as ViewState);
  };

  // Auto-route admin users if they land on lounge
  useEffect(() => {
    if (token && user?.role === 'ROLE_ADMIN' && view === 'lounge') {
      setView('admin');
    }
  }, [token, user, view]);

  return (
    <>
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

      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingView />}>
          {view === 'facade' ? (
            <LandingPage key="facade" setView={handleSetView} />
          ) : view === 'login' ? (
            <LoginScreen key="login" setView={handleSetView} />
          ) : view === 'booking' ? (
            <BookingFlow key="booking" setView={handleSetView} />
          ) : view === 'my-bookings' ? (
            token ? <UserBookings key="my-bookings" setView={handleSetView} /> : <LoginScreen key="login" setView={handleSetView} />
          ) : view === 'lounge' ? (
            token ? <MemberLounge key="lounge" setView={handleSetView} /> : <LoginScreen key="login" setView={handleSetView} />
          ) : (
            token ? <AtelierDashboard key="admin" setView={handleSetView} /> : <LoginScreen key="login" setView={handleSetView} />
          )}
        </Suspense>
      </AnimatePresence>
    </>
  );
}

export default App;
