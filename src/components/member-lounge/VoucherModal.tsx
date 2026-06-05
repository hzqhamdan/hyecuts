import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import { Reward } from '../../types/loyalty';

interface VoucherModalProps {
  voucher: Reward | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  onClose: () => void;
  onConfirmRedeem: () => void;
}

const VoucherModal = ({ voucher, status, onClose, onConfirmRedeem }: VoucherModalProps) => {
  const { t } = useTranslation();

  return (
    <>
      {voucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
          <div className="bg-[#F9F9F7] dark:bg-[#1A1A1A] w-full max-w-lg relative overflow-hidden shadow-2xl">
            {/* Luxury Invitation Styling */}
            <div className="p-12 flex flex-col items-center text-center bg-repeat">
              <div className="w-full border-t border-b border-black dark:border-white py-8 mb-12">
                <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 block mb-4">{t('lounge.exclusive_invitation')}</span>
                <h2 className="font-serif text-4xl uppercase tracking-tighter mb-2">{t('common.the_studio')}</h2>
                <div className="h-px w-12 bg-black dark:bg-white mx-auto mt-6" />
              </div>

              <div className="relative group mb-12">
                {/* Physical Card Feel */}
                <div className="bg-neutral-50 dark:bg-zinc-900 border border-black/20 dark:border-white/10 p-10 flex flex-col items-center gap-8 w-72 shadow-sm transition-colors">
                  <div className="bg-black dark:bg-white p-6 rounded-none transition-colors">
                    <Award className="w-20 h-20 text-white dark:text-black" />
                  </div>
                  <div className="space-y-2">
                    <div className="font-serif text-lg uppercase tracking-tight leading-tight text-black dark:text-white">{voucher.title}</div>
                    <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 tracking-widest">
                      {t('lounge.cost')}: {voucher.pointsCost.toString()} {t('lounge.pts')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                {status === 'success' ? (
                  <div className="py-4 text-[10px] uppercase tracking-widest text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10">
                    {t('lounge.redemption_confirmed')}
                  </div>
                ) : status === 'error' ? (
                  <div className="py-4 text-[10px] uppercase tracking-widest text-red-700 dark:text-red-400 font-bold border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10">
                    {t('lounge.insufficient_points')}
                  </div>
                ) : (
                  <button onClick={onConfirmRedeem}
                    disabled={status === 'loading'}
                    className="bg-black dark:bg-white text-white dark:text-black py-4 text-[10px] uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {status === 'loading' ? t('login.processing') : t('lounge.redeem_asset')}
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors mt-2"
                >
                  {t('lounge.close_portfolio')}
                </button>
              </div>
            </div>

            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-black/10 dark:border-white/10" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-black/10 dark:border-white/10" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-black/10 dark:border-white/10" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-black/10 dark:border-white/10" />
          </div>
        </div>
      )}
    </>
  );
};

export default VoucherModal;
