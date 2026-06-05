import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Scissors, CalendarPlus, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

interface Booking {
  id: string;
  appointmentTime: string;
  status: string;
  totalPriceMyr: number;
  createdAt?: string;
  service: {
    name: string;
    durationMinutes: number;
  };
}

export default function UserBookings({ setView }: { setView: (view: string) => void }) {
  const { user } = useAuth();
  const USER_ID = user?.id ?? "00000000-0000-0000-0000-000000000000";

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['user-bookings', USER_ID],
    queryFn: () =>
      api.get<Booking[]>(`/bookings/user/${USER_ID}`),
    enabled: !!user?.id,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] p-4 sm:p-6 md:p-12 font-sans transition-colors duration-500"
    >
      <nav className="flex justify-between items-center max-w-5xl mx-auto mb-10 sm:mb-16">
        <button
          onClick={() => { setView('lounge'); }}
          className="flex items-center gap-2 sm:gap-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
        >
          <ArrowLeft className="w-3 h-3" /> <span className="hidden xs:inline">Return to Lounge</span><span className="xs:hidden">Lounge</span>
        </button>
        <div className="font-display text-lg sm:text-xl tracking-tighter uppercase font-medium italic text-black dark:text-white">
          My Appointments
        </div>
      </nav>

      <div className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="text-center py-20 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
            Loading Appointments...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 sm:py-20 border border-zinc-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900/50 transition-colors px-6">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-tighter mb-2 text-black dark:text-white">No Appointments Yet</h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-light italic">You haven't made any bookings.</p>
            <button
              onClick={() => { setView('booking'); }}
              className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98]"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => {
              const dateObj = new Date(booking.appointmentTime);
              const dateStr = dateObj.toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

  const generateICS = (booking: Booking) => {
    const startObj = new Date(booking.appointmentTime);
    const endObj = new Date(startObj.getTime() + (booking.service?.durationMinutes || 30) * 60000);

    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hyecuts Studio//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${booking.id}@hyecuts.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startObj)}`,
      `DTEND:${formatDate(endObj)}`,
      `SUMMARY:${booking.service?.name || 'Appointment'} at Hyecuts`,
      `DESCRIPTION:Your appointment for ${booking.service?.name || 'Service'} (${booking.service?.durationMinutes || 30} mins) at The Studio by Hyecuts.`,
      `LOCATION:3361 Jalan Sungai Penchala, Kuala Lumpur`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `hyecuts-appointment-${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
                <div key={booking.id} className="border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 bg-white dark:bg-[#1A1A1A] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-black dark:hover:border-white transition-all group">
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                        booking.status === 'COMPLETED' ? 'border-green-200 text-green-700 bg-green-50 dark:bg-green-900/10' :
                        booking.status === 'CANCELLED' ? 'border-red-200 text-red-700 bg-red-50 dark:bg-red-900/10' :
                        'border-zinc-200 text-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl italic tracking-tight mb-6 text-black dark:text-white group-hover:translate-x-1 transition-transform">{booking.service?.name || 'Service'}</h3>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#B8A070]" /> {dateStr}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#B8A070]" /> {timeStr}
                      </div>
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-[#B8A070]" /> {booking.service?.durationMinutes || 0} mins
                      </div>
                      {booking.createdAt && (
                        <div className="flex items-center gap-2 opacity-60">
                          Booked: {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 pt-5 md:pt-0 flex flex-col sm:flex-row md:flex-col justify-between items-start sm:items-end gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 font-bold">Total</div>
                      <div className="font-serif text-2xl sm:text-3xl text-black dark:text-white">RM {booking.totalPriceMyr.toFixed(2)}</div>
                    </div>
                    {booking.status === 'PENDING' && (
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => generateICS(booking)}
                          className="p-3 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors group/cal active:scale-95"
                          title="Add to Calendar"
                        >
                          <CalendarPlus className="w-4 h-4 text-zinc-500 group-hover/cal:text-black dark:group-hover/cal:text-white" />
                        </button>
                        <button 
                          className="flex items-center gap-2 px-4 py-3 border border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors text-black dark:text-white active:scale-95"
                          title="Reschedule Appointment"
                        >
                          <RefreshCw className="w-3 h-3" /> Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
