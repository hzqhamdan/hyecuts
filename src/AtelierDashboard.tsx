import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
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

// Tab Views
import { BookingsManager } from './components/atelier/BookingsManager';
import { LoyaltyConfigurator } from './components/atelier/LoyaltyConfigurator';
import { OverviewView } from './components/atelier/OverviewView';
import { MemberManager } from './components/atelier/MemberManager';
import { StaffManager } from './components/atelier/StaffManager';
import { ReviewQueue } from './components/atelier/ReviewQueue';

type View = 'booking-manager' | 'member-manager' | 'staff-manager' | 'loyalty-configurator' | 'analytics' | 'reviews';

interface AtelierDashboardProps {
  setView?: (view: string) => void;
}

export default function AtelierDashboard({ setView }: AtelierDashboardProps) {
  const { t, i18n } = useTranslation();
  const { logout, token, user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('booking-manager');

  const handleNav = (view: View) => {
    setCurrentView(view);
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  console.log("Dashboard user role:", user?.role);

  const isOwner = user?.role === 'ROLE_ADMIN' || user?.role === 'owner';
  const isMasterBarber = user?.role === 'master_barber' || isOwner;
  const isStaff = user?.role === 'junior' || isMasterBarber;

  console.log("Role checks - isOwner:", isOwner, "isMasterBarber:", isMasterBarber, "isStaff:", isStaff);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] font-sans selection:bg-black selection:text-white transition-colors duration-500">
      {/* THE ATELIER SIDEBAR */}
      <aside className="w-full md:w-72 border-b md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col h-auto md:h-screen sticky top-0 bg-white dark:bg-[#1A1A1A] z-20 transition-colors">
        <div className="p-10 mb-8">
          <h1 className="font-serif text-3xl tracking-tighter font-light uppercase italic">
            Hyecuts <span className="font-sans text-[10px] not-italic tracking-[0.3em] block text-zinc-400 dark:text-zinc-500 uppercase mt-1">{t('atelier.title')}</span>
          </h1>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible px-6 space-y-0 md:space-y-2">
          {isStaff && (
            <NavItem
              active={currentView === 'booking-manager'}
              onClick={() => { handleNav('booking-manager'); }}
              icon={<CalendarDays size={18} />}
              label={t('atelier.nav.booking_manager')}
            />
          )}
          {isStaff && (
            <NavItem
              active={currentView === 'member-manager'}
              onClick={() => { handleNav('member-manager'); }}
              icon={<Users size={18} />}
              label={t('atelier.nav.member_manager')}
            />
          )}
          {isMasterBarber && (
            <NavItem
              active={currentView === 'staff-manager'}
              onClick={() => { handleNav('staff-manager'); }}
              icon={<Shield size={18} />}
              label={t('atelier.nav.staff_manager', { defaultValue: 'Staff Roster' })}
            />
          )}
          {isMasterBarber && (
            <NavItem
              active={currentView === 'reviews'}
              onClick={() => { handleNav('reviews'); }}
              icon={<MessageSquareQuote size={18} />}
              label={t('atelier.nav.reviews', { defaultValue: 'Review Queue' })}
            />
          )}
          {isOwner && (
            <NavItem
              active={currentView === 'loyalty-configurator'}
              onClick={() => { handleNav('loyalty-configurator'); }}
              icon={<SlidersHorizontal size={18} />}
              label={t('atelier.nav.loyalty_config')}
            />
          )}
          {isOwner && (
            <NavItem
              active={currentView === 'analytics'}
              onClick={() => { handleNav('analytics'); }}
              icon={<BarChart3 size={18} />}
              label={t('atelier.nav.analytics')}
            />
          )}
        </nav>

        <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                const newLang = i18n.language === 'en' ? 'ms' : 'en';
                void i18n.changeLanguage(newLang);
              }}
              className="flex items-center gap-4 p-4 rounded-none bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
            >
              {i18n.language === 'en' ? <Globe size={14} className="text-zinc-400 dark:text-zinc-500" /> : <img src="/flags/my.svg" alt="Malaysia" className="w-4 h-3 rounded-sm" />}
              <div className="flex justify-between items-center w-full">
                <span>{i18n.language === 'en' ? 'English' : 'Bahasa Malaysia'}</span>
                <span className="text-zinc-300 dark:text-zinc-600 ml-auto">{i18n.language === 'en' ? 'EN' : 'MY'}</span>
              </div>
            </button>
            <div className="flex items-center gap-4 p-4 rounded-none bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <div className="w-1 h-1 bg-[#B8A070] rounded-full absolute -top-1 -right-1 border border-white dark:border-black" />
                <ShieldCheck size={14} className="text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="text-[10px] uppercase tracking-widest">
                <p className="font-bold text-black dark:text-white">{t('atelier.session_active')}</p>
                <p className="text-zinc-400 dark:text-zinc-500">
                  {user?.role === 'owner' ? t('atelier.owner_access') : user?.role?.replace('_', ' ') || 'Staff Access'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                if (setView) setView('facade');
              }}
              className="w-full py-3 border border-black dark:border-white text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-center"
            >
              {t('atelier.sign_out_exit')}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-6 md:px-12 py-12 md:py-16 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={springTransition}
            className="max-w-6xl mx-auto"
          >
              {currentView === 'booking-manager' && isStaff && <BookingsManager token={token ?? ''} />}
              {currentView === 'member-manager' && isStaff && <MemberManager token={token ?? ''} />}
              {currentView === 'staff-manager' && isMasterBarber && <StaffManager token={token ?? ''} />}
              {currentView === 'reviews' && isMasterBarber && <ReviewQueue token={token ?? ''} />}
              {currentView === 'loyalty-configurator' && isOwner && <LoyaltyConfigurator />}
              {currentView === 'analytics' && isOwner && <OverviewView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
        active
        ? 'bg-black dark:bg-white text-white dark:text-black'
        : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`transition-colors ${active ? 'text-white dark:text-black' : 'group-hover:text-black dark:group-hover:text-white'}`}>{icon}</span>
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      {active && <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-white dark:bg-black rounded-full" />}
    </button>
  );
}
