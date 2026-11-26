import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggleLanguage: () => void;
  onOpenSettings: () => void;
  i18nLang: string;
}

const MobileMenu = ({ isOpen, onClose, onLogout, onToggleLanguage, onOpenSettings, i18nLang }: MobileMenuProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-40 bg-surface-card pt-32 px-10 flex flex-col gap-8 text-center md:hidden transition-colors"
        >
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="absolute top-6 right-6 p-2 text-ink-muted active:scale-90 transition-transform"
          >
            <X size={28} />
          </button>
          <button
            onClick={() => { onClose(); void navigate('/booking'); }}
            className="text-4xl font-serif italic tracking-tight capitalize"
          >
            {t('nav.book')}
          </button>
          <button
            onClick={() => { onClose(); void navigate('/my-bookings'); }}
            className="text-4xl font-serif italic tracking-tight capitalize"
          >
            {t('nav.appointments')}
          </button>
          <button
            onClick={() => { onClose(); onOpenSettings(); }}
            className="text-4xl font-serif italic tracking-tight capitalize"
          >
            {t('nav.profile')}
          </button>
          <button
            onClick={() => {
              onClose();
              onToggleLanguage();
            }}
            className="text-4xl font-serif italic tracking-tight capitalize"
          >
            {i18nLang === 'en' ? 'Bahasa Malaysia' : 'English'}
          </button>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="mt-4 text-2xl font-serif italic tracking-tight capitalize text-danger"
          >
            {t('nav.logout')}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
