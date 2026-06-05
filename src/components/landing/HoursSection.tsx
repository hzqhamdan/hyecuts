import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_HOURS, BOOKING_POLICIES } from '../../data/hyecuts';

export default function HoursSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section id="hours" className="py-16 md:py-24 px-6 md:px-12 bg-white dark:bg-[#1A1A1A] transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div>
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 block font-bold">{t('landing.business_hours')}</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-light tracking-tighter mb-8">{t('landing.weekly_schedule')}</h2>
          <div className="space-y-4">
            {BUSINESS_HOURS.map((slot) => (
              <div key={slot.day} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <span className="text-xs md:text-sm uppercase tracking-widest font-bold">{t(`data.days.${slot.day}`)}</span>
                <span className={`text-xs md:text-sm font-medium ${slot.open ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}>{slot.hours}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 transition-colors">
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 block font-bold">{t('landing.booking_policies')}</span>
          <h3 className="font-serif text-2xl md:text-3xl italic mb-6">{t('landing.arrive_prepared')}</h3>
          <div className="space-y-4">
            {BOOKING_POLICIES.map((policy, idx) => (
              <p key={policy} className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                {t(`landing.policy_${idx + 1}`)}
              </p>
            ))}
          </div>
          <button
            onClick={() => { navigate('/booking'); }}
            className="mt-8 px-8 py-3 border border-black dark:border-white text-[10px] uppercase tracking-widest font-bold hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
          >
            {t('landing.reserve_slot')}
          </button>
        </div>
      </div>
    </section>
  );
}
