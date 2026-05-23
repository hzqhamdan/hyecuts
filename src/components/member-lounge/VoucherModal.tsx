import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';
import type { Reward } from '../../types/loyalty';
import { useTranslation } from 'react-i18next';

interface VoucherModalProps {
  selectedVoucher: Reward | null;
  redemptionStatus: 'idle' | 'loading' | 'success' | 'error';
  onRedeem: (rewardId: number) => void;
  onClose: () => void;
}

export const VoucherModal = ({ selectedVoucher, redemptionStatus, onRedeem, onClose }: VoucherModalProps) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {selectedVoucher && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-black/95 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-[#F9F9F7] w-full max-w-lg relative overflow-hidden shadow-2xl"
            style={{ perspective: '1000px' }}
          >
            {/* Luxury Invitation Styling */}
            <div className="p-12 flex flex-col items-center text-center bg-[url('https://www.transparenttextures.com/patterns/paper.png')] bg-repeat">
              <div className="w-full border-t border-b border-luxury-black py-8 mb-12">
                <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-luxury-slate block mb-4">{t('lounge.exclusive_invitation')}</span>
                <h2 className="font-display text-4xl uppercase tracking-tighter mb-2">{t('common.the_studio')}</h2>
                <div className="h-px w-12 bg-luxury-black mx-auto mt-6" />
              </div>

              <div className="relative group mb-12">
                {/* Physical Card Feel */}
                <div className="bg-neutral-50 border border-luxury-black/20 p-10 flex flex-col items-center gap-8 w-72 shadow-sm">
                  <div className="bg-black p-6 rounded-none">
                    <Award className="w-20 h-20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="font-display text-lg uppercase tracking-tight leading-tight">
                      {t(`data.rewards.${selectedVoucher.title}.title`, { defaultValue: selectedVoucher.title })}
                    </div>
                    <div className="font-mono text-[10px] text-luxury-slate tracking-widest">
                      {t('lounge.cost')}: {selectedVoucher.pointsCost.toString()} {t('lounge.pts')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                {redemptionStatus === 'success' ? (
                  <div className="py-4 text-[10px] uppercase tracking-widest text-green-700 font-bold border border-green-200 bg-green-50">
                    {t('lounge.redemption_confirmed')}
                  </div>
                ) : redemptionStatus === 'error' ? (
                  <div className="py-4 text-[10px] uppercase tracking-widest text-red-700 font-bold border border-red-200 bg-red-50">
                    {t('lounge.insufficient_points')}
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onRedeem(selectedVoucher.id); }}
                    disabled={redemptionStatus === 'loading'}
                    className="bg-luxury-black text-white py-4 text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {redemptionStatus === 'loading' ? t('login.processing') : t('lounge.redeem_asset')}
                  </motion.button>
                )}
                
                <button
                  onClick={onClose}
                  className="text-[10px] uppercase tracking-widest text-luxury-slate hover:text-luxury-black transition-colors mt-2"
                >
                  {t('lounge.close_portfolio')}
                </button>
              </div>
            </div>

            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-luxury-black/10" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-luxury-black/10" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-luxury-black/10" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-luxury-black/10" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
