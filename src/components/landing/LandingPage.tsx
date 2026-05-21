import React, { useState } from 'react';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X, ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BOOKING_POLICIES, BUSINESS_HOURS, HYECUTS, SERVICE_CATEGORIES, TEAM_MEMBERS } from '../../data/hyecuts';

interface LandingPageProps {
  setView: (view: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>('Haircuts');
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    void i18n.changeLanguage(newLang);
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.14 },
    },
  };

  const navTap = { scale: 0.94, y: 1 };
  const navTapTransition = { type: 'spring' as const, stiffness: 420, damping: 24 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden"
    >
      <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center backdrop-blur-md bg-white/80 border-b border-zinc-100">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-serif text-xl tracking-tighter uppercase font-light italic"
        >
          Hyecuts
        </motion.div>

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
                className="hover:text-zinc-400 transition-colors duration-300"
              >
                {t(`nav.${item}`)}
              </motion.a>
            ))}
            <motion.button
              onClick={() => { setView('lounge'); }}
              whileTap={navTap}
              transition={navTapTransition}
              className="hover:text-zinc-400 transition-colors duration-300 uppercase"
            >
              {t('nav.lounge')}
            </motion.button>
            <motion.button
              onClick={toggleLanguage}
              whileTap={navTap}
              transition={navTapTransition}
              className="flex items-center gap-2 hover:text-zinc-400 transition-colors duration-300 uppercase border-l border-zinc-200 pl-10"
            >
              <Globe size={12} />
              {i18n.language === 'en' ? 'MS' : 'EN'}
            </motion.button>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => { setView('booking'); }}
              whileTap={navTap}
              transition={navTapTransition}
              className="hidden md:block px-6 py-2 text-[10px] uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all duration-500 font-bold active:scale-95"
            >
              {t('nav.book')}
            </motion.button>
            <motion.button 
              className="md:hidden active:scale-90 transition-transform duration-200" 
              onClick={() => { setIsMenuOpen(!isMenuOpen); }}
              whileTap={navTap}
              transition={navTapTransition}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
      </nav>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-40 bg-white pt-24 px-10 flex flex-col gap-8 text-center"
        >
          {['services', 'hours', 'contact'].map((item) => (
            <motion.a
              key={item}
              href={`#${item}`}
              className="text-4xl font-serif italic tracking-tight capitalize"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                document.getElementById(item)?.scrollIntoView({ behavior: 'smooth' });
              }}
              whileTap={navTap}
              transition={navTapTransition}
              >
                {t(`nav.${item}`)}
              </motion.a>
            ))}
            <motion.button
              onClick={() => {
                setIsMenuOpen(false);
                setView('lounge');
              }}
              whileTap={navTap}
              transition={navTapTransition}
              className="text-4xl font-serif italic tracking-tight capitalize"
            >
              {t('nav.lounge')}
            </motion.button>
            <motion.button
              onClick={() => {
                setIsMenuOpen(false);
                toggleLanguage();
              }}
              whileTap={navTap}
              transition={navTapTransition}
              className="text-4xl font-serif italic tracking-tight capitalize"
            >
              {i18n.language === 'en' ? 'Bahasa Malaysia' : 'English'}
            </motion.button>
            <motion.button
              onClick={() => {
                setIsMenuOpen(false);
                setView('booking');
              }}
              whileTap={navTap}
              transition={navTapTransition}
              className="mt-4 px-8 py-4 bg-black text-white uppercase tracking-widest text-xs font-bold"
            >
              {t('nav.book')}
            </motion.button>
          </motion.div>
      )}

      <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 text-center pt-24">
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col items-center">
            <motion.span variants={fadeUp} className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 mb-6 block">
              {HYECUTS.name}
            </motion.span>
            <motion.h1 variants={fadeUp} className="font-serif text-6xl md:text-9xl leading-tight font-light italic tracking-tighter mb-6">
              {t('hero.title')}<span className="text-zinc-300">.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="max-w-2xl text-lg md:text-xl text-zinc-500 leading-relaxed mb-10 font-light italic">
              {t('hero.subtitle')}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => { setView('booking'); }}
                className="group relative px-10 py-5 bg-black text-white overflow-hidden transition-all duration-500 hover:bg-zinc-800"
              >
                <span className="relative z-10 text-xs uppercase tracking-[0.2em] font-bold">{t('hero.cta_primary')}</span>
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-10px] group-hover:translate-x-0" size={16} />
              </button>
              <button
                onClick={() => { setView('lounge'); }}
                className="px-10 py-5 text-xs uppercase tracking-[0.2em] font-bold border border-black hover:bg-black hover:text-white transition-all duration-500"
              >
                {t('hero.cta_secondary')}
              </button>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-12 text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {t('footer.location')}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="services" className="py-24 px-6 md:px-12 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">{t('landing.services_pricing')}</span>
            <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tighter">{t('landing.services')}</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Accordion Categories */}
            <div className="space-y-4">
              {SERVICE_CATEGORIES.map((categoryGroup) => {
                const isOpen = openCategory === categoryGroup.category;
                return (
                  <div key={categoryGroup.category} className="border border-zinc-200 bg-white">
                    <button
                      onClick={() => { setOpenCategory(isOpen ? null : categoryGroup.category); }}
                      className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                    >
                      <span className="font-serif text-2xl italic">{t(`data.categories.${categoryGroup.category}` as any)}</span>
                      <ChevronDown
                        className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        size={20}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-2 space-y-3 border-t border-zinc-100">
                            {categoryGroup.services.map((service) => {
                              const isServiceOpen = selectedService === service.name;
                              return (
                                <div 
                                  key={service.name} 
                                  onClick={() => { setSelectedService(isServiceOpen ? null : service.name); }}
                                  className={`p-4 border cursor-pointer transition-all duration-300 group ${
                                    isServiceOpen ? 'border-black bg-neutral-50' : 'border-transparent hover:border-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">{t(`data.services.${service.name}` as any)}</h4>
                                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{service.duration}</div>
                                    </div>
                                    <div className="font-mono text-xs bg-zinc-50 px-3 py-1 group-hover:bg-zinc-100 transition-colors">
                                      {service.price}
                                    </div>
                                  </div>
                                  
                                  <AnimatePresence>
                                    {isServiceOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                        animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setView('booking');
                                          }}
                                          className="w-full py-3 bg-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                          {t('landing.book_now')} <ArrowRight size={14} />
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="hours" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">{t('landing.business_hours')}</span>
            <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tighter mb-8">{t('landing.weekly_schedule')}</h2>
            <div className="space-y-4">
              {BUSINESS_HOURS.map((slot) => (
                <div key={slot.day} className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <span className="text-sm uppercase tracking-widest">{t(`data.days.${slot.day}` as any)}</span>
                  <span className={`text-sm ${slot.open ? 'text-black' : 'text-zinc-400'}`}>{slot.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 p-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">{t('landing.booking_policies')}</span>
            <h3 className="font-serif text-3xl italic mb-6">{t('landing.arrive_prepared')}</h3>
            <div className="space-y-4">
              {BOOKING_POLICIES.map((policy, idx) => (
                <p key={policy} className="text-sm text-zinc-600 leading-relaxed">
                  {t(`landing.policy_${idx + 1}` as any)}
                </p>
              ))}
            </div>
            <button
              onClick={() => { setView('booking'); }}
              className="mt-8 px-8 py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all"
            >
              {t('landing.reserve_slot')}
            </button>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 px-6 md:px-12 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">{t('landing.contact_details')}</span>
            <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tighter mb-8">{t('landing.visit_hyecuts')}</h2>
            <div className="space-y-6 text-sm text-zinc-600">
              <div>
                <p className="text-black font-bold mb-1 uppercase tracking-widest text-[10px]">{t('landing.address')}</p>
                <p>{HYECUTS.address}</p>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-400">{t('landing.waze')}: {HYECUTS.waze}</p>
              </div>
              <div>
                <p className="text-black font-bold mb-1 uppercase tracking-widest text-[10px]">{t('landing.contact_details')}</p>
                <p>{HYECUTS.phone}</p>
                <p>{HYECUTS.email}</p>
              </div>
              <div>
                <p className="text-black font-bold mb-1 uppercase tracking-widest text-[10px]">{t('landing.team_members')}</p>
                {TEAM_MEMBERS.map((member) => (
                  <p key={member.name}>
                    {member.name} — {t(`data.roles.${member.role}` as any)}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">{t('landing.social')}</span>
            <div className="flex items-center gap-4">
              <a
                aria-label="Instagram"
                className="inline-flex items-center justify-center w-10 h-10 border border-zinc-200 hover:bg-zinc-100 transition-colors"
                href={HYECUTS.instagram}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                aria-label="Facebook"
                className="inline-flex items-center justify-center w-10 h-10 border border-zinc-200 hover:bg-zinc-100 transition-colors"
                href={HYECUTS.facebook}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                  <path d="M14.5 8H16V5.2C15.74 5.16 14.86 5 13.83 5C11.66 5 10.17 6.36 10.17 8.86V11H8V14.2H10.17V22H13.54V14.2H16.17L16.59 11H13.54V9.17C13.54 8.24 13.79 8 14.5 8Z" />
                </svg>
              </a>
            </div>
            <button
              onClick={() => { setView('booking'); }}
              className="mt-8 px-8 py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-zinc-800 transition-all duration-500"
            >
              {t('landing.book_now')}
            </button>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 md:px-12 border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="font-serif text-4xl font-light tracking-tighter italic">
            Hyecuts<span className="text-zinc-300">.</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400">
            {HYECUTS.address}
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default LandingPage;
