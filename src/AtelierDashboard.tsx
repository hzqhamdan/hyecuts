import { motion } from 'framer-motion';
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
import { useNavigate, Outlet, useLocation, NavLink } from 'react-router-dom';

export default function AtelierDashboard() {
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  const isOwner = user?.role === 'ROLE_ADMIN' || user?.role === 'owner';
  const isMasterBarber = user?.role === 'master_barber' || isOwner;
  const isStaff = user?.role === 'junior' || isMasterBarber;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] font-sans selection:bg-black selection:text-white transition-colors duration-500">
      {/* THE ATELIER SIDEBAR */}
      <aside className="w-full md:w-72 border-b md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col h-auto md:h-screen md:sticky top-0 bg-white dark:bg-[#1A1A1A] z-20 transition-colors">
        <div className="p-6 sm:p-10 mb-2 md:mb-8">
          <button 
            onClick={() => { navigate('/'); }}
            className="text-left hover:opacity-70 transition-opacity focus:outline-none group"
          >
            <h1 className="font-serif text-2xl sm:text-3xl tracking-tighter font-light uppercase italic group-hover:tracking-normal transition-all duration-500">
              Hyecuts <span className="font-sans text-[9px] sm:text-[10px] not-italic tracking-[0.3em] block text-zinc-400 dark:text-zinc-500 uppercase mt-1 font-bold">{t('atelier.title')}</span>
            </h1>
          </button>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible px-4 md:px-6 space-y-0 md:space-y-2 pb-4 md:pb-0 scrollbar-hide">
          {isStaff && (
            <NavLink
              to="/admin/bookings"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <CalendarDays size={18} />
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{t('atelier.nav.booking_manager')}</span>
                  </div>
                  {isActive && <motion.div layoutId="nav-indicator" className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full ml-3 md:ml-0" />}
                </>
              )}
            </NavLink>
          )}
          {isStaff && (
            <NavLink
              to="/admin/members"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Users size={18} />
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{t('atelier.nav.member_manager')}</span>
                  </div>
                  {isActive && <motion.div layoutId="nav-indicator" className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full ml-3 md:ml-0" />}
                </>
              )}
            </NavLink>
          )}
          {isMasterBarber && (
            <NavLink
              to="/admin/staff"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Shield size={18} />
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{t('atelier.nav.staff_manager', { defaultValue: 'Staff Roster' })}</span>
                  </div>
                  {isActive && <motion.div layoutId="nav-indicator" className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full ml-3 md:ml-0" />}
                </>
              )}
            </NavLink>
          )}
          {isMasterBarber && (
            <NavLink
              to="/admin/reviews"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <MessageSquareQuote size={18} />
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{t('atelier.nav.reviews', { defaultValue: 'Review Queue' })}</span>
                  </div>
                  {isActive && <motion.div layoutId="nav-indicator" className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full ml-3 md:ml-0" />}
                </>
              )}
            </NavLink>
          )}
          {isOwner && (
            <NavLink
              to="/admin/loyalty"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <SlidersHorizontal size={18} />
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{t('atelier.nav.loyalty_config')}</span>
                  </div>
                  {isActive && <motion.div layoutId="nav-indicator" className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full ml-3 md:ml-0" />}
                </>
              )}
            </NavLink>
          )}
          {isOwner && (
            <NavLink
              to="/admin/analytics"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <BarChart3 size={18} />
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{t('atelier.nav.analytics')}</span>
                  </div>
                  {isActive && <motion.div layoutId="nav-indicator" className="w-1.5 h-1.5 bg-white dark:bg-black rounded-full ml-3 md:ml-0" />}
                </>
              )}
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex flex-col p-8 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
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
                <p className="text-zinc-400 dark:text-zinc-500 font-bold">
                  {user?.role === 'owner' ? t('atelier.owner_access') : user?.role?.replace('_', ' ') || 'Staff Access'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full py-3 border border-black dark:border-white text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-center"
            >
              {t('atelier.sign_out_exit')}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Footer (Only visible on small screens) */}
        <div className="md:hidden flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <button 
            onClick={() => {
              const newLang = i18n.language === 'en' ? 'ms' : 'en';
              void i18n.changeLanguage(newLang);
            }}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold"
          >
            {i18n.language === 'en' ? 'EN' : 'MY'}
          </button>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-400 font-bold">
            <ShieldCheck size={12} /> {user?.role === 'owner' ? 'Owner' : 'Staff'}
          </div>
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="text-[10px] uppercase tracking-widest text-red-500 font-bold"
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-12 py-8 md:py-16 relative">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={springTransition}
          className="max-w-6xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}

