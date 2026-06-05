import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../store/useBookingStore';
import { SERVICE_CATEGORIES } from '../../data/hyecuts';

export default function ServicesSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openCategory, setOpenCategory, selectedService, setSelectedService } = useBookingStore();

  return (
    <section id="services" className="py-16 md:py-24 px-6 md:px-12 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-100 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 md:mb-14">
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 block font-bold">{t('landing.services_pricing')}</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-light tracking-tighter">{t('landing.services')}</h2>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Accordion Categories */}
          <div className="space-y-4">
            {SERVICE_CATEGORIES.map((categoryGroup) => {
              const isOpen = openCategory === categoryGroup.category;
              return (
                <div key={categoryGroup.category} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1A1A1A] transition-colors">
                  <button
                    onClick={() => { setOpenCategory(isOpen ? null : categoryGroup.category); }}
                    className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <span className="font-serif text-xl md:text-2xl italic">{t(`data.categories.${categoryGroup.category}` as any)}</span>
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
                        <div className="px-5 pb-5 pt-2 md:px-6 md:pb-6 space-y-3 border-t border-zinc-100 dark:border-zinc-800">
                          {categoryGroup.services.map((service) => {
                            const isServiceOpen = selectedService === service.name;
                            return (
                              <div 
                                key={service.name} 
                                onClick={() => { setSelectedService(isServiceOpen ? null : service.name); }}
                                className={`p-4 border-2 cursor-pointer transition-all duration-300 ${
                                  isServiceOpen 
                                    ? '!border-[#B8A070] bg-white dark:bg-[#1A1A1A]' 
                                    : 'border-transparent dark:border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1 gap-4">
                                  <div>
                                    <h4 className={`font-serif text-base sm:text-lg uppercase tracking-tight transition-colors ${isServiceOpen ? '!text-[#B8A070]' : 'text-black dark:text-white'}`}>
                                      {t(`data.services.${service.name}` as any)}
                                    </h4>
                                  </div>
                                  <span className={`font-mono text-[10px] sm:text-xs whitespace-nowrap font-bold transition-colors ${isServiceOpen ? '!text-[#B8A070]' : 'text-black dark:text-white'}`}>
                                    {service.price}
                                  </span>
                                </div>
                                <div className="flex gap-4 text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                                  <span>{service.duration}</span>
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
                                          navigate('/booking');
                                        }}
                                        className="w-full py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-800 hover:text-white dark:hover:text-white transition-colors flex items-center justify-center gap-2"
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
  );
}
