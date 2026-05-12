import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Scissors } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';

interface Booking {
  id: string;
  appointmentTime: string;
  status: string;
  totalPriceMyr: number;
  service: {
    name: string;
    durationMinutes: number;
  };
}

export default function UserBookings({ setView }: { setView: (view: string) => void }) {
  const { user } = useAuth();
  const USER_ID = user?.id || "00000000-0000-0000-0000-000000000000";
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/bookings/user/${USER_ID}`);
        if (res.ok) {
          setBookings(await res.json());
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [USER_ID]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white text-black px-6 py-12 md:px-12 md:py-16 font-sans"
    >
      <nav className="flex justify-between items-center max-w-5xl mx-auto mb-16">
        <button
          onClick={() => setView('lounge')}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Return to Lounge
        </button>
        <div className="font-display text-xl tracking-tighter uppercase font-medium italic">
          My Appointments
        </div>
      </nav>

      <div className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="text-center py-20 text-zinc-500 text-[10px] uppercase tracking-widest">
            Loading Appointments...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 border border-zinc-200 bg-neutral-50">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
            <h2 className="font-display text-2xl uppercase tracking-tighter mb-2">No Appointments Yet</h2>
            <p className="text-sm text-zinc-500 mb-8">You haven't made any bookings.</p>
            <button
              onClick={() => setView('booking')}
              className="px-8 py-4 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors"
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

              return (
                <div key={booking.id} className="border border-zinc-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-black transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                        booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-zinc-100 text-zinc-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl uppercase tracking-tight mb-4">{booking.service?.name || "Service"}</h3>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {dateStr}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {timeStr}
                      </div>
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4" /> {booking.service?.durationMinutes || 60} mins
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 border-zinc-200 pt-4 md:pt-0">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Total</div>
                    <div className="font-mono text-xl">RM {booking.totalPriceMyr.toFixed(2)}</div>
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
