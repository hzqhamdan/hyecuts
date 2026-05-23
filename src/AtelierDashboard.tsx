import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Users,
  SlidersHorizontal,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

// Tab Views
import { BookingsManager } from './components/atelier/BookingsManager';
import { LoyaltyConfigurator } from './components/atelier/LoyaltyConfigurator';
import { OverviewView } from './components/atelier/OverviewView';

type View = 'booking-manager' | 'member-manager' | 'loyalty-configurator' | 'analytics';

interface AtelierDashboardProps {
  setView?: (view: string) => void;
}

export default function AtelierDashboard({ setView }: AtelierDashboardProps) {
  const { t } = useTranslation();
  const { logout, token } = useAuth();
  const [currentView, setCurrentView] = useState<View>('booking-manager');

  const handleNav = (view: View) => {
    setCurrentView(view);
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* THE ATELIER SIDEBAR */}
      <aside className="w-full md:w-72 border-b md:border-r border-zinc-100 flex flex-col h-auto md:h-screen sticky top-0 bg-white z-20">
        <div className="p-10 mb-8">
          <h1 className="font-serif text-3xl tracking-tighter font-light uppercase italic">
            Hyecuts <span className="font-sans text-[10px] not-italic tracking-[0.3em] block text-zinc-400 uppercase mt-1">{t('atelier.title')}</span>
          </h1>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible px-6 space-y-0 md:space-y-2">
          <NavItem
            active={currentView === 'booking-manager'}
            onClick={() => { handleNav('booking-manager'); }}
            icon={<CalendarDays size={18} />}
            label={t('atelier.nav.booking_manager')}
          />
          <NavItem
            active={currentView === 'member-manager'}
            onClick={() => { handleNav('member-manager'); }}
            icon={<Users size={18} />}
            label={t('atelier.nav.member_manager')}
          />
          <NavItem
            active={currentView === 'loyalty-configurator'}
            onClick={() => { handleNav('loyalty-configurator'); }}
            icon={<SlidersHorizontal size={18} />}
            label={t('atelier.nav.loyalty_config')}
          />
          <NavItem
            active={currentView === 'analytics'}
            onClick={() => { handleNav('analytics'); }}
            icon={<BarChart3 size={18} />}
            label={t('atelier.nav.analytics')}
          />
        </nav>

        <div className="p-8 border-t border-zinc-100 mt-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 rounded-none bg-zinc-50/50 border border-zinc-100">
              <div className="relative">
                <div className="w-1 h-1 bg-[#B8A070] rounded-full absolute -top-1 -right-1 border border-white" />
                <ShieldCheck size={14} className="text-zinc-400" />
              </div>
              <div className="text-[10px] uppercase tracking-widest">
                <p className="font-bold text-black">{t('atelier.session_active')}</p>
                <p className="text-zinc-400">{t('atelier.owner_access')}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                if (setView) setView('facade');
              }}
              className="w-full py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all text-center"
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
            {currentView === 'booking-manager' && <BookingsManager token={token ?? ''} />}
            {currentView === 'member-manager' && <div className="p-10 border border-zinc-200"><h2 className="font-serif text-3xl">{t('atelier.nav.member_manager')}</h2><p className="text-zinc-400 mt-4">Module under construction.</p></div>}
            {currentView === 'loyalty-configurator' && <LoyaltyConfigurator />}
            {currentView === 'analytics' && <OverviewView />}
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
        ? 'bg-black text-white'
        : 'text-zinc-400 hover:text-black hover:bg-zinc-50'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`transition-colors ${active ? 'text-white' : 'group-hover:text-black'}`}>{icon}</span>
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      {active && <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-white rounded-full" />}
    </button>
  );
}
