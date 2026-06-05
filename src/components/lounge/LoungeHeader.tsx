import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bell, Globe, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  time: string;
}

interface LoungeHeaderProps {
  onLogout: () => void;
  onToggleLanguage: () => void;
  showNotifications: boolean;
  onToggleNotifications: () => void;
  onOpenSettings: () => void;
  unreadCount: number;
  notifications: Notification[];
  i18nLang: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

const LoungeHeader = ({ onLogout, onToggleLanguage, showNotifications, onToggleNotifications, onOpenSettings, unreadCount, notifications, i18nLang, isMenuOpen, onToggleMenu }: LoungeHeaderProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <nav className="max-w-7xl mx-auto mb-16 md:mb-24 flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
      <div className="flex justify-between items-center w-full md:w-auto">
        <button onClick={() => { navigate('/'); }}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> {t('nav.return_facade')}
        </button>
        
        <div className="md:hidden font-serif text-xl tracking-tighter uppercase font-medium italic">
          {t('lounge.title')}
        </div>

        <button 
          className="md:hidden p-2 text-zinc-500 dark:text-zinc-400 active:scale-90 transition-transform" 
          onClick={onToggleMenu}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="hidden md:block font-serif text-2xl tracking-tighter uppercase font-medium italic">
        {t('lounge.title')}
      </div>

      <div className="hidden md:flex flex-wrap items-center gap-x-6 gap-y-4 md:gap-8">
        <button
          onClick={() => { navigate('/booking'); }}
          className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
        >
          {t('nav.book')}
        </button>
        <button
          onClick={() => { navigate('/my-bookings'); }}
          className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
        >
          {t('nav.appointments')}
        </button>
        <button
          onClick={onOpenSettings}
          className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
        >
          {t('nav.profile')}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={onToggleNotifications}
            className="relative p-2 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#1A1A1A]"></span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-zinc-900/50">
                  <h4 className="font-serif text-sm uppercase tracking-widest">Notifications</h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[10px] uppercase tracking-widest text-zinc-500">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-4 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-neutral-50 dark:hover:bg-zinc-900/50 transition-colors ${!notif.isRead ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="text-xs font-bold uppercase tracking-widest">{notif.title}</h5>
                          <span className="text-[9px] text-zinc-500 uppercase">{notif.time}</span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onLogout}
          className="text-[10px] uppercase tracking-widest text-red-400 dark:text-red-500 hover:text-red-600 transition-colors font-bold"
        >
          {t('nav.logout')}
        </button>
        
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold border-l border-zinc-200 dark:border-zinc-800 pl-6 ml-auto md:ml-0"
        >
          {i18nLang === 'en' ? <Globe size={12} /> : <img src="/flags/my.svg" alt="Malaysia" className="w-4 h-3 rounded-sm" />}
          {i18nLang === 'en' ? 'EN' : 'MY'}
        </button>
      </div>
    </nav>
  );
};

export default LoungeHeader;
