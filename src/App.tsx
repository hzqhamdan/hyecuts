import { useEffect, useState } from 'react';
import LandingPage from './components/landing/LandingPage';
import MemberLounge from './MemberLounge';
import AtelierDashboard from './AtelierDashboard';
import LoginScreen from './LoginScreen';
import { useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

const THEME_STORAGE_KEY = 'hyecuts-theme-v2';

function App() {
  const [view, setView] = useState<string>('facade');
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

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsDarkMode((prev) => !prev)}
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
        {view === 'facade' ? (
          <LandingPage key="facade" setView={setView as any} />
        ) : view === 'login' ? (
          <LoginScreen key="login" setView={setView as any} />
        ) : view === 'lounge' ? (
          token ? <MemberLounge key="lounge" setView={setView as any} /> : <LoginScreen key="login" setView={setView as any} />
        ) : (
          token ? <AtelierDashboard key="admin" setView={setView as any} /> : <LoginScreen key="login" setView={setView as any} />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
