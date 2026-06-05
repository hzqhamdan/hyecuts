import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fadeUp, staggerContainer } from '../../utils/animations';
import { HYECUTS } from '../../data/hyecuts';

export default function HeroSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 text-center pt-24">
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col items-center">
          <motion.span variants={fadeUp} className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-500 mb-6 block font-bold">
            {HYECUTS.name}
          </motion.span>
          <motion.h1 variants={fadeUp} className="font-serif text-5xl sm:text-7xl md:text-9xl leading-tight font-light italic tracking-tighter mb-6 text-balance">
            {t('hero.title')}<span className="text-zinc-300 dark:text-zinc-700">.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-2xl text-base md:text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10 font-light italic px-4">
            {t('hero.subtitle')}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 sm:px-0">
            <button
              onClick={() => { navigate('/booking'); }}
              className="group relative px-10 py-5 bg-black dark:bg-white text-white dark:text-black overflow-hidden transition-all duration-500 hover:bg-zinc-800 dark:hover:bg-zinc-800 hover:text-white dark:hover:text-white"
            >
              <span className="relative z-10 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">{t('hero.cta_primary')}</span>
              <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-10px] group-hover:translate-x-0" size={16} />
            </button>
            <button
              onClick={() => { navigate('/lounge'); }}
              className="px-10 py-5 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-500"
            >
              {t('hero.cta_secondary')}
            </button>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-12 text-[10px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 font-bold">
            {t('footer.location')}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
