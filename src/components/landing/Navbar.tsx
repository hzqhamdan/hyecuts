import { motion } from 'framer-motion';
import { Globe, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { navTap, navTapTransition } from '../../utils/animations';

interface NavbarProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  token: string | null;
  onToggleLanguage: () => void;
  i18nLang: string;
}

export default function Navbar({ isMenuOpen, onToggleMenu, token, onToggleLanguage, i18nLang }: NavbarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center backdrop-blur-md bg-white/80 dark:bg-[#1A1A1A]/80 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          navigate('/');
        }}
        className="font-serif text-xl tracking-tighter uppercase font-light italic hover:opacity-70 transition-opacity focus:outline-none"
      >
        Hyecuts
      </motion.button>

      <div className="hidden md:flex gap-10 text-[10px] uppercase tracking-widest font-medium items-center">
        {['services', 'hours', 'contact'].map((item) => (
          <motion.a
            key={item}
            href={`#${item}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(item)?.scrollIntoView({ behavior: 'smooth' });
            }}
            whileTap={navTap}
            transition={navTapTransition}
            className="hover:text-zinc-400 dark:hover:text-zinc-500 transition-colors duration-300"
          >
            {t(`nav.${item}`)}
          </motion.a>
        ))}
        {!token && (
          <motion.button
            onClick={() => { navigate('/lounge'); }}
            whileTap={navTap}
            transition={navTapTransition}
            className="hover:text-zinc-400 dark:hover:text-zinc-500 transition-colors duration-300 uppercase"
          >
            {t('nav.login')}
          </motion.button>
        )}
        <motion.button
          onClick={onToggleLanguage}
          whileTap={navTap}
          transition={navTapTransition}
          className="flex items-center gap-2 hover:text-zinc-400 dark:hover:text-zinc-500 transition-colors duration-300 uppercase border-l border-zinc-200 dark:border-zinc-800 pl-10"
        >
          {i18nLang === 'en' ? <Globe size={12} /> : <img src="/flags/my.svg" alt="Malaysia" className="w-4 h-3 rounded-sm" />}
          {i18nLang === 'en' ? 'EN' : 'MY'}
        </motion.button>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          onClick={() => { navigate('/booking'); }}
          whileTap={navTap}
          transition={navTapTransition}
          className="hidden md:block px-6 py-2 text-[10px] uppercase tracking-widest border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-500 font-bold active:scale-95"
        >
          {t('nav.book')}
        </motion.button>
        <motion.button 
          className="md:hidden active:scale-90 transition-transform duration-200" 
          onClick={onToggleMenu}
          whileTap={navTap}
          transition={navTapTransition}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>
    </nav>
  );
}
