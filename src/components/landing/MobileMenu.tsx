import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { navTap, navTapTransition } from '../../utils/animations';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onToggleLanguage: () => void;
  i18nLang: string;
}

export default function MobileMenu({ isOpen, onClose, token, onToggleLanguage, i18nLang }: MobileMenuProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-40 bg-white dark:bg-[#1A1A1A] pt-24 px-10 flex flex-col gap-8 text-center"
    >
      {['services', 'hours', 'contact'].map((item) => (
        <motion.a
          key={item}
          href={`#${item}`}
          className="text-4xl font-serif italic tracking-tight capitalize"
          onClick={(e) => {
            e.preventDefault();
            onClose();
            document.getElementById(item)?.scrollIntoView({ behavior: 'smooth' });
          }}
          whileTap={navTap}
          transition={navTapTransition}
        >
          {t(`nav.${item}`)}
        </motion.a>
      ))}
      {!token && (
        <motion.button
          onClick={() => {
            onClose();
            navigate('/lounge');
          }}
          whileTap={navTap}
          transition={navTapTransition}
          className="text-4xl font-serif italic tracking-tight capitalize"
        >
          {t('nav.login')}
        </motion.button>
      )}
      <motion.button
        onClick={() => {
          onClose();
          onToggleLanguage();
        }}
        whileTap={navTap}
        transition={navTapTransition}
        className="text-4xl font-serif italic tracking-tight capitalize"
      >
        {i18nLang === 'en' ? 'Bahasa Malaysia' : 'English'}
      </motion.button>
      <motion.button
        onClick={() => {
          onClose();
          navigate('/booking');
        }}
        whileTap={navTap}
        transition={navTapTransition}
        className="mt-4 px-8 py-4 bg-black dark:bg-white text-white dark:text-black uppercase tracking-widest text-xs font-bold"
      >
        {t('nav.book')}
      </motion.button>
    </motion.div>
  );
}
