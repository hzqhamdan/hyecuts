import { User, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Booking } from '../../types/loyalty';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/client';

export function BookingsManager({ token }: { token: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['bookings', token],
    queryFn: () =>
      api.get<Booking[]>('/bookings/all', { token })
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      api.put(`/bookings/${id}/complete`, { token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings', token] });
    }
  });

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-5xl mb-4 font-light text-black dark:text-white">{t('atelier.bookings.active_title')}</h2>
        <p className="text-zinc-400 dark:text-zinc-500 font-sans uppercase tracking-widest text-[11px]">{t('atelier.bookings.management_subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
        {isLoading ? (
          <div className="p-20 bg-white dark:bg-[#1A1A1A] text-center text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-xs">{t('atelier.bookings.accessing')}</div>
        ) : bookings.filter(b => b.status === 'PENDING').length === 0 ? (
          <div className="p-20 bg-white dark:bg-[#1A1A1A] text-center text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-xs">{t('atelier.bookings.no_pending')}</div>
        ) : (
          bookings.filter(b => b.status === 'PENDING').map(booking => (
            <div key={booking.id} className="p-10 bg-white dark:bg-[#1A1A1A] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
              <div className="flex items-center gap-8">
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 dark:text-zinc-500">
                  <User size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-2xl italic text-black dark:text-white">{booking.user.fullName ?? booking.user.email}</h4>
                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(booking.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.appointmentTime).toLocaleDateString()}</span>
                    {booking.createdAt && (
                      <span className="ml-2 pl-4 border-l border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-600">
                        {t('atelier.bookings.booked_at', { defaultValue: 'Booked' })}: {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-black dark:text-white font-bold uppercase tracking-[0.2em] mt-2">{t(`data.services.${booking.service.name}` as any, { defaultValue: booking.service.name })}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">{t('atelier.bookings.total_fee')}</span>
                  <span className="font-serif text-2xl text-black dark:text-white">RM {booking.totalPriceMyr.toString()}</span>
                </div>
                <button
                  onClick={() => { completeMutation.mutate(booking.id); }}
                  disabled={completeMutation.isPending}
                  className="w-full md:w-auto px-10 py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={14} /> {completeMutation.isPending ? t('atelier.bookings.completing') : t('atelier.bookings.complete_award')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-24">
        <h3 className="font-serif text-2xl italic mb-8 text-black dark:text-white">{t('atelier.bookings.completed_today')}</h3>
        <div className="space-y-4">
           {bookings.filter(b => b.status === 'COMPLETED').slice(0, 5).map(b => (
             <div key={b.id} className="p-6 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center opacity-60">
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">{b.user.email}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">— {t(`data.services.${b.service.name}` as any, { defaultValue: b.service.name })}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{new Date(b.appointmentTime).toLocaleTimeString()}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
