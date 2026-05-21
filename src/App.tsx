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
  const [view, setView] = useState<ViewState>('facade');
  const { token } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') return true;
    
    // Default to light mode (false) if nothing is saved, ignoring OS preference per requirements
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSetView = (newView: string) => {
    setView(newView as ViewState);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => { setIsDarkMode((prev) => !prev); }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed bottom-8 right-8 z-[60] inline-flex h-12 items-center justify-center gap-3 rounded-full border border-luxury-slate/20 bg-luxury-white/90 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-black shadow-lg backdrop-blur transition-all hover:bg-luxury-slate/10 dark:border-luxury-slate/20 dark:bg-luxury-black/90 dark:text-luxury-white dark:hover:bg-luxury-slate/80"
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
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{isDarkMode ? 'Light' : 'Dark'}</span>
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
