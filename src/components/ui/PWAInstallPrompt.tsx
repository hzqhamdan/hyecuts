import { motion } from 'framer-motion';
import { Smartphone, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function PWAInstallPrompt() {
  const { t } = useTranslation();
  const { isInstallable, install } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 bg-neutral-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-center"
    >
      <Smartphone className="w-8 h-8 mx-auto mb-4 text-[#B8A070]" />
      <h4 className="font-serif text-lg uppercase tracking-tight mb-2">
        {t('pwa.install_title')}
      </h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed max-w-xs mx-auto">
        {t('pwa.install_desc')}
      </p>
      <button
        onClick={() => { void install(); }}
        className="flex items-center gap-2 mx-auto px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
      >
        <Download className="w-3 h-3" />
        {t('pwa.install_button')}
      </button>
    </motion.div>
  );
}
