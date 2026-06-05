import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HYECUTS, TEAM_MEMBERS } from '../../data/hyecuts';

export default function ContactSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section id="contact" className="py-16 md:py-24 px-6 md:px-12 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        <div>
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 block font-bold">{t('landing.contact_details')}</span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-light tracking-tighter mb-8">{t('landing.visit_hyecuts')}</h2>
          <div className="space-y-8 text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <p className="text-black dark:text-white font-bold mb-2 uppercase tracking-widest text-[10px]">{t('landing.address')}</p>
              <p className="font-medium">{HYECUTS.address}</p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-bold">{t('landing.waze')}: {HYECUTS.waze}</p>
            </div>
            <div>
              <p className="text-black dark:text-white font-bold mb-2 uppercase tracking-widest text-[10px]">{t('landing.contact_details')}</p>
              <p className="font-medium">{HYECUTS.phone}</p>
              <p className="font-medium">{HYECUTS.email}</p>
            </div>
            <div>
              <p className="text-black dark:text-white font-bold mb-2 uppercase tracking-widest text-[10px]">{t('landing.team_members')}</p>
              <div className="space-y-1">
                {TEAM_MEMBERS.map((member) => (
                  <p key={member.name} className="font-medium">
                    {member.name} — <span className="text-zinc-400 dark:text-zinc-500">{t(`data.roles.${member.role}` as any)}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 transition-colors flex flex-col justify-between">
          <div>
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6 block font-bold">{t('landing.social')}</span>
            <div className="flex items-center gap-4">
              <a
                aria-label="Instagram"
                className="inline-flex items-center justify-center w-12 h-12 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                href={HYECUTS.instagram}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                aria-label="Facebook"
                className="inline-flex items-center justify-center w-12 h-12 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                href={HYECUTS.facebook}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M14.5 8H16V5.2C15.74 5.16 14.86 5 13.83 5C11.66 5 10.17 6.36 10.17 8.86V11H8V14.2H10.17V22H13.54V14.2H16.17L16.59 11H13.54V9.17C13.54 8.24 13.79 8 14.5 8Z" />
                </svg>
              </a>
            </div>
          </div>
          <button
            onClick={() => { navigate('/booking'); }}
            className="mt-12 px-8 py-5 bg-black dark:bg-white text-white dark:text-black text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-zinc-800 dark:hover:bg-zinc-800 hover:text-white dark:hover:text-white transition-all duration-500"
          >
            {t('landing.book_now')}
          </button>
        </div>
      </div>
    </section>
  );
}
